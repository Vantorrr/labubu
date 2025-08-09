import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { TelegramProvider } from '@/components/TelegramProvider'
import BottomNavigation from '@/components/BottomNavigation'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Labubu Рулетка - Выиграй настоящую Labubu!',
  description: 'Крути рулетку и выигрывай оригинальные куклы Labubu! Всего от 50 рублей за спин!',
  keywords: 'labubu, рулетка, розыгрыш, выиграть, кукла, оригинал',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <Script 
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <TelegramProvider>
          {children}
          <BottomNavigation />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'linear-gradient(135deg, #FF69B4, #9370DB)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '20px',
                padding: '16px',
              },
            }}
          />
        </TelegramProvider>
      </body>
    </html>
  )
}