'use client'

import { useState } from 'react'
import { getUserId } from '@/utils/getUserId'
import { useTelegram } from '@/components/TelegramProvider'

export default function PayButtons({ onPaid }: { onPaid: (type: 'normal' | 'premium') => void }) {
  const [loading, setLoading] = useState<'normal' | 'premium' | null>(null)
  const { user: telegramUser } = useTelegram()

  const pay = async (spinType: 'normal' | 'premium') => {
    try {
      setLoading(spinType)
      const sessionId = getUserId(telegramUser)
      // переключаемся на FreeKassa
      const product = spinType === 'premium' ? 'spins_10' : 'spins_10'
      const amountRub = spinType === 'premium' ? 199 : 120
      const res = await fetch('/api/pay/freekassa/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountRub, sessionId, product })
      })
      const data = await res.json()
      if (data.success && data.link) {
        window.open(data.link, '_blank')
      } else {
        alert('Ошибка создания ссылки: ' + data.error)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => pay('normal')}
        disabled={loading !== null}
        className="px-4 py-2 rounded-full bg-blue-600 text-white disabled:opacity-60"
      >
        {loading === 'normal' ? '...' : 'Оплатить Stars (Обычный)'}
      </button>
      <button
        onClick={() => pay('premium')}
        disabled={loading !== null}
        className="px-4 py-2 rounded-full bg-pink-600 text-white disabled:opacity-60"
      >
        {loading === 'premium' ? '...' : 'Оплатить Stars (Premium)'}
      </button>
    </div>
  )
}

