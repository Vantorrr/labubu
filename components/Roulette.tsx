'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGift, FaCrown, FaStar, FaCoins, FaTimes, FaDice, FaKey, FaCoffee, FaTshirt, FaBox, FaBaby, FaGem, FaUser, FaHandPaper, FaShoePrints, FaMagic, FaFire, FaMoneyBillWave, FaSadTear, FaRedo, FaHandPointUp, FaArrowRight, FaCalendarTimes, FaCircle, FaUserAlt } from 'react-icons/fa'
import { GiDiamonds } from 'react-icons/gi'
import { useRouter } from 'next/navigation'
import { useTelegram } from '@/components/TelegramProvider'
import { getUserId } from '@/utils/getUserId'
import LabuBalance from '@/components/LabuBalance'
import PayButtons from '@/app/components/PayButtons'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Prize {
  id: string
  name: string
  icon: React.ReactNode
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  color: string
  chance: number
  value: string
  rawValue: number
}

const iconMap: { [key: string]: React.ReactNode } = {
  'FaCoins': <FaCoins />,
  'FaGift': <FaGift />,
  'FaStar': <FaStar />,
  'GiDiamonds': <GiDiamonds />,
  'FaCrown': <FaCrown />,
  'FaTimes': <FaTimes />,
  'FaDice': <FaDice />,
  'FaKey': <FaKey />,
  'FaCoffee': <FaCoffee />,
  'FaTshirt': <FaTshirt />,
  'FaBox': <FaBox />,
  'FaBaby': <FaBaby />,
  'FaGem': <FaGem />,
  'FaUser': <FaUser />,
  'FaHandPaper': <FaHandPaper />,
  'FaShoePrints': <FaShoePrints />,
  'FaMagic': <FaMagic />,
  'FaFire': <FaFire />,
  'FaMoneyBillWave': <FaMoneyBillWave />,
  'FaSadTear': <FaSadTear />,
  'FaRedo': <FaRedo />,
  'FaHandPointUp': <FaHandPointUp />,
  'FaArrowRight': <FaArrowRight />,
  'FaCalendarTimes': <FaCalendarTimes />,
  'FaCircle': <FaCircle />
}

// Функция для красивого распределения призов по кругу
function shufflePrizes(prizes: Prize[]): Prize[] {
  const labuPrizes = prizes.filter(p => p.name.includes('ЛАБУ'))
  const partPrizes = prizes.filter(p => p.name.includes('Часть'))
  
  // Создаем красивый порядок: ЛАБУ между частями
  const result: Prize[] = []
  const maxLength = Math.max(labuPrizes.length, partPrizes.length)
  
  for (let i = 0; i < maxLength; i++) {
    if (labuPrizes[i]) result.push(labuPrizes[i])
    if (partPrizes[i]) result.push(partPrizes[i])
  }
  
  return result
}

// Интерфейс для данных API
interface ApiPrize {
  id: string
  name: string
  chance: number
  color: string
  icon: string
  rarity: string
  prizeType: string
  partType?: string
  partRarity?: string
  labuAmount?: number
}

