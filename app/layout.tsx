import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zamp Billing Dashboard',
  description: 'Monthly revenue, costs, and GM by client',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
