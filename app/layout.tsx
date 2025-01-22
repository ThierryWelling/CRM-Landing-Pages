import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import AutoAuth from './components/AutoAuth'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AutoAuth />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'toast',
            style: {
              background: '#333',
              color: '#fff',
              zIndex: 9999,
              pointerEvents: 'none',
            },
          }}
        />
      </body>
    </html>
  )
} 