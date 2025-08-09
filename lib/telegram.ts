// Telegram Bot Configuration (server-side reads from env)
export const TELEGRAM_CONFIG = {
  get BOT_TOKEN() {
    return process.env.TELEGRAM_BOT_TOKEN || ''
  },
  get API_URL() {
    return 'https://api.telegram.org/bot'
  }
}

// Telegram WebApp Script
export const TELEGRAM_WEBAPP_SCRIPT = `
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
`

// Telegram User Interface
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

// Telegram WebApp API
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: TelegramUser
          chat_instance?: string
          chat_type?: string
          start_param?: string
        }
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText(text: string): void
          onClick(callback: () => void): void
          show(): void
          hide(): void
          enable(): void
          disable(): void
          showProgress(leaveActive?: boolean): void
          hideProgress(): void
        }
        BackButton: {
          isVisible: boolean
          onClick(callback: () => void): void
          show(): void
          hide(): void
        }
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
          selectionChanged(): void
        }
        expand(): void
        close(): void
        ready(): void
        enableClosingConfirmation(): void
        disableClosingConfirmation(): void
        onEvent(eventType: string, callback: () => void): void
        offEvent(eventType: string, callback: () => void): void
        sendData(data: string): void
        switchInlineQuery(query: string, choose_chat_types?: string[]): void
        openLink(url: string, options?: { try_instant_view?: boolean }): void
        openTelegramLink(url: string): void
        openInvoice(url: string, callback?: (status: string) => void): void
      }
    }
  }
}

// Utility functions
export const getTelegramUser = (): TelegramUser | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe.user || null
  }
  return null
}

export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp
}

export const setupTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    
    // Настройка темы
    tg.ready()
    tg.expand()
    
    // Отключаем подтверждение закрытия
    tg.disableClosingConfirmation()
    
    return tg
  }
  return null
}