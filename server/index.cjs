const express = require('express')
const cors = require('cors')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

const PORT = Number(process.env.PORT || 4000)
const SESSION_TTL_HOURS = Number(process.env.AUTH_SESSION_TTL_HOURS || 168)
const ADMIN_RESET_SECRET = process.env.ADMIN_RESET_SECRET || 'tailormade-local-admin'
const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'runtime.json')

const EMPTY_DB = {
  users: [],
  sessions: [],
  customers: [],
  jobs: [],
  measurements: [],
}

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, `${JSON.stringify(EMPTY_DB, null, 2)}\n`, 'utf8')
  }
}

function readDb() {
  ensureDataFile()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      ...EMPTY_DB,
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      measurements: Array.isArray(parsed.measurements) ? parsed.measurements : [],
    }
  } catch {
    writeDb(EMPTY_DB)
    return { ...EMPTY_DB }
  }
}

function writeDb(db) {
  ensureDataFile()
  fs.writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
}

function nowIso() {
  return new Date().toISOString()
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`
}

function createHttpError(status, message, extra = {}) {
  const error = new Error(message)
  error.status = status
  Object.assign(error, extra)
  return error
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('234') && digits.length === 13) {
    return digits
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `234${digits.slice(1)}`
  }
  if (digits.length === 10) {
    return `234${digits}`
  }
  throw createHttpError(400, 'Enter a valid Nigerian phone number.')
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase()
}

function requireNonEmptyString(value, fieldName) {
  const trimmed = String(value || '').trim()
  if (!trimmed) {
    throw createHttpError(400, `${fieldName} is required.`)
  }
  return trimmed
}

function requirePassword(passwordInput) {
  const password = String(passwordInput || '')
  if (password.trim().length < 6) {
    throw createHttpError(400, 'Password must be at least 6 characters.')
  }
  if (password.length > 64) {
    throw createHttpError(400, 'Password must be 64 characters or less.')
  }
  return password
}

function hashSecret(secret) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(secret, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifySecret(secret, encoded) {
  const [salt, storedHash] = String(encoded || '').split(':')
  if (!salt || !storedHash) {
    return false
  }
  const hash = crypto.scryptSync(secret, salt, 64).toString('hex')
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(a, b)
}

function cleanupExpiredSessions(db) {
  const now = Date.now()
  const filtered = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > now)
  if (filtered.length !== db.sessions.length) {
    db.sessions = filtered
    writeDb(db)
  }
}

function createSession(db, user) {
  cleanupExpiredSessions(db)
  const createdAt = nowIso()
  const expiresAt = new Date(
    Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString()
  const session = {
    token: crypto.randomBytes(24).toString('hex'),
    userId: user.id,
    createdAt,
    expiresAt,
  }
  db.sessions.push(session)
  writeDb(db)
  return {
    token: session.token,
    userId: user.id,
    phone: user.phone,
    username: user.username,
  }
}

function toMeasurementSnapshot(record) {
  return {
    templateId: 'measurement-record',
    templateName: record.measurementName,
    fields: record.parts.map((part) => ({
      key: part.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: part.label,
      unit: part.unit,
      value: String(part.value),
    })),
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a, b) {
  return a.toDateString() === b.toDateString()
}

function endOfWeek(date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? 0 : 7 - day
  copy.setDate(copy.getDate() + diff)
  return startOfDay(copy)
}

function calculateUrgencyMetrics(jobs) {
  const now = startOfDay(new Date())
  const weekEnd = endOfWeek(now)
  const month = now.getMonth()
  const year = now.getFullYear()

  const activeJobs = jobs.filter((job) => job.status !== 'delivered')
  const deliveredJobs = jobs.filter((job) => job.status === 'delivered')

  const overdueJobs = activeJobs.filter((job) => {
    const delivery = startOfDay(new Date(job.deliveryDate))
    return delivery < now
  }).length

  const dueToday = activeJobs.filter((job) =>
    sameDay(startOfDay(new Date(job.deliveryDate)), now),
  ).length

  const dueThisWeek = activeJobs.filter((job) => {
    const delivery = startOfDay(new Date(job.deliveryDate))
    return delivery >= now && delivery <= weekEnd
  }).length

  const thisMonthIncome = deliveredJobs.reduce((sum, job) => {
    const deliveredAt = new Date(job.updatedAt)
    if (deliveredAt.getMonth() === month && deliveredAt.getFullYear() === year) {
      return sum + Number(job.agreedPrice || 0)
    }
    return sum
  }, 0)

  return { overdueJobs, dueToday, dueThisWeek, thisMonthIncome }
}

function sanitizeCustomer(db, customer) {
  const jobCount = db.jobs.filter((job) => job.userId === customer.userId && job.customerId === customer.id).length
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    jobCount,
  }
}

function sanitizeMeasurement(record) {
  return {
    id: record.id,
    customerId: record.customerId,
    measurementName: record.measurementName,
    parts: record.parts,
    createdAt: record.createdAt,
    linkedJobId: record.linkedJobId ?? null,
    inspirationPhotos: record.inspirationPhotos ?? [],
    fabricPhotos: record.fabricPhotos ?? [],
  }
}

function sanitizeJob(job) {
  return {
    id: job.id,
    customerId: job.customerId,
    customerName: job.customerName,
    deliveryDate: job.deliveryDate,
    agreedPrice: job.agreedPrice,
    status: job.status,
    measurementSnapshot: job.measurementSnapshot,
    measurementRecordId: job.measurementRecordId ?? null,
    styleImageUrl: job.styleImageUrl,
    fabricImageUrl: job.fabricImageUrl,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }
}

function requireCustomer(db, userId, customerId) {
  const customer = db.customers.find(
    (item) => item.id === customerId && item.userId === userId,
  )
  if (!customer) {
    throw createHttpError(404, 'Customer not found.')
  }
  return customer
}

function requireMeasurement(db, userId, measurementId) {
  const record = db.measurements.find(
    (item) => item.id === measurementId && item.userId === userId,
  )
  if (!record) {
    throw createHttpError(404, 'Measurement record not found.')
  }
  return record
}

function requireJob(db, userId, jobId) {
  const job = db.jobs.find((item) => item.id === jobId && item.userId === userId)
  if (!job) {
    throw createHttpError(404, 'Job not found.')
  }
  return job
}

function validateParts(partsInput) {
  if (!Array.isArray(partsInput) || partsInput.length === 0) {
    throw createHttpError(400, 'At least one measurement part is required.')
  }

  const parts = partsInput.map((part) => {
    const label = requireNonEmptyString(part?.label, 'Measurement label')
    const value = Number(part?.value)
    if (!Number.isFinite(value) || value <= 0) {
      throw createHttpError(400, `Measurement "${label}" must be greater than 0.`)
    }
    return {
      label,
      value,
      unit: 'inches',
    }
  })

  return parts
}

function createJobRecord(db, user, customer, payload) {
  const createdAt = nowIso()
  const job = {
    id: createId('job'),
    userId: user.id,
    customerId: customer.id,
    customerName: customer.name,
    deliveryDate: requireNonEmptyString(payload.deliveryDate, 'Delivery date'),
    agreedPrice: Number(payload.agreedPrice),
    status: payload.status || 'ongoing',
    measurementSnapshot: payload.measurementSnapshot,
    measurementRecordId: payload.measurementRecordId ?? null,
    styleImageUrl: payload.styleImageUrl,
    fabricImageUrl: payload.fabricImageUrl,
    createdAt,
    updatedAt: createdAt,
  }

  if (!Number.isFinite(job.agreedPrice) || job.agreedPrice <= 0) {
    throw createHttpError(400, 'Agreed price must be greater than 0.')
  }
  if (!job.measurementSnapshot || !Array.isArray(job.measurementSnapshot.fields)) {
    throw createHttpError(400, 'Measurement snapshot is required.')
  }

  db.jobs.push(job)
  customer.updatedAt = nowIso()
  return job
}

const app = express()

app.use(
  cors(
    process.env.CORS_ORIGIN
      ? {
          origin: process.env.CORS_ORIGIN.split(',').map((value) => value.trim()),
        }
      : { origin: true },
  ),
)
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || ''
    const [, token] = header.match(/^Bearer\s+(.+)$/i) || []
    if (!token) {
      throw createHttpError(401, 'Authorization token is required.')
    }

    const db = readDb()
    cleanupExpiredSessions(db)
    const session = db.sessions.find((item) => item.token === token)
    if (!session) {
      throw createHttpError(401, 'Session expired. Please log in again.')
    }

    const user = db.users.find((item) => item.id === session.userId)
    if (!user) {
      throw createHttpError(401, 'Account not found for this session.')
    }

    req.authUser = user
    next()
  } catch (error) {
    next(error)
  }
}

app.post('/auth/register', (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone)
    const username = requireNonEmptyString(req.body?.username, 'Username')
    const password = requirePassword(req.body?.password)
    const db = readDb()

    const existing = db.users.find((user) => user.phone === phone)
    if (existing) {
      throw createHttpError(409, 'Account already exists. Log in instead.')
    }

    const createdAt = nowIso()
    const user = {
      id: createId('usr'),
      phone,
      username,
      passwordHash: hashSecret(password),
      createdAt,
      updatedAt: createdAt,
    }

    db.users.push(user)
    const session = createSession(db, user)
    res.status(201).json(session)
  } catch (error) {
    next(error)
  }
})

app.post('/auth/login', (req, res, next) => {
  try {
    const phone = normalizePhone(req.body?.phone)
    const password = requirePassword(req.body?.password)
    const db = readDb()

    const user = db.users.find((item) => item.phone === phone)
    if (!user) {
      throw createHttpError(404, 'No account found for this phone number. Sign up first.')
    }
    const storedSecret = user.passwordHash || user.pinHash
    if (!verifySecret(password, storedSecret)) {
      throw createHttpError(401, 'Invalid phone number or password.')
    }
    if (!user.passwordHash && user.pinHash) {
      user.passwordHash = user.pinHash
      delete user.pinHash
      user.updatedAt = nowIso()
      writeDb(db)
    }

    const session = createSession(db, user)
    res.json(session)
  } catch (error) {
    next(error)
  }
})

app.post('/admin/reset-password', (req, res, next) => {
  try {
    const adminSecret = String(req.headers['x-admin-secret'] || '')
    if (adminSecret !== ADMIN_RESET_SECRET) {
      throw createHttpError(401, 'Invalid admin reset secret.')
    }

    const phone = normalizePhone(req.body?.phone)
    const newPassword = requirePassword(req.body?.newPassword)
    const db = readDb()
    const user = db.users.find((item) => item.phone === phone)

    if (!user) {
      throw createHttpError(404, 'No account found for this phone number.')
    }

    user.passwordHash = hashSecret(newPassword)
    delete user.pinHash
    user.updatedAt = nowIso()
    db.sessions = db.sessions.filter((session) => session.userId !== user.id)
    writeDb(db)

    res.json({ success: true, message: 'Password reset successfully.' })
  } catch (error) {
    next(error)
  }
})

app.post('/auth/verify-otp', (_req, _res, next) => {
  next(createHttpError(410, 'OTP auth is disabled on this backend. Use phone and password.'))
})

app.patch('/auth/profile', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const user = db.users.find((item) => item.id === req.authUser.id)
    if (!user) {
      throw createHttpError(404, 'Account not found.')
    }

    user.username = requireNonEmptyString(req.body?.username, 'Username')
    user.updatedAt = nowIso()
    writeDb(db)

    res.json({
      token: String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''),
      userId: user.id,
      phone: user.phone,
      username: user.username,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/customers', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const query = String(req.query.search || '').trim().toLowerCase()
    const customers = db.customers
      .filter((customer) => customer.userId === req.authUser.id)
      .filter((customer) => {
        if (!query) {
          return true
        }
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.phone.toLowerCase().includes(query)
        )
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((customer) => sanitizeCustomer(db, customer))

    res.json(customers)
  } catch (error) {
    next(error)
  }
})

app.post('/customers', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const userId = req.authUser.id
    const name = requireNonEmptyString(req.body?.name, 'Customer name')
    const phone = normalizePhone(req.body?.phone)
    const notes = String(req.body?.notes || '').trim() || undefined

    const scopedCustomers = db.customers.filter((customer) => customer.userId === userId)
    const existingByName = scopedCustomers.find(
      (customer) => normalizeName(customer.name) === normalizeName(name),
    )
    const existingByPhone = scopedCustomers.find((customer) => customer.phone === phone)

    if (existingByPhone && (!existingByName || existingByPhone.id !== existingByName.id)) {
      res.status(409).json({
        message: 'Customer phone already exists.',
        code: 'DUPLICATE_PHONE',
        existingCustomer: sanitizeCustomer(db, existingByPhone),
      })
      return
    }

    if (existingByName) {
      existingByName.phone = phone
      existingByName.notes = notes
      existingByName.updatedAt = nowIso()
      writeDb(db)
      res.json(sanitizeCustomer(db, existingByName))
      return
    }

    const created = {
      id: createId('cus'),
      userId,
      name,
      phone,
      notes,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    db.customers.push(created)
    writeDb(db)
    res.status(201).json(sanitizeCustomer(db, created))
  } catch (error) {
    next(error)
  }
})

app.get('/customers/:customerId/measurements', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    requireCustomer(db, req.authUser.id, req.params.customerId)

    const records = db.measurements
      .filter(
        (record) =>
          record.userId === req.authUser.id && record.customerId === req.params.customerId,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(sanitizeMeasurement)

    res.json(records)
  } catch (error) {
    next(error)
  }
})

app.post('/customers/:customerId/measurements', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    requireCustomer(db, req.authUser.id, req.params.customerId)
    const measurementName = requireNonEmptyString(
      req.body?.measurementName,
      'Measurement name',
    )
    const parts = validateParts(req.body?.parts)

    const record = {
      id: createId('measure'),
      userId: req.authUser.id,
      customerId: req.params.customerId,
      measurementName,
      parts,
      createdAt: nowIso(),
      linkedJobId: null,
      inspirationPhotos: Array.isArray(req.body?.inspirationPhotos)
        ? req.body.inspirationPhotos
        : [],
      fabricPhotos: Array.isArray(req.body?.fabricPhotos) ? req.body.fabricPhotos : [],
    }

    db.measurements.push(record)
    writeDb(db)
    res.status(201).json(sanitizeMeasurement(record))
  } catch (error) {
    next(error)
  }
})

app.delete('/measurements/:measurementId', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    requireMeasurement(db, req.authUser.id, req.params.measurementId)
    db.measurements = db.measurements.filter((item) => item.id !== req.params.measurementId)
    writeDb(db)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.post('/measurements/:measurementId/create-job', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const measurement = requireMeasurement(db, req.authUser.id, req.params.measurementId)
    const customer = requireCustomer(db, req.authUser.id, measurement.customerId)

    const job = createJobRecord(db, req.authUser, customer, {
      deliveryDate: req.body?.deliveryDate,
      agreedPrice: req.body?.agreedPrice,
      status: req.body?.status,
      measurementSnapshot: toMeasurementSnapshot(measurement),
      measurementRecordId: measurement.id,
    })

    measurement.linkedJobId = job.id
    writeDb(db)
    res.status(201).json(sanitizeJob(job))
  } catch (error) {
    next(error)
  }
})

app.patch('/measurements/:measurementId/create-job', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const measurement = requireMeasurement(db, req.authUser.id, req.params.measurementId)
    const linkedJobId = String(req.body?.linkedJobId || '').trim()
    measurement.linkedJobId = linkedJobId || null
    writeDb(db)
    res.json(sanitizeMeasurement(measurement))
  } catch (error) {
    next(error)
  }
})

app.get('/jobs', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const jobs = db.jobs
      .filter((job) => job.userId === req.authUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(sanitizeJob)

    res.json(jobs)
  } catch (error) {
    next(error)
  }
})

app.post('/jobs', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const customer = requireCustomer(db, req.authUser.id, req.body?.customerId)
    const job = createJobRecord(db, req.authUser, customer, req.body || {})

    if (req.body?.measurementRecordId) {
      const measurement = db.measurements.find(
        (item) =>
          item.id === req.body.measurementRecordId && item.userId === req.authUser.id,
      )
      if (measurement) {
        measurement.linkedJobId = job.id
      }
    }

    writeDb(db)
    res.status(201).json(sanitizeJob(job))
  } catch (error) {
    next(error)
  }
})

app.patch('/jobs/:jobId', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const job = requireJob(db, req.authUser.id, req.params.jobId)
    const payload = req.body || {}

    if (payload.deliveryDate !== undefined) {
      job.deliveryDate = requireNonEmptyString(payload.deliveryDate, 'Delivery date')
    }
    if (payload.agreedPrice !== undefined) {
      const agreedPrice = Number(payload.agreedPrice)
      if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
        throw createHttpError(400, 'Agreed price must be greater than 0.')
      }
      job.agreedPrice = agreedPrice
    }
    if (payload.status !== undefined) {
      if (!['ongoing', 'ready', 'delivered'].includes(payload.status)) {
        throw createHttpError(400, 'Invalid job status.')
      }
      job.status = payload.status
    }
    if (payload.measurementSnapshot !== undefined) {
      if (!payload.measurementSnapshot || !Array.isArray(payload.measurementSnapshot.fields)) {
        throw createHttpError(400, 'Measurement snapshot is invalid.')
      }
      job.measurementSnapshot = payload.measurementSnapshot
    }

    job.updatedAt = nowIso()
    writeDb(db)
    res.json(sanitizeJob(job))
  } catch (error) {
    next(error)
  }
})

app.get('/dashboard', requireAuth, (req, res, next) => {
  try {
    const db = readDb()
    const jobs = db.jobs.filter((job) => job.userId === req.authUser.id)
    const customers = db.customers.filter((customer) => customer.userId === req.authUser.id)
    const counts = new Map()

    jobs.forEach((job) => {
      counts.set(job.customerId, (counts.get(job.customerId) || 0) + 1)
    })

    const mostFrequentCustomers = customers
      .map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        orderCount: counts.get(customer.id) || 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5)

    res.json({
      ...calculateUrgencyMetrics(jobs),
      mostFrequentCustomers,
    })
  } catch (error) {
    next(error)
  }
})

app.use((_req, _res, next) => {
  next(createHttpError(404, 'Route not found.'))
})

app.use((error, _req, res, _next) => {
  const status = Number(error?.status) || 500
  const message =
    typeof error?.message === 'string' && error.message.trim()
      ? error.message
      : 'Internal server error.'
  res.status(status).json({ message })
})

app.listen(PORT, () => {
  ensureDataFile()
  console.log(`Tailormade backend listening on http://127.0.0.1:${PORT}`)
})
