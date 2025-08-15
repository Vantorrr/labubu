'use client'

import { useEffect, useState } from 'react'
import { useTelegram } from '@/components/TelegramProvider'
import { getUserId } from '@/utils/getUserId'

interface RubBalanceProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function RubBalance({ className = '', size = 'md' }: RubBalanceProps) {
  const { user: telegramUser, isTelegramApp, webApp } = useTelegram()
  const [rub, setRub] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [telegramUser])

  const load = async () => {
    try {
      const sessionId = getUserId(telegramUser)
      if (!sessionId) return
      const res = await fetch('/api/user-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      const data = await res.json()
      if (data.success) setRub(data.user.rubBalance || 0)
    } finally { setLoading(false) }
  }

  const sizeClasses = {
    sm: { container: 'px-3 py-1', text: 'text-sm' },
    md: { container: 'px-4 py-2', text: 'text-base' },
    lg: { container: 'px-6 py-3', text: 'text-lg' }
  } as const
  const current = sizeClasses[size]

  const topup = async () => {
    let amountRub = 199
    try {
      const amountStr = prompt('Введите сумму пополнения в рублях', '199')
      if (amountStr && amountStr.trim() !== '') {
        const parsed = parseFloat(amountStr.replace(',', '.'))
        if (!isNaN(parsed) && parsed > 0) amountRub = parsed
      }
    } catch {}
    const sessionId = getUserId(telegramUser)
    const res = await fetch('/api/pay/freekassa/create-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountRub, sessionId, product: 'topup_rub' })
    })
    const data = await res.json()
    if (data.success && data.link) {
      if (isTelegramApp && webApp?.openLink) {
        try { webApp.openLink(data.link) } catch { window.open(data.link, '_blank') }
      } else {
        window.open(data.link, '_blank')
      }
    } else {
      alert('Ошибка создания ссылки: ' + data.error)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-full ${current.container} ${className}`}>
        <div className="w-12 h-4 bg-white/20 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`bg-white/20 backdrop-blur-sm rounded-full ${current.container} ${className} flex items-center gap-3`}> 
      <span className={`text-white font-bold ${current.text}`}>{(rub / 100).toLocaleString('ru-RU')} ₽</span>
      <button onClick={topup} className="bg-yellow-400 text-black rounded-full px-3 py-1 text-sm font-bold hover:bg-yellow-300">Пополнить</button>
    </div>
  )
}


