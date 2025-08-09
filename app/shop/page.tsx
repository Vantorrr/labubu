'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaGift, FaCrown, FaGem, FaFire, FaStar, FaCoins, FaShoppingCart } from 'react-icons/fa'
import { useTelegram } from '@/components/TelegramProvider'
import { getUserId } from '@/utils/getUserId'
import LabuBalance from '@/components/LabuBalance'
import Image from 'next/image'

interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  rarity: string
  image?: string
  inStock: boolean
}

export default function ShopPage() {
  const { user: telegramUser } = useTelegram()
  const [shopItems, setShopItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    // Устанавливаем флаг что приложение загружено
    localStorage.setItem('app_loaded', 'true')
    loadShopItems()
  }, [])

  const loadShopItems = async () => {
    try {
      // Пока используем статичные данные, потом подключим к API
      const mockItems: ShopItem[] = [
        {
          id: '1',
          name: 'Обычная Labubu',
          description: 'Стандартная фигурка Labubu. Отличное качество!',
          price: 50000,
          category: 'figure',
          rarity: 'common',
          inStock: true
        },
        {
          id: '2',
          name: 'Коллекционная Labubu',
          description: 'Редкая коллекционная фигурка с особым дизайном',
          price: 150000,
          category: 'figure',
          rarity: 'rare',
          inStock: true
        },
        {
          id: '3',
          name: 'Эксклюзивная Labubu',
          description: 'Ультра-редкая фигурка, доступна только в магазине',
          price: 300000,
          category: 'figure',
          rarity: 'legendary',
          inStock: true
        },
        {
          id: '4',
          name: 'Набор стикеров Labubu',
          description: 'Комплект из 20 стикеров с любимыми персонажами',
          price: 5000,
          category: 'accessories',
          rarity: 'common',
          inStock: true
        },
        {
          id: '5',
          name: 'Кружка Labubu',
          description: 'Керамическая кружка с принтом Labubu',
          price: 15000,
          category: 'accessories',
          rarity: 'common',
          inStock: true
        },
        {
          id: '6',
          name: 'Футболка Labubu',
          description: 'Стильная футболка с принтом Labubu',
          price: 25000,
          category: 'clothing',
          rarity: 'common',
          inStock: false
        }
      ]
      
      setShopItems(mockItems)
    } catch (error) {
      console.error('Error loading shop items:', error)
    } finally {
      setLoading(false)
    }
  }

  const purchaseItem = async (item: ShopItem) => {
    if (purchasing) return
    
    setPurchasing(item.id)
    
    try {
      const userId = getUserId(telegramUser)
      
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: userId,
          itemId: item.id,
          price: item.price
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`🎉 Покупка успешна! ${item.name} будет доставлен в течение 7-14 дней.`)
        // Обновляем список товаров
        loadShopItems()
      } else {
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error purchasing item:', error)
      alert('❌ Произошла ошибка при покупке')
    } finally {
      setPurchasing(null)
    }
  }

  const getRarityInfo = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return { color: 'from-red-500 to-pink-500', icon: FaFire, text: 'Легендарный' }
      case 'rare':
        return { color: 'from-purple-500 to-indigo-500', icon: FaGem, text: 'Редкий' }
      case 'common':
      default:
        return { color: 'from-blue-500 to-cyan-500', icon: FaStar, text: 'Обычный' }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'figure':
        return '🧸'
      case 'accessories':
        return '🎁'
      case 'clothing':
        return '👕'
      default:
        return '🛍️'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-xl">Загружаем магазин...</p>
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
            <h1 className="text-2xl font-bold text-white">🛍️ Магазин</h1>
            <LabuBalance size="sm" showLabel={false} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Categories */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white text-center mb-2 flex items-center justify-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <Image
                  src="/images/labubu/complete/labicoin.png"
                  alt="ЛАБУ"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              Тратьте ЛАБУ на эксклюзивные товары!
            </p>
            <p className="text-white/70 text-sm text-center">
              Все покупки доставляются по всему миру 🌍
            </p>
          </div>
        </motion.div>

        {/* Shop Items */}
        <div className="space-y-4">
          {shopItems.map((item, index) => {
            const rarityInfo = getRarityInfo(item.rarity)
            const RarityIcon = rarityInfo.icon
            const categoryIcon = getCategoryIcon(item.category)
            
            return (
              <motion.div
                key={item.id}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start gap-4">
                  {/* Item Image/Icon */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${rarityInfo.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {categoryIcon}
                  </div>
                  
                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-lg truncate">{item.name}</h3>
                      <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${rarityInfo.color} flex items-center gap-1`}>
                        <RarityIcon className="w-3 h-3 text-white" />
                        <span className="text-white text-xs font-bold">{rarityInfo.text}</span>
                      </div>
                    </div>
                    
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaCoins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold text-lg">
                          {item.price.toLocaleString()}
                        </span>
                        <span className="text-white/50 text-sm">ЛАБУ</span>
                      </div>
                      
                      {item.inStock ? (
                        <motion.button
                          onClick={() => purchaseItem(item)}
                          disabled={purchasing === item.id}
                          className={`px-4 py-2 rounded-xl font-bold text-white transition-all flex items-center gap-2 ${
                            purchasing === item.id
                              ? 'bg-gray-500/50 cursor-not-allowed'
                              : `bg-gradient-to-r ${rarityInfo.color} hover:scale-105 shadow-lg`
                          }`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {purchasing === item.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Покупка...</span>
                            </>
                          ) : (
                            <>
                              <FaShoppingCart className="w-4 h-4" />
                              <span>Купить</span>
                            </>
                          )}
                        </motion.button>
                      ) : (
                        <div className="px-4 py-2 rounded-xl bg-gray-500/30 text-gray-400 font-bold">
                          Нет в наличии
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Info */}
        <motion.div 
          className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h4 className="text-white font-bold mb-2">📦 Информация о доставке</h4>
          <ul className="text-white/70 text-sm space-y-1">
            <li>• Бесплатная доставка по всему миру</li>
            <li>• Срок доставки: 7-14 рабочих дней</li>
            <li>• Отслеживание посылки включено</li>
            <li>• Гарантия качества 100%</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}