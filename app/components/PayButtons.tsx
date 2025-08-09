'use client'

import { useState } from 'react'

export default function PayButtons({ onPaid }: { onPaid: (type: 'normal' | 'premium') => void }) {
  const [loading, setLoading] = useState<'normal' | 'premium' | null>(null)

  const pay = async (spinType: 'normal' | 'premium') => {
    try {
      setLoading(spinType)
      const res = await fetch('/api/pay/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: localStorage.getItem('guestUserId'), spinType })
      })
      const data = await res.json()
      if (data.success && data.link) {
        // Открываем оплату Stars в новом окне/вкладке (в мини‑аппе откроет нативно)
        window.open(data.link, '_blank')
        // После оплаты вы можете подтверждать через webhook; пока — просто продолжаем
        onPaid(spinType)
      } else {
        alert('Ошибка создания платежа: ' + data.error)
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

