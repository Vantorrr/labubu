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
    <div className="min-h-screen py-4 sm:py-8 px-4 mobile-optimized">
      <div className="max-w-6xl mx-auto">
        <Roulette />
        
        {/* Дополнительная информация - адаптивная */}
        <div className="mt-8 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">🎯</div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-2">Честная игра</h3>
            <p className="text-white/80 text-sm sm:text-base">Все результаты генерируются случайно. Никаких подстав!</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">🚚</div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-2">Быстрая доставка</h3>
            <p className="text-white/80 text-sm sm:text-base">Доставляем призы по всей России в течение 3-7 дней</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 text-center sm:col-span-2 lg:col-span-1">
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">💯</div>
            <h3 className="text-white text-lg sm:text-xl font-bold mb-2">100% оригинал</h3>
            <p className="text-white/80 text-sm sm:text-base">Все куклы Labubu - лицензионные оригиналы!</p>
          </div>
        </div>

        {/* Последние выигрыши */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-white text-2xl font-bold mb-6 text-center">🔥 Последние выигрыши</h3>
          <div className="space-y-3">
            {[
              { user: "Анна К.", prize: "Оригинальная Labubu", time: "2 минуты назад", special: true },
              { user: "Михаил П.", prize: "Мини Labubu", time: "15 минут назад" },
              { user: "Елена С.", prize: "Набор стикеров", time: "23 минуты назад" },
              { user: "Дмитрий В.", prize: "Бесплатный спин", time: "1 час назад" },
              { user: "Ольга Т.", prize: "Скидка 10%", time: "1 час назад" },
            ].map((win, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-3 rounded-lg ${
                  win.special 
                    ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30' 
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    win.special ? 'bg-red-400 animate-pulse' : 'bg-green-400'
                  }`}></div>
                  <span className="text-white font-semibold">{win.user}</span>
                  <span className="text-white/70">выиграл</span>
                  <span className={`font-bold ${
                    win.special ? 'text-red-400' : 'text-yellow-400'
                  }`}>{win.prize}</span>
                </div>
                <span className="text-white/50 text-sm">{win.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Футер */}
        <footer className="mt-16 text-center text-white/60">
          <p className="mb-2">© 2024 Labubu Рулетка. Все права защищены.</p>
          <p className="text-sm">Играй ответственно. 18+</p>
        </footer>
      </div>
    </div>
  )
}