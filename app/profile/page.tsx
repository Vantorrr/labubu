'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FaCoins, FaGift, FaCrown, FaChartLine, FaClock, FaMoneyBillWave, FaUser, FaTshirt, FaHandPaper, FaShoePrints, FaGem, FaMagic, FaFire, FaHistory, FaCalendarAlt, FaEdit, FaCamera, FaUsers, FaCopy, FaPlus, FaVolumeUp, FaVolumeMute, FaMusic } from 'react-icons/fa'
import { useTelegram } from '@/components/TelegramProvider'
import { getUserId } from '@/utils/getUserId'
import LabuBalance from '@/components/LabuBalance'
import RubBalance from '@/components/RubBalance'
import Image from 'next/image'

interface ProfileData {
  user: {
    sessionId: string
    labuBalance: number
    createdAt: string
  }
  statistics: {
    totalSpins: number
    totalSpent: number
    totalWins: number
    winRate: number
    labuStats: {
      total: number
      earned: number
      spent: number
    }
  }
  collections: {
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
  recentSpins: Array<{
    id: string
    timestamp: string
    cost: number
    spinType: string
    prize: any
    win: any
  }>
  labuTransactions: Array<{
    id: string
    amount: number
    type: string
    description: string
    timestamp: string
  }>
  referralStats?: {
    referralCode: string
    totalReferrals: number
    totalEarnings: number
    referrals: Array<{
      id: string
      name: string
      createdAt: string
      spinCount: number
      hasCompleteCollection: boolean
    }>
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

export default function ProfilePage() {
  const router = useRouter()
  const { user: telegramUser } = useTelegram()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  // добавил 'collection' чтобы не ругался TS, даже если вкладка сейчас не используется
  const [activeTab, setActiveTab] = useState<'stats' | 'settings' | 'history' | 'transactions' | 'referrals' | 'collection'>('stats')
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [sfxOn, setSfxOn] = useState(false)
  const [bgmOn, setBgmOn] = useState(false)

  useEffect(() => {
    // Устанавливаем флаг что приложение загружено
    localStorage.setItem('app_loaded', 'true')
    loadProfile()
    // Инициализируем локальные настройки звука
    const s = localStorage.getItem('sfx_on')
    const b = localStorage.getItem('bgm_on')
    if (s === '1') setSfxOn(true)
    if (b === '1') setBgmOn(true)
    
    // Автообновление при возврате на вкладку/фокусе
    const onFocus = () => loadProfile()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [telegramUser])
  useEffect(() => {
    localStorage.setItem('sfx_on', sfxOn ? '1' : '0')
  }, [sfxOn])

  useEffect(() => {
    localStorage.setItem('bgm_on', bgmOn ? '1' : '0')
  }, [bgmOn])

  useEffect(() => {
    if (activeTab === 'referrals' && profile && !profile.referralStats) {
      loadReferralStats()
    }
  }, [activeTab, profile])

  const loadProfile = async () => {
    try {
      setLoading(true)
       const sessionId = getUserId(telegramUser)
       if (!sessionId) return
      
      const response = await fetch(`/api/profile?t=${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        cache: 'no-store',
        body: JSON.stringify({ sessionId })
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amountInCents: number) => {
    const rub = (amountInCents || 0) / 100
    return `${rub.toLocaleString('ru-RU')}₽`
  }

  const loadReferralStats = async () => {
    try {
      const sessionId = getUserId(telegramUser)
      
       const response = await fetch('/api/referral/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
      
      const data = await response.json()
      if (data.success) {
        setProfile(prev => prev ? { ...prev, referralStats: data.stats } : null)
      }
    } catch (error) {
      console.error('Error loading referral stats:', error)
    }
  }

  const enterReferralCode = async () => {
    if (!referralCode.trim()) return

    try {
      const sessionId = getUserId(telegramUser)
      
      const response = await fetch('/api/referral/enter-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          referralCode: referralCode.trim(),
          telegramUser 
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`✅ ${data.message}`)
        setReferralCode('')
        setShowReferralModal(false)
        loadProfile() // Перезагружаем профиль
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error entering referral code:', error)
      alert('❌ Ошибка при вводе промокода')
    }
  }

  const copyReferralCode = () => {
    if (profile?.referralStats?.referralCode) {
      navigator.clipboard.writeText(profile.referralStats.referralCode)
      alert('✅ Промокод скопирован!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-xl">Загружаем ваш профиль...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl">Профиль не найден</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-2xl font-bold text-white">👤 Профиль</h1>
              <div className="flex items-center gap-2">
                <RubBalance size="sm" />
                <LabuBalance size="sm" showLabel={false} />
              </div>
            </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* User Info */}
        {telegramUser && (
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                {telegramUser.first_name?.charAt(0) || '👤'}
              </div>
              <div className="flex-1">
                <h2 className="text-white font-bold text-xl">
                  {telegramUser.first_name} {telegramUser.last_name || ''}
                </h2>
                {telegramUser.username && (
                  <p className="text-white/70">@{telegramUser.username}</p>
                )}
              </div>
              <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                <FaEdit className="w-5 h-5 text-white" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Mobile Tabs */}
        <div className="flex overflow-x-auto pb-2 mb-6 -mx-4 px-4">
          <div className="flex space-x-2 min-w-max">
            {[
              { id: 'stats', label: 'Статистика', icon: FaChartLine },
              { id: 'referrals', label: 'Рефералы', icon: FaUsers },
              { id: 'settings', label: 'Настройки', icon: FaUser },
              { id: 'history', label: 'История', icon: FaHistory },
              { id: 'transactions', label: 'ЛАБУ', icon: FaCoins }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-yellow-500 text-black font-bold'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                    {profile.statistics.totalSpins}
                  </div>
                  <div className="text-white/70 text-sm">Спинов</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-400">
                    {formatCurrency(profile.statistics.totalSpent)}
                  </div>
                  <div className="text-white/70 text-sm">Потрачено</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                    {profile.statistics.winRate}%
                  </div>
                  <div className="text-white/70 text-sm">Удача</div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                    {profile.statistics.totalWins}
                  </div>
                  <div className="text-white/70 text-sm">Призов</div>
                </div>
              </div>

              {/* ЛАБУ Stats */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <FaCoins className="text-yellow-400" />
                  Баланс ЛАБУ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">
                      {profile.statistics.labuStats.total.toLocaleString()}
                    </div>
                    <div className="text-white/70">Текущий баланс</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      +{profile.statistics.labuStats.earned.toLocaleString()}
                    </div>
                    <div className="text-white/70">Заработано</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">
                      -{profile.statistics.labuStats.spent.toLocaleString()}
                    </div>
                    <div className="text-white/70">Потрачено</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <FaUser className="text-blue-400" />
                  Настройки
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      {sfxOn ? (
                        <FaVolumeUp className="text-green-400 w-5 h-5" />
                      ) : (
                        <FaVolumeMute className="text-gray-400 w-5 h-5" />
                      )}
                      <div>
                        <div className="text-white font-semibold">Звуки (SFX)</div>
                        <div className="text-white/60 text-sm">Клики, выигрыш, эффекты рулетки</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSfxOn(v => !v)}
                      className={`px-4 py-2 rounded-full font-semibold transition-colors ${sfxOn ? 'bg-green-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {sfxOn ? 'Включено' : 'Выключено'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <FaMusic className={`w-5 h-5 ${bgmOn ? 'text-yellow-300' : 'text-gray-400'}`} />
                      <div>
                        <div className="text-white font-semibold">Музыка</div>
                        <div className="text-white/60 text-sm">Легкий фон во время игры</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setBgmOn(v => !v)}
                      className={`px-4 py-2 rounded-full font-semibold transition-colors ${bgmOn ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {bgmOn ? 'Включено' : 'Выключено'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collection Tab */}
          {activeTab === 'collection' ? (
            <div className="space-y-6">
              {/* Normal Collection */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🧸</span>
                  Обычная Labubu
                  <span className="ml-auto text-sm bg-blue-500/20 px-2 py-1 rounded-full">
                    {profile.collections.normal.progress}/4
                  </span>
                </h3>
                
                {profile.collections.normal.complete && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl">
                    <p className="text-green-400 font-semibold">🎉 Коллекция завершена!</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(profile.collections.normal.parts).map(([partType, count]) => {
                    const IconComponent = partIcons[partType as keyof typeof partIcons]
                    const isCollected = count > 0
                    
                    return (
                      <div
                        key={partType}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isCollected
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-gray-500/10 border-gray-500/30 border-dashed'
                        }`}
                      >
                        <div className="text-center">
                          <IconComponent 
                            className={`w-8 h-8 mx-auto mb-2 ${
                              isCollected ? 'text-blue-400' : 'text-gray-500'
                            }`}
                          />
                          <div className={`font-semibold ${
                            isCollected ? 'text-white' : 'text-gray-500'
                          }`}>
                            {partNames[partType as keyof typeof partNames]}
                          </div>
                          {isCollected && count > 1 && (
                            <div className="text-yellow-400 text-sm mt-1">
                              x{count} (дубликаты)
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(profile.collections.normal.progress / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Collectible Collection */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/30">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl animate-pulse">💎</span>
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Эксклюзив Labubu
                  </span>
                  <span className="ml-auto text-sm bg-yellow-500/20 px-2 py-1 rounded-full">
                    {profile.collections.collectible.progress}/4
                  </span>
                </h3>
                
                {profile.collections.collectible.complete && (
                  <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
                    <p className="text-yellow-400 font-semibold">✨ Эксклюзив завершен!</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(profile.collections.collectible.parts).map(([partType, count]) => {
                    const IconComponent = partIcons[partType as keyof typeof partIcons]
                    const isCollected = count > 0
                    
                    return (
                      <div
                        key={partType}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isCollected
                            ? 'bg-yellow-500/20 border-yellow-500/50'
                            : 'bg-gray-500/10 border-gray-500/30 border-dashed'
                        }`}
                      >
                        <div className="text-center">
                          <IconComponent 
                            className={`w-8 h-8 mx-auto mb-2 ${
                              isCollected ? 'text-yellow-400' : 'text-gray-500'
                            }`}
                          />
                          <div className={`font-semibold ${
                            isCollected ? 'text-white' : 'text-gray-500'
                          }`}>
                            {partNames[partType as keyof typeof partNames]}
                          </div>
                          {isCollected && count > 1 && (
                            <div className="text-orange-400 text-sm mt-1">
                              x{count} (дубликаты)
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${(profile.collections.collectible.progress / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              {/* Referral Code Section */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/30">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <FaUsers className="text-green-400" />
                  🔗 Пригласи друзей и получай ЛАБУ!
                </h3>
                
                {profile.referralStats && (
                  <div className="space-y-4">
                    {/* Referral Code */}
                    <div className="bg-white/10 rounded-xl p-4">
                      <p className="text-white/70 text-sm mb-2">Вот твой промокод:</p>
                      <div className="flex items-center gap-2">
                        <code className="bg-black/30 text-green-400 px-3 py-2 rounded-lg font-mono text-lg flex-1">
                          {profile.referralStats.referralCode}
                        </code>
                        <button
                          onClick={copyReferralCode}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {profile.referralStats.totalReferrals}
                        </div>
                        <div className="text-white/70 text-sm">👥 Приглашено</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                          <Image
                            src="/images/labubu/complete/labicoin.png"
                            alt="ЛАБУ"
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                          {profile.referralStats.totalEarnings.toLocaleString()}
                        </div>
                        <div className="text-white/70 text-sm">💰 Заработано</div>
                      </div>
                    </div>

                    {/* Bonus Table */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <h4 className="text-white font-semibold mb-3">🎁 Система бонусов:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Зарегистрировался</span>
                          <span className="text-green-400 font-semibold">+500 ЛАБУ</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Сделал 1 прокрут</span>
                          <span className="text-green-400 font-semibold">+1000 ЛАБУ</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Сделал 10 прокрутов</span>
                          <span className="text-green-400 font-semibold">+2500 ЛАБУ</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/70">Собрал 4 части Labubu</span>
                          <span className="text-green-400 font-semibold">+3000 ЛАБУ</span>
                        </div>
                      </div>
                    </div>

                    {/* Referrals List */}
                    {profile.referralStats.referrals.length > 0 && (
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white font-semibold mb-3">👥 Твои рефералы:</h4>
                        <div className="space-y-2">
                          {profile.referralStats.referrals.map((referral) => (
                            <div key={referral.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                              <div>
                                <div className="text-white font-medium">{referral.name}</div>
                                <div className="text-white/70 text-sm">
                                  {referral.spinCount} спинов
                                  {referral.hasCompleteCollection && ' • ✅ Собрал коллекцию'}
                                </div>
                              </div>
                              <div className="text-green-400 text-sm">
                                {new Date(referral.createdAt).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Enter Referral Code */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <FaPlus className="text-blue-400" />
                  Ввести промокод
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  Если у тебя есть промокод от друга, введи его здесь:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Введи промокод..."
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                  />
                  <button
                    onClick={enterReferralCode}
                    disabled={!referralCode.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <FaHistory className="text-blue-400" />
                История спинов
              </h3>
              
              <div className="space-y-3">
                {profile.recentSpins.length === 0 ? (
                  <p className="text-white/70 text-center py-8">Пока нет спинов</p>
                ) : (
                  profile.recentSpins.map((spin) => (
                    <div
                      key={spin.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-white/50 w-4 h-4" />
                          <span className="text-white/70 text-sm">
                            {formatDate(spin.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            spin.spinType === 'premium' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {spin.spinType === 'premium' ? 'ПРЕМИУМ' : 'ОБЫЧНЫЙ'}
                          </span>
                          <span className="text-red-400 font-semibold">
                            -{formatCurrency(spin.cost)}
                          </span>
                        </div>
                      </div>
                      
                      {spin.prize ? (
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: spin.prize.color + '20' }}
                          >
                            <span className="text-xl flex items-center justify-center">
                              {spin.prize.name.includes('ЛАБУ') ? (
                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                  <Image
                                    src="/images/labubu/complete/labicoin.png"
                                    alt="ЛАБУ Коин"
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) :
                               spin.prize.name.includes('Часть 1') ? '1️⃣' :
                               spin.prize.name.includes('Часть 2') ? '2️⃣' :
                               spin.prize.name.includes('Часть 3') ? '3️⃣' :
                               spin.prize.name.includes('Часть 4') ? '4️⃣' :
                               '🎁'}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {spin.prize.name}
                            </div>
                            <div className="text-white/70 text-sm">
                              {spin.prize.rarity === 'legendary' ? '🔥 Легендарный' :
                               spin.prize.rarity === 'epic' ? '✨ Эпический' :
                               spin.prize.rarity === 'rare' ? '🌟 Редкий' :
                               '⭐ Обычный'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                            <span className="text-xl">❌</span>
                          </div>
                          <div>
                            <div className="text-white/70">Промах</div>
                            <div className="text-white/50 text-sm">Повезёт в следующий раз!</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                <FaCoins className="text-yellow-400" />
                История ЛАБУ
              </h3>
              
              <div className="space-y-3">
                {profile.labuTransactions.length === 0 ? (
                  <p className="text-white/70 text-center py-8">Пока нет транзакций</p>
                ) : (
                  profile.labuTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.amount > 0 
                              ? 'bg-green-500/20' 
                              : 'bg-red-500/20'
                          }`}>
                            {transaction.amount > 0 ? (
                              <div className="w-7 h-7 rounded-full overflow-hidden">
                                <Image
                                  src="/images/labubu/complete/labicoin.png"
                                  alt="ЛАБУ Коин"
                                  width={28}
                                  height={28}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : '💸'}
                          </div>
                          <div>
                            <div className="text-white font-semibold">
                              {transaction.description}
                            </div>
                            <div className="text-white/50 text-sm">
                              {formatDate(transaction.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold text-lg ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}