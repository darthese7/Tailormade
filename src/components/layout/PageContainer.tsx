import { PropsWithChildren } from 'react'

export function PageContainer({ children }: PropsWithChildren) {
  return <main className="max-w-md mx-auto px-5 pt-4 pb-28">{children}</main>
}

