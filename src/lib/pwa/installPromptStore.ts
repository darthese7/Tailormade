import { create } from 'zustand'

interface InstallPromptStore {
  deferredPrompt: BeforeInstallPromptEvent | null
  canInstall: boolean
  isInstalled: boolean
  isAndroid: boolean
  setDeferredPrompt: (event: BeforeInstallPromptEvent | null) => void
  setInstalled: (value: boolean) => void
  setAndroid: (value: boolean) => void
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unsupported'>
}

export const useInstallPromptStore = create<InstallPromptStore>((set, get) => ({
  deferredPrompt: null,
  canInstall: false,
  isInstalled: false,
  isAndroid: false,
  setDeferredPrompt: (event) =>
    set((state) => ({
      deferredPrompt: event,
      canInstall: Boolean(event) && state.isAndroid && !state.isInstalled,
    })),
  setInstalled: (value) =>
    set((state) => ({
      isInstalled: value,
      canInstall: value ? false : Boolean(state.deferredPrompt) && state.isAndroid,
    })),
  setAndroid: (value) =>
    set((state) => ({
      isAndroid: value,
      canInstall: value && !state.isInstalled && Boolean(state.deferredPrompt),
    })),
  promptInstall: async () => {
    const deferredPrompt = get().deferredPrompt
    if (!deferredPrompt || !get().isAndroid || get().isInstalled) {
      return 'unsupported'
    }

    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice

    set({
      deferredPrompt: null,
      canInstall: false,
      isInstalled: choice.outcome === 'accepted' ? true : get().isInstalled,
    })

    return choice.outcome
  },
}))

let cleanupHandler: (() => void) | null = null

function detectAndroid() {
  if (typeof window === 'undefined') {
    return false
  }

  return /android/i.test(window.navigator.userAgent)
}

export function initializeInstallPrompt() {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  if (cleanupHandler) {
    return cleanupHandler
  }

  const modeQuery = window.matchMedia('(display-mode: standalone)')
  const updateInstalledState = () => {
    useInstallPromptStore.getState().setInstalled(modeQuery.matches)
  }

  const isAndroid = detectAndroid()
  useInstallPromptStore.getState().setAndroid(isAndroid)
  updateInstalledState()

  const handleBeforeInstallPrompt = (event: Event) => {
    if (!isAndroid) {
      return
    }

    const promptEvent = event as BeforeInstallPromptEvent
    promptEvent.preventDefault()
    useInstallPromptStore.getState().setDeferredPrompt(promptEvent)
  }

  const handleAppInstalled = () => {
    useInstallPromptStore.setState({
      deferredPrompt: null,
      canInstall: false,
      isInstalled: true,
    })
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener)
  window.addEventListener('appinstalled', handleAppInstalled)
  modeQuery.addEventListener('change', updateInstalledState)

  cleanupHandler = () => {
    window.removeEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener,
    )
    window.removeEventListener('appinstalled', handleAppInstalled)
    modeQuery.removeEventListener('change', updateInstalledState)
    cleanupHandler = null
  }

  return cleanupHandler
}
