'use client'

import { useState } from 'react'
import { useTelegram } from './TelegramProvider'

interface FKWidgetProps {
  onSuccess?: (amount: number) => void
  onClose?: () => void
}

export default function FKWidget({ onSuccess, onClose }: FKWidgetProps) {
  const [amount, setAmount] = useState('')
  const [showWidget, setShowWidget] = useState(false)
  const [widgetUrl, setWidgetUrl] = useState('')
  const { user, webApp } = useTelegram()

  const openPayment = async () => {
    const amountNum = parseInt(amount)
    if (!amountNum || amountNum < 1) {
      alert('Введите корректную сумму (минимум 1₽)')
      return
    }

    // Используем SCI ссылку как в документации FK - более надежно чем виджет
    try {
      const response = await fetch('/api/pay/freekassa/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountRub: amountNum,
          sessionId: user?.id?.toString() || Date.now().toString(),
          product: 'topup_rub'
        })
      })

      const data = await response.json()
      if (data.success) {
        setWidgetUrl(data.link)
        setShowWidget(true)
      } else {
        alert('Ошибка создания платежа: ' + (data.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Ошибка соединения')
    }
  }

  const closeWidget = () => {
    setShowWidget(false)
    setWidgetUrl('')
    onClose?.()
  }

  if (showWidget) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-bold">Пополнение баланса</h3>
            <button 
              onClick={closeWidget}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          <iframe 
            src={widgetUrl}
            className="w-full h-96"
            frameBorder="0"
            allowFullScreen
            title="FreeKassa Payment"
          />
          <div className="p-4 text-center text-sm text-gray-600">
            После оплаты баланс автоматически пополнится
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-center">💰 Пополнение баланса</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Сумма пополнения (₽)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Введите сумму..."
          min="1"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
        />
      </div>

      {/* Быстрые суммы */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[100, 199, 500].map(sum => (
          <button
            key={sum}
            onClick={() => setAmount(sum.toString())}
            className="py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            {sum}₽
          </button>
        ))}
      </div>

      <button
        onClick={openPayment}
        disabled={!amount}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
      >
        💳 Пополнить {amount || ''}₽
      </button>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Комиссия платежной системы не взимается с вашего баланса
      </div>
    </div>
  )
}
