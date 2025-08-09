'use client'

import { useState, useEffect } from 'react'
import Roulette from '@/components/Roulette'
import LoadingScreen from '@/components/LoadingScreen'

export default function HomePage() {
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Проверяем, была ли уже показана заставка
    const isLoaded = localStorage.getItem('app_loaded')
    if (isLoaded) {
      setShowLoading(false)
    }
  }, [])

  const handleLoadingComplete = () => {
    localStorage.setItem('app_loaded', 'true')
    setShowLoading(false)
  }

  if (showLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  return (
    <div className="min-h-screen mobile-optimized">
      <Roulette />
    </div>
  )
}