export default function Roulette() {
  const router = useRouter()
  const { user: telegramUser, isLoading: telegramLoading, isTelegramApp, webApp } = useTelegram()
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [spins, setSpins] = useState(0)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [userStats, setUserStats] = useState({ 
    labuBalance: 0, 
    normalCollection: { part1: 0, part2: 0, part3: 0, part4: 0 }, 
    collectibleCollection: { part1: 0, part2: 0, part3: 0, part4: 0 } 
  })
  const [loading, setLoading] = useState(true)
  const wheelRef = useRef<HTMLDivElement>(null)
  // Копим абсолютный угол поворота, чтобы всегда крутить в одну сторону
  const rotationRef = useRef<number>(0)

  // Функция загрузки призов и статистики пользователя
  const loadPrizesAndStats = async (sessionId: string) => {
    try {
      // Загружаем призы
      const prizesResponse = await fetch('/api/prizes')
      const prizesData = await prizesResponse.json()
      
      if (prizesData.success) {
        const convertedPrizes: Prize[] = prizesData.prizes.map((apiPrize: ApiPrize) => ({
          id: apiPrize.id,
          name: apiPrize.name,
          icon: iconMap[apiPrize.icon] || <FaGift />,
          rarity: apiPrize.rarity,
          color: apiPrize.color,
          chance: apiPrize.chance,
          value: apiPrize.prizeType === 'labu' ? `${apiPrize.labuAmount} ЛАБУ` : 
                 apiPrize.prizeType === 'part' ? `Часть ${apiPrize.partRarity}` : '0₽',
          rawValue: apiPrize.labuAmount || 0
        }))
        
        // НЕ перемешиваем призы - порядок должен совпадать с API
        setPrizes(convertedPrizes)
      }

      // Загружаем статистику пользователя
      const userResponse = await fetch('/api/user-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      const userData = await userResponse.json()
      
      if (userData.success) {
        setUserStats({
          labuBalance: userData.user.labuBalance,
          normalCollection: userData.user.normalCollection || { part1: 0, part2: 0, part3: 0, part4: 0 },
          collectibleCollection: userData.user.collectibleCollection || { part1: 0, part2: 0, part3: 0, part4: 0 }
        })
        setSpins(userData.user.totalSpins || 0)
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Ждем загрузки Telegram данных
    if (telegramLoading) return
    
    // Используем Telegram ID или постоянный guest ID
    const userId = getUserId(telegramUser)
    
    // Добавляем тактильную обратную связь для Telegram
    if (isTelegramApp && webApp) {
      webApp.ready()
      webApp.expand()
    }
    
    // Загружаем данные
    loadPrizesAndStats(userId)
  }, [telegramUser, telegramLoading])

  const spinWheel = async (spinType: 'normal' | 'premium' = 'normal') => {
    // Получаем постоянный user ID
    const userId = getUserId(telegramUser)
    if (isSpinning || !userId) return

    setIsSpinning(true)
    
    // Тактильная обратная связь для Telegram
    if (isTelegramApp && webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('medium')
    }
    setShowResult(false)
    setSelectedPrize(null)

    try {
      // Отправляем запрос на сервер
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId: userId, spinType }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при вращении')
      }

      // Обновляем статистику пользователя
      if (data.user) {
        setUserStats({
          labuBalance: data.user.labuBalance,
          normalCollection: data.user.normalCollection || { part1: 0, part2: 0, part3: 0, part4: 0 },
          collectibleCollection: data.user.collectibleCollection || { part1: 0, part2: 0, part3: 0, part4: 0 }
        })
      }

      // Преобразуем результат в формат Prize
      // Убираем проверочные логи
      
      const wonPrize: Prize = {
        id: data.prize.id,
        name: data.prize.name,
        icon: iconMap[data.prize.icon] || <FaGift />,
        rarity: data.prize.rarity,
        color: data.prize.color,
        chance: 0, // не используется для результата
        value: data.prize.prizeType === 'labu' ? `${data.prizeResult?.labuAmount || 0} ЛАБУ` : 
               data.prize.prizeType === 'part' ? `Часть (${data.prize.partRarity})` : '0₽',
        rawValue: data.prizeResult?.labuAmount || 0
      }

      // Анимация колеса — детерминированная и кумулятивная
      const prizeIndex = prizes.findIndex(p => p.id === data.prize.id)
      
      if (prizeIndex === -1) {
        console.error('Prize not found!')
        return
      }

      // Геометрия колеса
      const sectorAngle = 360 / prizes.length
      const desiredAngle = prizeIndex * sectorAngle + sectorAngle / 2 // центр сектора, как при отрисовке

      // Сколько полных оборотов добавить для красоты
      const fullSpins = 5 + Math.floor(Math.random() * 3)

      // Текущий абсолютный угол (может быть > 360). Нормализуем только для расчета дельты
      const current = rotationRef.current
      const currentMod = ((current % 360) + 360) % 360

      // Нам нужно довернуть колесо ДОПОЛНИТЕЛЬНО настолько, чтобы (desiredAngle + currentMod + delta) % 360 == 0
      // То есть delta = (360 - (desiredAngle + currentMod) % 360) % 360
      const deltaToAlign = (360 - ((desiredAngle + currentMod) % 360)) % 360

      const finalRotation = current + fullSpins * 360 + deltaToAlign
      rotationRef.current = finalRotation

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${finalRotation}deg)`
      }

      // Ждем окончания анимации
      setTimeout(() => {
        setSelectedPrize(wonPrize)
        setIsSpinning(false)
        setShowResult(true)
        setSpins(data.user.totalSpins)

        // Тактильная обратная связь для результата
        if (isTelegramApp && webApp?.HapticFeedback) {
          if (data.prizeResult?.isDuplicate) {
            webApp.HapticFeedback.notificationOccurred('warning')
          } else if (wonPrize.rarity === 'legendary') {
            webApp.HapticFeedback.notificationOccurred('success')
            webApp.HapticFeedback.impactOccurred('heavy')
          } else if (wonPrize.rarity === 'epic' || wonPrize.rarity === 'rare') {
            webApp.HapticFeedback.notificationOccurred('success')
          } else if (wonPrize.name === 'Попробуй еще!') {
            webApp.HapticFeedback.notificationOccurred('error')
          } else {
            webApp.HapticFeedback.impactOccurred('light')
          }
        }

        // Показываем результат с учетом дубликатов
        if (data.prizeResult?.isDuplicate) {
          toast(`😕 Дубликат! +300 ЛАБУ за ${wonPrize.name}`, {
            duration: 4000,
            style: {
              background: '#F59E0B',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold',
            },
          })
        } else if (wonPrize.rarity === 'legendary') {
          toast.success('🎉 НЕВЕРОЯТНО! ТЫ ВЫИГРАЛ ЛУЧШИЙ ПРИЗ! 🎉', {
            duration: 8000,
          })
        } else if (wonPrize.rarity === 'epic') {
          toast.success(`✨ Отлично! Ты выиграл: ${wonPrize.name}! ✨`)
        } else if (wonPrize.rarity === 'rare') {
          toast.success(`🎁 Поздравляем! ${wonPrize.name}!`)
        } else if (wonPrize.name !== 'Попробуй еще!') {
          toast.success(`${wonPrize.name}!`)
        } else {
          toast('Не повезло... Попробуй еще раз! 💪')
        }
      }, 4000)

    } catch (error) {
      console.error('Spin error:', error)
      setIsSpinning(false)
      toast.error('Произошла ошибка. Попробуйте еще раз!')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-500"></div>
        <p className="text-white text-xl">Загружаем рулетку...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[var(--tg-vh)] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pb-20">
      <div className="flex flex-col items-center space-y-8 p-4 w-full">
        {/* Заголовок */}
        <div className="w-full relative pt-4">

        {/* Статистика пользователя */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-6xl font-bold gradient-text mb-4">
            🎊 LABUBU РУЛЕТКА 🎊
          </h1>
          {/* Приветствие Telegram пользователя */}
          {telegramUser && (
            <div className="mb-2">
              <p className="text-white text-lg font-semibold">
                Привет, {telegramUser.first_name}! 👋
              </p>
              {isTelegramApp && (
                <p className="text-yellow-300 text-sm">
                  🤖 Играем в Telegram Mini App
                </p>
              )}
            </div>
          )}
          <p className="text-white text-lg sm:text-xl opacity-90">
            Крути рулетку и выигрывай настоящие призы!
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <LabuBalance size="lg" />
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2">
              <span className="text-white font-bold flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg animate-spin-slow">
                  S
                </div>
                <span className="text-sm sm:text-base">Спинов: {spins}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Рулетка - Супер крутая! */}
      <div className="relative flex justify-center">
        <div className="roulette-glow rounded-full p-2 sm:p-4 bg-white/10 backdrop-blur-sm">
          <div 
            ref={wheelRef}
            className="rounded-full relative transition-transform duration-[4000ms] ease-out border-4 border-yellow-400 shadow-2xl"
            style={{
              width: 'min(96vw, 36rem)',
              height: 'min(96vw, 36rem)',
              background: prizes.length > 0 ? `conic-gradient(
                ${prizes.map((prize, index) => {
                  const startAngle = (index / prizes.length) * 360
                  const endAngle = ((index + 1) / prizes.length) * 360
                  return `${prize.color} ${startAngle}deg ${endAngle}deg`
                }).join(', ')}
              )` : 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)'
            }}
          >
            {/* Секции призов с Labubu картинками */}
            {prizes.length > 0 && prizes.map((prize, index) => {
              const angle = (index / prizes.length) * 360 + (360 / prizes.length) / 2
              const isLegendary = prize.rarity === 'legendary'
              const isEpic = prize.rarity === 'epic'
              
              return (
                <div
                  key={prize.id}
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center',
                  }}
                >
                  {/* Разделительная линия */}
                  <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white/30 transform -translate-x-0.5"></div>
                  
                  {/* Иконка ближе к краю и больше */}
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2"
                    style={{ 
                      top: '20px'
                    }}
                  >
                    <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-xl border-2 border-white/70 ${
                      isLegendary ? 'bg-gradient-to-br from-red-500 to-pink-600' :
                      isEpic ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                      prize.name.includes('ЛАБУ') ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      prize.name.includes('Часть') ? 
                        (prize.name.includes('Эксклюзив') ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500') :
                      'bg-gradient-to-br from-gray-500 to-gray-600'
                    }`}>
                      {/* Иконка приза */}
                      <div className={`${isLegendary ? 'text-lg sm:text-2xl' : 'text-sm sm:text-lg'} flex items-center justify-center`}>
                                              {prize.name.includes('ЛАБУ') ? (
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden mb-1">
                            <Image
                              src="/images/labubu/complete/labicoin.png"
                              alt="ЛАБУ Коин"
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-[8px] sm:text-[10px] font-bold text-white bg-black/50 px-1 rounded">
                            {prize.rawValue || 0}
                          </div>
                        </div>
                        ) : prize.name.includes('Часть 1') ? (
                          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-white/30">
                            <Image
                              src={prize.name.includes('Эксклюзив') ? "/images/labubu/parts/1ex.jpg" : "/images/labubu/parts/1.jpg"}
                              alt="Часть 1 Лабубу"
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : prize.name.includes('Часть 2') ? (
                          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-white/30">
                            <Image
                              src={prize.name.includes('Эксклюзив') ? "/images/labubu/parts/2ex.jpg" : "/images/labubu/parts/2.jpg"}
                              alt="Часть 2 Лабубу"
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : prize.name.includes('Часть 3') ? (
                          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-white/30">
                            <Image
                              src={prize.name.includes('Эксклюзив') ? "/images/labubu/parts/3ex.jpg" : "/images/labubu/parts/3.jpg"}
                              alt="Часть 3 Лабубу"
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : prize.name.includes('Часть 4') ? (
                          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg overflow-hidden border border-white/30">
                            <Image
                              src={prize.name.includes('Эксклюзив') ? "/images/labubu/parts/4ex.jpg" : "/images/labubu/parts/4.jpg"}
                              alt="Часть 4 Лабубу"
                              width={28}
                              height={28}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) :
                         prize.name.includes('Почти') || prize.name.includes('Попробуй') || prize.name.includes('следующий') || prize.name.includes('Неудача') || prize.name.includes('Мимо') || prize.name.includes('сегодня') || prize.name.includes('Пусто') ? '❌' :
                         prize.icon}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {/* Центральная точка с Labubu */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center border-4 border-white">
                <div className="text-2xl sm:text-3xl animate-spin-slow">🧸</div>
              </div>
            </div>

            {/* Дополнительные эффекты */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
            
            {/* Sparkles для legendary призов */}
            {prizes.filter(p => p.rarity === 'legendary').map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                style={{
                  top: `${20 + Math.random() * 60}%`,
                  left: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Указатель - более яркий */}
        <div className="absolute -top-2 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="relative">
            <div className="w-0 h-0 border-l-[15px] sm:border-l-[25px] border-r-[15px] sm:border-r-[25px] border-b-[25px] sm:border-b-[40px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-2xl"></div>
            <div className="absolute top-[20px] sm:top-[30px] left-1/2 transform -translate-x-1/2 w-2 h-4 sm:w-3 sm:h-6 bg-yellow-400 rounded-b-full"></div>
          </div>
        </div>

        {/* Декоративные элементы вокруг */}
        <div className="absolute -inset-16 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 text-yellow-400 floating opacity-70"
              style={{
                top: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                left: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                animationDelay: `${i * 0.3}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      </div>

      {/* Кнопки спина - обновленные цены */}
      <div className="flex flex-col items-center space-y-4 px-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          {/* Оплата Stars — скрыто */}

          {/* Обычный спин */}
          <motion.button
            onClick={() => spinWheel('normal')}
            disabled={isSpinning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-xl text-white
              ${isSpinning 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 sparkle'
              }
              shadow-2xl transform transition-all duration-200 border-2 border-white/20
            `}
          >
            {isSpinning ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Крутим...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-lg sm:text-xl">🎲 СПИН</span>
                <span className="text-yellow-300 text-sm font-bold">120₽</span>
              </div>
            )}
          </motion.button>

          {/* Премиум спин */}
          <motion.button
            onClick={() => spinWheel('premium')}
            disabled={isSpinning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              flex-1 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-xl text-white
              ${isSpinning 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 sparkle'
              }
              shadow-2xl transform transition-all duration-200 border-2 border-white/20 relative overflow-hidden
            `}
          >
            {isSpinning ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Крутим...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-lg sm:text-xl">🔥 ПРЕМИУМ x2</span>
                <span className="text-yellow-300 text-sm font-bold">199₽</span>
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                  2x шанс!
                </div>
              </div>
            )}
          </motion.button>
        </div>

        {/* Информация о шансах - обновленная */}
        <div className="text-center text-white/80 text-xs sm:text-sm max-w-md">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 space-y-2">
            <p className="flex items-center justify-center space-x-2">
              <span>🧸</span>
              <span>Собери 4 части → Получи Labubu!</span>
            </p>
            <p className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 rounded-full overflow-hidden">
                <Image
                  src="/images/labubu/complete/labicoin.png"
                  alt="ЛАБУ"
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                />
              </div>
              <span>Копи ЛАБУ → Обменяй на призы!</span>
            </p>
            <p className="flex items-center justify-center space-x-2">
              <span>🔥</span>
              <span>Премиум спин: x2 шанс на части!</span>
            </p>
            <p className="flex items-center justify-center space-x-2">
              <span>✨</span>
              <span>20 секторов, больше шансов!</span>
            </p>
          </div>
        </div>

        {/* Быстрые действия для мобильных */}
        <div className="flex flex-wrap gap-2 justify-center sm:hidden">
          <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
            💰 Пополнить
          </button>
          <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
            🏆 Мои призы
          </button>
          <button className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
            📊 Статистика
          </button>
        </div>
      </div>



      {/* Результат - улучшенный для мобильных */}
      <AnimatePresence>
        {showResult && selectedPrize && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 text-center max-w-sm sm:max-w-md w-full shadow-2xl overflow-hidden relative">
              {/* Конфетти эффект для крутых призов */}
              {(selectedPrize.rarity === 'legendary' || selectedPrize.rarity === 'epic') && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    ></div>
                  ))}
                </div>
              )}

              {/* Иконка приза */}
              <div className={`text-5xl sm:text-6xl mb-4 ${
                selectedPrize.rarity === 'legendary' ? 'animate-bounce' : 
                selectedPrize.rarity === 'epic' ? 'animate-pulse' : ''
              }`}>
                {selectedPrize.name.includes('Labubu') || selectedPrize.name.includes('ОРИГИНАЛ') ? '🧸' : 
                 selectedPrize.name.includes('спин') ? '🎲' :
                 selectedPrize.name.includes('Скидка') ? '🎁' :
                 selectedPrize.name.includes('Неудача') ? '😢' :
                 selectedPrize.icon}
              </div>

              {/* Название приза */}
              <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${
                selectedPrize.rarity === 'legendary' ? 'text-red-500 animate-pulse' :
                selectedPrize.rarity === 'epic' ? 'text-purple-500' :
                selectedPrize.rarity === 'rare' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {selectedPrize.name}
              </h3>

              {/* Стоимость */}
              <div className="bg-gray-100 rounded-2xl p-3 mb-4">
                <p className="text-gray-600 text-sm sm:text-base">
                  Стоимость приза: <span className="font-bold text-green-600">{selectedPrize.value}</span>
                </p>
              </div>
              
              {/* Особые инструкции для legendary призов */}
              {selectedPrize.rarity === 'legendary' && (
                <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-2xl border border-red-200">
                  <p className="text-sm text-red-700 mb-2 font-semibold">
                    🎉 НЕВЕРОЯТНО! Вы выиграли главный приз!
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Для получения приза свяжитесь с нами:
                  </p>
                  <div className="bg-white border border-gray-200 p-3 rounded-lg">
                    <p className="font-mono text-sm text-blue-600">@labubu_support</p>
                    <p className="text-xs text-gray-500 mt-1">Telegram поддержка</p>
                  </div>
                </div>
              )}

              {/* Призы средней ценности */}
              {(selectedPrize.rarity === 'epic' || selectedPrize.rarity === 'rare') && selectedPrize.rawValue > 0 && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-200">
                  <p className="text-sm text-purple-700 mb-2">
                    ✨ Отличный выигрыш! Свяжитесь с поддержкой для получения приза.
                  </p>
                </div>
              )}
              
              {/* Кнопки действий */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => setShowResult(false)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-bold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  Продолжить игру
                </button>
                
                {selectedPrize.rawValue > 0 && (
                  <button className="flex-1 bg-white border-2 border-purple-500 text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-purple-50 transition-all">
                    Связаться
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Статистика призов */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-2xl">
        <h3 className="text-white text-xl font-bold mb-4 text-center">🏆 Призы и шансы</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {prizes.map((prize) => (
            <div key={prize.id} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <div className="text-xl">{prize.icon}</div>
                <div>
                  <div className="text-white font-semibold text-sm">{prize.name}</div>
                  <div className="text-white/70 text-xs">{prize.value}</div>
                </div>
              </div>
              <div className={`
                px-2 py-1 rounded-full text-xs font-bold
                ${prize.rarity === 'legendary' ? 'bg-red-500 text-white' :
                  prize.rarity === 'epic' ? 'bg-purple-500 text-white' :
                  prize.rarity === 'rare' ? 'bg-yellow-500 text-black' :
                  'bg-gray-500 text-white'
                }
              `}>
                {prize.chance}%
                            </div>
            </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}