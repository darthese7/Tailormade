import { useToastStore } from '@/components/primitives/toastStore'

export function useToast() {
  return useToastStore((state) => state.pushToast)
}

