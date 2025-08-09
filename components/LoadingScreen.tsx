'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface LoadingScreenProps {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentText, setCurrentText] = useState(0)
  const [showButton, setShowButton] = useState(false)

  const attractiveTexts = [
    "🧸 ПОЛУЧИ МЕНЯ!",
    "✨ ИСПЫТАЙ УДАЧУ!",
    "🎯 Я ЖДУ ТЕБЯ!",
    "💖 СОБЕРИ МЕНЯ!",
    "🎲 КРУТИ РУЛЕТКУ!"
  ]

  useEffect(() => {
    // Симуляция загрузки
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setShowButton(true)
          return 100
        }
        return prev + 2
      })
    }, 50)

    // Смена текстов
    const textInterval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % attractiveTexts.length)
    }, 1500)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-pink-800 to-indigo-900 flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Фоновые эффекты */}
        <div className="absolute inset-0">
          {/* Звездочки */}
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}

          {/* Плавающие частицы */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-4 h-4 text-pink-300 opacity-60"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, 20],
                x: [-10, 10],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2,
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>

        {/* Главный контент */}
        <div className="relative z-10 flex flex-col items-center space-y-8 px-4">
          {/* Заголовок */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-6xl font-bold gradient-text mb-4">
              🎊 LABUBU РУЛЕТКА 🎊
            </h1>
            <p className="text-white/80 text-lg sm:text-xl">
              Самая крутая рулетка с настоящими призами!
            </p>
          </motion.div>

          {/* Labubu изображение */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: 1, 
              rotate: 0,
              y: [0, -10, 0],
            }}
            transition={{ 
              scale: { duration: 1, delay: 0.5 },
              rotate: { duration: 1, delay: 0.5 },
              y: { 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1.5 
              }
            }}
            className="relative"
          >
            {/* Светящийся ореол вокруг Labubu */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-full blur-xl opacity-50 scale-110 animate-pulse"></div>
            
            {/* Labubu */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
              <Image
                src="/images/labubu/parts/zastavka.png"
                alt="Labubu"
                width={256}
                height={256}
                className="object-contain filter drop-shadow-2xl"
                priority
              />
            </div>

            {/* Кольца вокруг */}
            <motion.div
              className="absolute inset-0 border-4 border-yellow-400/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-4 border-2 border-pink-400/30 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Меняющийся текст */}
          <motion.div
            key={currentText}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-4xl font-bold text-yellow-300 animate-pulse mb-2">
              {attractiveTexts[currentText]}
            </h2>
            <p className="text-white/60 text-sm sm:text-base">
              Крути рулетку и собирай коллекцию Labubu!
            </p>
          </motion.div>

          {/* Прогресс бар */}
          <div className="w-full max-w-md">
            <div className="bg-white/20 rounded-full h-4 mb-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"
                style={{ width: `${progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-white/70 text-center text-sm">
              Загрузка магии... {progress}%
            </p>
          </div>

          {/* Кнопка входа */}
          <AnimatePresence>
            {showButton && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-2xl border-2 border-white/20 sparkle"
              >
                <div className="flex items-center space-x-3">
                  <span>🎲</span>
                  <span>НАЧАТЬ ИГРУ!</span>
                  <span>🧸</span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Дополнительная информация */}
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center space-y-2"
            >
              <p className="text-white/60 text-sm">
                🎯 Собери 4 части → Получи полную Labubu!
              </p>
              <p className="text-white/60 text-sm">
                💰 Копи ЛАБУ → Обменяй на призы!
              </p>
            </motion.div>
          )}


        </div>

        {/* Мерцающий эффект в углах */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-400/20 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-400/20 to-transparent rounded-full blur-xl animate-pulse"></div>
      </motion.div>
    </AnimatePresence>
  )
}