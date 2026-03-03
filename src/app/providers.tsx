import { PropsWithChildren, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ToastViewport } from '@/components/primitives'
import { initializeSyncWorker } from '@/features/offline/syncWorker'
import { initializeInstallPrompt } from '@/lib/pwa/installPromptStore'
import { queryClient } from '@/lib/queryClient'

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    initializeSyncWorker(queryClient)
    const cleanupInstallPrompt = initializeInstallPrompt()
    return cleanupInstallPrompt
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastViewport />
    </QueryClientProvider>
  )
}
