import { useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/layout'
import { Skeleton } from '@/components/primitives'
import { useCustomersQuery } from '@/features/customers/customerHooks'

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const customersQuery = useCustomersQuery()

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return customersQuery.data ?? []
    }

    return (customersQuery.data ?? []).filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
      )
    })
  }, [customersQuery.data, search])

  return (
    <div>
      <AppHeader />

      <section className="mt-8">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight text-black">
          Customers
        </h1>
        <p className="mt-2 text-base text-gray-500 leading-relaxed">
          View your customers and jump into their profiles quickly.
        </p>
      </section>

      <div className="relative mt-6">
        <Search
          size={24}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search customers"
          className="w-full h-12 rounded-xl border border-gray-200 pl-12 pr-4 text-base text-gray-700 placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-black/5"
        />
      </div>

      {customersQuery.isLoading ? (
        <div className="mt-6 space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`customer-skeleton-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="border-t border-gray-200 p-5">
                <Skeleton className="h-7 w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {customersQuery.isError ? (
        <p className="mt-10 text-base font-medium text-error">Unable to load customers.</p>
      ) : null}

      {!customersQuery.isLoading && !customersQuery.isError ? (
        filteredCustomers.length === 0 ? (
          <div className="min-h-[45vh] flex items-center justify-center">
            <p className="text-lg font-semibold text-gray-700">No customers yet</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="tap-feedback block overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="p-6">
                  <h3 className="text-[20px] font-semibold tracking-tight leading-tight text-gray-900">
                    {customer.name}
                  </h3>
                  <p className="mt-3 text-base text-gray-500 leading-relaxed">{customer.phone}</p>
                </div>

                <div className="border-t border-gray-200 p-5">
                  <span className="inline-flex items-center gap-2 text-[16px] font-semibold text-gray-900 leading-tight">
                    View Profile
                    <ArrowUpRight size={20} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : null}

      <div className="fixed left-0 right-0 bottom-24 z-20">
        <div className="max-w-md mx-auto px-5">
          <Link
            to="/jobs/new"
            className="tap-feedback inline-flex h-14 w-full items-center justify-center rounded-xl bg-black text-lg font-semibold text-white shadow-sm"
          >
            Take Measurement
          </Link>
        </div>
      </div>
    </div>
  )
}
