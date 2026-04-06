import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'HypoShield Real-Time Health Monitor',
  description: 'Real-time wearable health monitoring dashboard with BLE connectivity',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🫀</text></svg>",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="scan-overlay grid-bg min-h-screen">
      <Header/>
        {children}
      </body>
    </html>
  )
}
