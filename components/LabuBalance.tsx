'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTelegram } from '@/components/TelegramProvider'
import { getUserId } from '@/utils/getUserId'
import Image from 'next/image'

interface LabuBalanceProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LabuBalance({ 
  className = '', 
  showLabel = true, 
  size = 'md' 
}: LabuBalanceProps) {
  const { user: telegramUser } = useTelegram()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBalance()
  }, [telegramUser])

      const loadBalance = async () => {
      try {
        const userId = getUserId(telegramUser)
      
      const response = await fetch('/api/user-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: userId,
          telegramUser 
        })
      })
      
      const data = await response.json()
      if (data.success) {
        setBalance(data.user.labuBalance)
      }
    } catch (error) {
      console.error('Error loading balance:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizeClasses = {
    sm: {
      container: 'px-3 py-1',
      icon: 'w-4 h-4',
      text: 'text-sm',
      glow: 'w-2 h-2'
    },
    md: {
      container: 'px-4 py-2',
      icon: 'w-5 h-5',
      text: 'text-base',
      glow: 'w-3 h-3'
    },
    lg: {
      container: 'px-6 py-3',
      icon: 'w-6 h-6',
      text: 'text-lg',
      glow: 'w-3 h-3'
    }
  }

  const currentSize = sizeClasses[size]

  if (loading) {
    return (
      <div className={`bg-white/10 backdrop-blur-sm rounded-full ${currentSize.container} ${className}`}>
        <div className="flex items-center gap-2">
          <div className={`${currentSize.icon} bg-yellow-400/50 rounded-full animate-pulse`} />
          <div className={`w-12 h-4 bg-white/20 rounded animate-pulse`} />
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className={`bg-white/20 backdrop-blur-sm rounded-full ${currentSize.container} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          {/* ЛАБУ коин картинка */}
          <div className={`${currentSize.icon} rounded-full overflow-hidden shadow-xl border-2 border-yellow-200 animate-pulse`}>
            <Image
              src="/images/labubu/complete/labicoin.png"
              alt="ЛАБУ Коин"
              width={size === 'sm' ? 20 : size === 'md' ? 28 : 32}
              height={size === 'sm' ? 20 : size === 'md' ? 28 : 32}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Ping effect */}
          <div className={`absolute inset-0 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-30 animate-ping`} />
        </div>
        
        <div className="flex flex-col">
          {showLabel && (
            <span className="text-white/70 text-xs leading-none">ЛАБУ</span>
          )}
          <motion.span 
            className={`text-white font-bold leading-none ${currentSize.text}`}
            key={balance}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.3 }}
          >
            {balance.toLocaleString()}
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}