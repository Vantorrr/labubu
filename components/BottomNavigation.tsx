'use client'

import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaDice, FaGem, FaStore, FaUser } from 'react-icons/fa'
import { useState, useEffect } from 'react'

const navigationItems = [
  {
    id: 'roulette',
    label: 'Рулетка',
    icon: FaDice,
    path: '/',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'collection',
    label: 'Коллекция',
    icon: FaGem,
    path: '/collection',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'shop',
    label: 'Магазин',
    icon: FaStore,
    path: '/shop',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: FaUser,
    path: '/profile',
    color: 'from-orange-500 to-red-500'
  }
]

export default function BottomNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    // Проверяем состояние загрузки из localStorage
    const checkLoadingState = () => {
      const isLoaded = localStorage.getItem('app_loaded')
      setShowLoading(!isLoaded)
    }

    checkLoadingState()

    // Слушаем изменения localStorage
    const handleStorageChange = () => {
      checkLoadingState()
    }

    window.addEventListener('storage', handleStorageChange)
    // Также проверяем каждые 100ms на случай изменений в том же окне
    const interval = setInterval(checkLoadingState, 100)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  // Скрываем меню во время заставки
  if (showLoading) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const isActive = pathname === item.path
            const IconComponent = item.icon

            return (
              <motion.button
                key={item.id}
                onClick={() => router.push(item.path)}
                className="relative flex flex-col items-center justify-center p-3 min-w-[60px]"
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navigationItems.indexOf(item) * 0.1 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20"
                    style={{
                      background: `linear-gradient(135deg, ${item.color.split(' ')[1]}, ${item.color.split(' ')[3]})`
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Icon container */}
                <div className={`relative mb-1 p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? `bg-gradient-to-r ${item.color} shadow-lg` 
                    : 'bg-white/10'
                }`}>
                  <IconComponent 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-white' : 'text-white/70'
                    }`}
                  />
                  
                  {/* Animated dot for active state */}
                  {isActive && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black/20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-white/70'
                }`}>
                  {item.label}
                </span>

                {/* Active glow effect */}
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${item.color} opacity-10 blur-xl`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 0.2 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Bottom safe area for iOS */}
      <div className="h-safe-area-inset-bottom bg-black/30" />
    </div>
  )
}