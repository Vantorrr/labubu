import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 ФИНАЛЬНАЯ КОНФИГУРАЦИЯ: 12 СЕКТОРОВ')

  // ТВОЯ КРУТАЯ ЛОГИКА: 12 СЕКТОРОВ!
  const prizes = [
    // ОБЫЧНЫЕ ЧАСТИ (4 сектора = 4.8% - РАВНЫЕ ШАНСЫ!)
    {
      name: 'Часть 1 — Обычный',
      value: 0,
      chance: 1.2,
      rarity: 'common',
      color: '#34d399',
      icon: 'FaUser',
      isActive: true,
      prizeType: 'part',
      partType: 'part1',
      partRarity: 'normal',
      labuAmount: null
    },
    {
      name: 'Часть 2 — Обычный',
      value: 0,
      chance: 1.2,
      rarity: 'common',
      color: '#60a5fa',
      icon: 'FaTshirt',
      isActive: true,
      prizeType: 'part',
      partType: 'part2',
      partRarity: 'normal',
      labuAmount: null
    },
    {
      name: 'Часть 3 — Обычный',
      value: 0,
      chance: 1.2,
      rarity: 'common',
      color: '#fbbf24',
      icon: 'FaHandPaper',
      isActive: true,
      prizeType: 'part',
      partType: 'part3',
      partRarity: 'normal',
      labuAmount: null
    },
    {
      name: 'Часть 4 — Обычный',
      value: 0,
      chance: 1.2,
      rarity: 'common',
      color: '#f97316',
      icon: 'FaShoePrints',
      isActive: true,
      prizeType: 'part',
      partType: 'part4',
      partRarity: 'normal',
      labuAmount: null
    },
    
    // ЭКСКЛЮЗИВ ЧАСТИ (4 сектора = 3.2% - РАВНЫЕ ШАНСЫ!)
    {
      name: 'Часть 1 — Эксклюзив',
      value: 0,
      chance: 0.8,
      rarity: 'rare',
      color: '#a855f7',
      icon: 'FaCrown',
      isActive: true,
      prizeType: 'part',
      partType: 'part1',
      partRarity: 'exclusive',
      labuAmount: null
    },
    {
      name: 'Часть 2 — Эксклюзив',
      value: 0,
      chance: 0.8,
      rarity: 'rare',
      color: '#8b5cf6',
      icon: 'FaGem',
      isActive: true,
      prizeType: 'part',
      partType: 'part2',
      partRarity: 'exclusive',
      labuAmount: null
    },
    {
      name: 'Часть 3 — Эксклюзив',
      value: 0,
      chance: 0.8,
      rarity: 'epic',
      color: '#ec4899',
      icon: 'FaMagic',
      isActive: true,
      prizeType: 'part',
      partType: 'part3',
      partRarity: 'exclusive',
      labuAmount: null
    },
    {
      name: 'Часть 4 — Эксклюзив',
      value: 0,
      chance: 0.8,
      rarity: 'epic',
      color: '#ef4444',
      icon: 'FaFire',
      isActive: true,
      prizeType: 'part',
      partType: 'part4',
      partRarity: 'exclusive',
      labuAmount: null
    },

    // ЛАБУ (4 сектора = 61%)
    {
      name: '+500 ЛАБУ',
      value: 0,
      chance: 25.0,
      rarity: 'common',
      color: '#84cc16',
      icon: 'FaCoins',
      isActive: true,
      prizeType: 'labu',
      partType: null,
      partRarity: null,
      labuAmount: 500
    },
    {
      name: '+1000 ЛАБУ',
      value: 0,
      chance: 20.0,
      rarity: 'common',
      color: '#22c55e',
      icon: 'FaMoneyBillWave',
      isActive: true,
      prizeType: 'labu',
      partType: null,
      partRarity: null,
      labuAmount: 1000
    },
    {
      name: '+1000 ЛАБУ (повтор)',
      value: 0,
      chance: 15.0,
      rarity: 'common',
      color: '#16a34a',
      icon: 'FaMoneyBillWave',
      isActive: true,
      prizeType: 'labu',
      partType: null,
      partRarity: null,
      labuAmount: 1000
    },
    {
      name: '+5000 ЛАБУ (джекпот)',
      value: 0,
      chance: 1.0,
      rarity: 'legendary',
      color: '#10b981',
      icon: 'FaGift',
      isActive: true,
      prizeType: 'labu',
      partType: null,
      partRarity: null,
      labuAmount: 5000
    }
  ]

  // Проверяем что сумма шансов = 69% (остальные 31% - пустые)
  const totalChance = prizes.reduce((sum, prize) => sum + prize.chance, 0)
  console.log(`📊 Общая вероятность призов: ${totalChance}% (должно быть 69%)`)
  console.log(`🎯 Итого секторов с призами: ${prizes.length} (12 секторов)`)
  console.log(`🕳️ Пустых секторов: ${100 - totalChance}%`)

  // Очищаем старые призы
  await prisma.prize.deleteMany()
  console.log('🗑️ Старые призы удалены')

  // Создаем новые призы
  for (const prize of prizes) {
    await prisma.prize.create({
      data: prize
    })
  }

  console.log('🎁 Новые 12 призов созданы!')

  // Создаем настройки (ПРОФИТНЫЕ ЦЕНЫ!)
  const settings = [
    { key: 'spin_cost', value: '12000' }, // 120 рублей в копейках
    { key: 'premium_spin_cost', value: '19900' }, // 199 рублей в копейках
    { key: 'min_prize_delivery_value', value: '50000' }, // минимальная стоимость для доставки
    { key: 'contact_telegram', value: '@labubu_support' },
    { key: 'guaranteed_prize_spins', value: '15' }, // гарантированный приз каждые N спинов
    { key: 'duplicate_exchange_rate', value: '300' }, // ЛАБУ за дубликат (было 200)
    { key: 'exchange_limit_per_month', value: '1' }, // ограничение обмена ЛАБУ в месяц
    { key: 'min_parts_for_exchange', value: '4' } // минимум частей для доступа к обмену ЛАБУ
  ]

  for (const setting of settings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting
    })
  }

  console.log('⚙️ Настройки обновлены!')

  // Создаем магазин
  const shopItems = [
    {
      name: 'Labubu (Обычная)',
      description: 'Оригинальная кукла Labubu. Соберите все 4 обычные части или купите за ЛАБУ!',
      labuCost: 50000,
      realValue: 750000, // 7500 рублей
      category: 'labubu_normal',
      isActive: true,
      imageUrl: '/images/labubu/complete/original.png'
    },
    {
      name: 'Labubu (Эксклюзив)',
      description: 'Эксклюзивная коллекционная Labubu! Редкая и очень ценная!',
      labuCost: 150000,
      realValue: 1500000, // 15000 рублей
      category: 'labubu_exclusive',
      isActive: true,
      imageUrl: '/images/labubu/complete/exclusive.png'
    }
  ]

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      update: {},
      create: item
    })
  }

  console.log('🛒 Магазин создан!')
  console.log('✅ База данных успешно инициализирована с 12 секторами!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })