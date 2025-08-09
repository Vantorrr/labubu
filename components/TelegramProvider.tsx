'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { TelegramUser, getTelegramUser, isTelegramWebApp, setupTelegramWebApp } from '@/lib/telegram'

interface TelegramContextType {
  user: TelegramUser | null
  isLoading: boolean
  isTelegramApp: boolean
  webApp: any
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  isLoading: true,
  isTelegramApp: false,
  webApp: null
})

export const useTelegram = () => useContext(TelegramContext)

interface TelegramProviderProps {
  children: ReactNode
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTelegramApp, setIsTelegramApp] = useState(false)
  const [webApp, setWebApp] = useState<any>(null)

  useEffect(() => {
    const initTelegram = () => {
      const isInTelegram = isTelegramWebApp()
      setIsTelegramApp(isInTelegram)

      if (isInTelegram) {
        const tg = setupTelegramWebApp()
        try { tg?.expand() } catch {}

        // Обновляем переменную высоты для корректного fullscreen в iOS/Telegram
        const updateVh = () => {
          const height = tg?.viewportStableHeight || window.innerHeight
          document.documentElement.style.setProperty('--tg-vh', `${height}px`)
        }
        updateVh()
        try { tg?.onEvent('viewportChanged', updateVh) } catch {}
        setWebApp(tg)
        
        const telegramUser = getTelegramUser()
        setUser(telegramUser)
        
        console.log('🤖 Telegram WebApp initialized:', {
          user: telegramUser,
          platform: tg?.platform,
          version: tg?.version
        })
      } else {
        // Для тестирования вне Telegram создаем фейкового пользователя
        const mockUser: TelegramUser = {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'ru'
        }
        setUser(mockUser)
        console.log('🧪 Mock user for testing:', mockUser)

        // Обновляем переменную для браузера
        document.documentElement.style.setProperty('--tg-vh', `${window.innerHeight}px`)
      }
      
      setIsLoading(false)
      return () => {
        try { window.Telegram?.WebApp?.offEvent('viewportChanged', () => {}) } catch {}
      }
    }

    // Ждем загрузки Telegram WebApp скрипта
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp) {
        initTelegram()
      } else {
        // Ждем загрузки скрипта
        const timer = setTimeout(initTelegram, 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  return (
    <TelegramContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isTelegramApp,
        webApp 
      }}
    >
      {children}
    </TelegramContext.Provider>
  )
}