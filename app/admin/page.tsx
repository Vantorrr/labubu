'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FaUsers, FaGift, FaChartLine, FaCog, FaTrophy, FaMoneyBillWave } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'

interface Stat {
  label: string
  value: string
  icon: React.ReactNode
  color: string
  change?: string
}

interface RecentWin {
  id: string
  user: string
  prize: string
  value: string
  timestamp: string
  verified: boolean
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const stats: Stat[] = [
    {
      label: 'Всего спинов',
      value: '1,247',
      icon: <FaChartLine />,
      color: 'bg-blue-500',
      change: '+12% за сегодня'
    },
    {
      label: 'Выручка',
      value: '₽62,350',
      icon: <FaMoneyBillWave />,
      color: 'bg-green-500',
      change: '+8% за сегодня'
    },
    {
      label: 'Активные игроки',
      value: '892',
      icon: <FaUsers />,
      color: 'bg-purple-500',
      change: '+15% за неделю'
    },
    {
      label: 'Выдано призов',
      value: '156',
      icon: <FaTrophy />,
      color: 'bg-yellow-500',
      change: '67 на рассмотрении'
    }
  ]

  const recentWins: RecentWin[] = [
    {
      id: '1',
      user: 'Анна К. (user123)',
      prize: 'Оригинальная Labubu',
      value: '15,000₽',
      timestamp: '2024-01-15 14:30',
      verified: false
    },
    {
      id: '2',
      user: 'Михаил П. (user456)',
      prize: 'Мини Labubu',
      value: '2,000₽',
      timestamp: '2024-01-15 13:45',
      verified: true
    },
    {
      id: '3',
      user: 'Елена С. (user789)',
      prize: 'Набор стикеров',
      value: '500₽',
      timestamp: '2024-01-15 13:22',
      verified: true
    }
  ]

  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: <MdDashboard /> },
    { id: 'prizes', label: 'Призы', icon: <FaGift /> },
    { id: 'users', label: 'Пользователи', icon: <FaUsers /> },
    { id: 'settings', label: 'Настройки', icon: <FaCog /> }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold gradient-text">🎊 Labubu Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Последнее обновление: {new Date().toLocaleTimeString('ru-RU')}
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Табы */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-2 px-4 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Дашборд */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.color} text-white mr-4`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      {stat.change && (
                        <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Графики и последние выигрыши */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* График доходов */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Доходы за неделю</h3>
                <div className="h-64 flex items-end space-x-2">
                  {[45, 52, 38, 71, 63, 89, 72].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-pink-500 to-purple-600 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2">
                        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][index]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Последние выигрыши */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">🏆 Последние выигрыши</h3>
                  <button className="text-pink-600 text-sm hover:text-pink-700">
                    Посмотреть все
                  </button>
                </div>
                <div className="space-y-3">
                  {recentWins.map((win) => (
                    <div key={win.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{win.user}</div>
                        <div className="text-sm text-gray-600">{win.prize}</div>
                        <div className="text-xs text-gray-500">{win.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{win.value}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          win.verified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {win.verified ? 'Подтвержден' : 'На рассмотрении'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Управление призами */}
        {activeTab === 'prizes' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">🎁 Управление призами</h3>
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700">
                Добавить приз
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Приз
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Стоимость
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Шанс
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Редкость
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { name: 'Оригинальная Labubu', value: '15,000₽', chance: '1%', rarity: 'Легендарная' },
                    { name: 'Мини Labubu', value: '2,000₽', chance: '4%', rarity: 'Эпическая' },
                    { name: 'Набор стикеров', value: '500₽', chance: '10%', rarity: 'Редкая' },
                    { name: 'Бесплатный спин', value: '50₽', chance: '20%', rarity: 'Редкая' },
                    { name: 'Скидка 10%', value: '100₽', chance: '25%', rarity: 'Обычная' },
                    { name: 'Попробуй еще!', value: '0₽', chance: '40%', rarity: 'Обычная' }
                  ].map((prize, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {prize.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prize.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {prize.chance}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          prize.rarity === 'Легендарная' ? 'bg-red-100 text-red-800' :
                          prize.rarity === 'Эпическая' ? 'bg-purple-100 text-purple-800' :
                          prize.rarity === 'Редкая' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prize.rarity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          Редактировать
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Другие табы можно добавить по мере необходимости */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Пользователи</h3>
            <p className="text-gray-600">Раздел в разработке...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Настройки</h3>
            <p className="text-gray-600">Раздел в разработке...</p>
          </div>
        )}
      </div>
    </div>
  )
}