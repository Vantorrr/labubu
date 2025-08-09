'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaUser, FaTshirt, FaHandPaper, FaShoePrints, FaCrown, FaGem, FaFire, FaMagic, FaGift } from 'react-icons/fa'
import { useTelegram } from '@/components/TelegramProvider'
import { getUserId } from '@/utils/getUserId'
import LabuBalance from '@/components/LabuBalance'
import Image from 'next/image'

interface CollectionData {
  normal: {
    parts: { part1: number, part2: number, part3: number, part4: number }
    progress: number
    complete: boolean
  }
  collectible: {
    parts: { part1: number, part2: number, part3: number, part4: number }
    progress: number
    complete: boolean
  }
}

const partIcons = {
  part1: FaUser,
  part2: FaTshirt,
  part3: FaHandPaper,
  part4: FaShoePrints
}

const partNames = {
  part1: 'Голова',
  part2: 'Тело',
  part3: 'Руки',
  part4: 'Ноги'
}

export default function CollectionPage() {
  const { user: telegramUser } = useTelegram()
  const [collection, setCollection] = useState<CollectionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Устанавливаем флаг что приложение загружено
    localStorage.setItem('app_loaded', 'true')
    loadCollection()

    // Авто-обновление при возврате на страницу/фокусе
    const onFocus = () => loadCollection()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [telegramUser])

  const loadCollection = async () => {
    try {
      const userId = getUserId(telegramUser)
      
      // Берем стабильный эндпоинт user-stats (он уже отдает коллекции по part1..part4)
      const response = await fetch(`/api/user-stats?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        cache: 'no-store',
        body: JSON.stringify({ sessionId: userId })
      })

      const data = await response.json()
      console.log('🔍 Collection (user-stats) response:', data)

      if (data.success && data.user) {
        const normalParts = (data.user.normalCollection || { part1: 0, part2: 0, part3: 0, part4: 0 }) as { part1: number, part2: number, part3: number, part4: number }
        const collectibleParts = (data.user.collectibleCollection || { part1: 0, part2: 0, part3: 0, part4: 0 }) as { part1: number, part2: number, part3: number, part4: number }
        const normalProgress = (Object.values(normalParts) as number[]).filter((c) => c > 0).length
        const collectibleProgress = (Object.values(collectibleParts) as number[]).filter((c) => c > 0).length

        setCollection({
          normal: {
            parts: normalParts,
            progress: normalProgress,
            complete: normalProgress === 4
          },
          collectible: {
            parts: collectibleParts,
            progress: collectibleProgress,
            complete: collectibleProgress === 4
          }
        })
      } else {
        console.error('❌ user-stats API error:', data.error)
        setCollection({
          normal: {
            parts: { part1: 0, part2: 0, part3: 0, part4: 0 },
            progress: 0,
            complete: false
          },
          collectible: {
            parts: { part1: 0, part2: 0, part3: 0, part4: 0 },
            progress: 0,
            complete: false
          }
        })
      }
    } catch (error) {
      console.error('Error loading collection:', error)
      // Устанавливаем пустую коллекцию при ошибке
      setCollection({
        normal: {
          parts: { part1: 0, part2: 0, part3: 0, part4: 0 },
          progress: 0,
          complete: false
        },
        collectible: {
          parts: { part1: 0, part2: 0, part3: 0, part4: 0 },
          progress: 0,
          complete: false
        }
      })
    } finally {
      setLoading(false)
    }
  }

  // Дубликаты обмениваются автоматически в момент выигрыша — отдельная кнопка не нужна

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-xl">Загружаем коллекцию...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">💎 Моя коллекция</h1>
            <LabuBalance size="sm" showLabel={false} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {collection && (
          <>
            {/* Normal Collection */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl">🧸</span>
                  Обычная Labubu
                </h3>
                <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                  <span className="text-blue-400 font-semibold text-sm">
                    {collection.normal.progress}/4
                  </span>
                </div>
              </div>
              
              {collection.normal.complete && (
                <motion.div 
                  className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <p className="text-green-400 font-semibold text-center">
                    🎉 Коллекция завершена! Можете обменять на приз!
                  </p>
                </motion.div>
              )}
              
              {/* Labubu Puzzle Grid 2x2 */}
              <div className="mb-6">
                <p className="text-white/70 text-center mb-3">🧩 Собери полную картинку Лабубу!</p>
                <div className="grid grid-cols-2 gap-1 max-w-64 mx-auto bg-white/5 p-2 rounded-2xl">
                  {/* Part 1 (top-left) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.normal.parts.part1 > 0
                        ? 'border-blue-500/50 shadow-lg'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    whileHover={{ scale: collection.normal.parts.part1 > 0 ? 1.05 : 1 }}
                  >
                    {collection.normal.parts.part1 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/1.jpg"
                          alt="Часть 1 Лабубу"
                          fill
                          className="object-cover"
                        />
                        {collection.normal.parts.part1 > 1 && (
                          <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1 rounded">
                            x{collection.normal.parts.part1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">❓</div>
                          <div className="text-xs">Часть 1</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Part 2 (top-right) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.normal.parts.part2 > 0
                        ? 'border-blue-500/50 shadow-lg'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: collection.normal.parts.part2 > 0 ? 1.05 : 1 }}
                  >
                    {collection.normal.parts.part2 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/2.jpg"
                          alt="Часть 2 Лабубу"
                          fill
                          className="object-cover"
                        />
                        {collection.normal.parts.part2 > 1 && (
                          <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1 rounded">
                            x{collection.normal.parts.part2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">❓</div>
                          <div className="text-xs">Часть 2</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Part 3 (bottom-left) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.normal.parts.part3 > 0
                        ? 'border-blue-500/50 shadow-lg'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: collection.normal.parts.part3 > 0 ? 1.05 : 1 }}
                  >
                    {collection.normal.parts.part3 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/3.jpg"
                          alt="Часть 3 Лабубу"
                          fill
                          className="object-cover"
                        />
                        {collection.normal.parts.part3 > 1 && (
                          <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1 rounded">
                            x{collection.normal.parts.part3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">❓</div>
                          <div className="text-xs">Часть 3</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Part 4 (bottom-right) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.normal.parts.part4 > 0
                        ? 'border-blue-500/50 shadow-lg'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: collection.normal.parts.part4 > 0 ? 1.05 : 1 }}
                  >
                    {collection.normal.parts.part4 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/4.jpg"
                          alt="Часть 4 Лабубу"
                          fill
                          className="object-cover"
                        />
                        {collection.normal.parts.part4 > 1 && (
                          <div className="absolute top-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1 rounded">
                            x{collection.normal.parts.part4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">❓</div>
                          <div className="text-xs">Часть 4</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-3">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(collection.normal.progress / 4) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Collectible Collection */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border-2 border-yellow-400/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <span className="text-2xl animate-pulse">💎</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Эксклюзив Labubu
                  </span>
                </h3>
                <div className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-400/30">
                  <span className="text-yellow-400 font-semibold text-sm">
                    {collection.collectible.progress}/4
                  </span>
                </div>
              </div>
              
              {collection.collectible.complete && (
                <motion.div 
                  className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <p className="text-yellow-400 font-semibold text-center">
                    ✨ Эксклюзив завершен! Невероятно!
                  </p>
                </motion.div>
              )}
              
              {/* Exclusive Labubu Puzzle Grid 2x2 */}
              <div className="mb-6">
                <p className="text-yellow-400 text-center mb-3">✨ Эксклюзивная картинка Лабубу!</p>
                <div className="grid grid-cols-2 gap-1 max-w-64 mx-auto bg-yellow-500/10 p-2 rounded-2xl border border-yellow-400/30">
                  {/* Part 1 (top-left) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.collectible.parts.part1 > 0
                        ? 'border-yellow-500/50 shadow-xl'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: collection.collectible.parts.part1 > 0 ? 1.05 : 1 }}
                  >
                    {collection.collectible.parts.part1 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/1ex.jpg"
                          alt="Эксклюзив Часть 1"
                          fill
                          className="object-cover filter brightness-110 contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20"></div>
                        {collection.collectible.parts.part1 > 1 && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-1 rounded">
                            x{collection.collectible.parts.part1}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">✨</div>
                          <div className="text-xs">Часть 1</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Part 2 (top-right) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.collectible.parts.part2 > 0
                        ? 'border-yellow-500/50 shadow-xl'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: collection.collectible.parts.part2 > 0 ? 1.05 : 1 }}
                  >
                    {collection.collectible.parts.part2 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/2ex.jpg"
                          alt="Эксклюзив Часть 2"
                          fill
                          className="object-cover filter brightness-110 contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20"></div>
                        {collection.collectible.parts.part2 > 1 && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-1 rounded">
                            x{collection.collectible.parts.part2}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">✨</div>
                          <div className="text-xs">Часть 2</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Part 3 (bottom-left) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.collectible.parts.part3 > 0
                        ? 'border-yellow-500/50 shadow-xl'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    whileHover={{ scale: collection.collectible.parts.part3 > 0 ? 1.05 : 1 }}
                  >
                    {collection.collectible.parts.part3 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/3ex.jpg"
                          alt="Эксклюзив Часть 3"
                          fill
                          className="object-cover filter brightness-110 contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20"></div>
                        {collection.collectible.parts.part3 > 1 && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-1 rounded">
                            x{collection.collectible.parts.part3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">✨</div>
                          <div className="text-xs">Часть 3</div>
                        </div>
                      </div>
                    )}
                  </motion.div>

                  {/* Part 4 (bottom-right) */}
                  <motion.div
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      collection.collectible.parts.part4 > 0
                        ? 'border-yellow-500/50 shadow-xl'
                        : 'border-gray-500/30 border-dashed bg-gray-500/10'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: collection.collectible.parts.part4 > 0 ? 1.05 : 1 }}
                  >
                    {collection.collectible.parts.part4 > 0 ? (
                      <div className="relative w-full h-full">
                        <Image
                          src="/images/labubu/parts/4ex.jpg"
                          alt="Эксклюзив Часть 4"
                          fill
                          className="object-cover filter brightness-110 contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20"></div>
                        {collection.collectible.parts.part4 > 1 && (
                          <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs font-bold px-1 rounded">
                            x{collection.collectible.parts.part4}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <div className="text-2xl mb-1">✨</div>
                          <div className="text-xs">Часть 4</div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
              
              <div className="w-full bg-white/20 rounded-full h-3">
                <motion.div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(collection.collectible.progress / 4) * 100}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Кнопка “Забрать игрушку” – активна только если 4/4 */}
              <button
                onClick={() => window.open('https://t.me/pavel_xdev', '_blank')}
                disabled={!(collection?.normal.complete || collection?.collectible.complete)}
                className={`w-full font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${
                  (collection?.normal.complete || collection?.collectible.complete)
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                    : 'bg-gray-500/40 text-white/60 cursor-not-allowed'
                }`}
              >
                🎁 Забрать игрушку
              </button>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-white/70 text-sm text-center">
                  💡 Соберите 4 части обычной или эксклюзивной Labubu — и нажмите “Забрать игрушку”. Мы свяжемся с вами в Telegram.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}