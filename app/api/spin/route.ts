import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, spinType = 'normal' } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Находим или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { sessionId },
      include: { collection: true }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          sessionId,
          name: `Игрок ${Math.random().toString(36).substr(2, 5)}`,
          labuBalance: 0
        },
        include: { collection: true }
      })
    }

    // Получаем настройки
    const costKey = spinType === 'premium' ? 'premium_spin_cost' : 'spin_cost'
    const [spinCostSetting, duplicateRewardSetting] = await Promise.all([
      prisma.settings.findUnique({ where: { key: costKey } }),
      prisma.settings.findUnique({ where: { key: 'duplicate_exchange_rate' } })
    ])
    const spinCost = parseInt(spinCostSetting?.value || '10000')
    const duplicateReward = parseInt(duplicateRewardSetting?.value || '200')

    // Проверяем и списываем рублевый баланс (в копейках)
    const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!freshUser || freshUser.rubBalance < spinCost) {
      return NextResponse.json({ success: false, error: 'Недостаточно средств на балансе', code: 'INSUFFICIENT_FUNDS' }, { status: 402 })
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { rubBalance: { decrement: spinCost } }
    })

    // Создаем спин
    const spin = await prisma.spin.create({
      data: {
        userId: user.id,
        amount: spinCost
      }
    })

    // Получаем все активные призы (только реальные призы, без "пусто")
    const prizes = await prisma.prize.findMany({
      where: { isActive: true },
      orderBy: { chance: 'asc' }
    })

    // Применяем модификатор для премиум спина (только для частей)
    const modifiedPrizes = prizes.map(prize => ({
      ...prize,
      chance: prize.prizeType === 'part' && spinType === 'premium'
        ? prize.chance * 2
        : prize.chance
    }))

    // Сумма шансов реальных призов (без "пусто"). Остаток — это шанс промаха
    const totalChance = modifiedPrizes.reduce((sum, p) => sum + p.chance, 0)
    const missChance = Math.max(0, 100 - totalChance)

    // Обеспечим наличие специального приза "пусто" для записи результата
    let emptyPrize = await prisma.prize.findFirst({ where: { prizeType: 'empty' } })
    if (!emptyPrize) {
      emptyPrize = await prisma.prize.create({
        data: {
          name: 'Попробуй еще!',
          value: 0,
          chance: 0, // реальный шанс считается динамически (missChance)
          rarity: 'common',
          color: '#6b7280',
          icon: 'FaTimes',
          isActive: false, // не показываем в списках призов
          prizeType: 'empty'
        }
      })
    }

    // Розыгрыш по "сырым" шансам (0-100) с учетом промаха
    const random = Math.random() * 100
    let accumulatedChance = 0
    let wonPrize = emptyPrize

    for (const prize of modifiedPrizes) {
      accumulatedChance += prize.chance
      if (random <= accumulatedChance) {
        wonPrize = prize
        break
      }
    }
    // Если не попали ни в один приз — промах
    if (random > accumulatedChance && missChance > 0) {
      wonPrize = emptyPrize
    }

    // Обрабатываем приз
    let prizeResult: any = {
      type: wonPrize.prizeType,
      name: wonPrize.name,
      id: wonPrize.id,
      rarity: wonPrize.rarity,
      color: wonPrize.color,
      icon: wonPrize.icon,
      value: wonPrize.value
    }

    // Если это часть коллекции
    if (wonPrize.prizeType === 'part') {
      // Проверяем есть ли уже эта часть у пользователя
      const existingPart = await prisma.userCollection.findUnique({
        where: {
          userId_partType_partRarity: {
            userId: user.id,
            partType: wonPrize.partType!,
            partRarity: wonPrize.partRarity!
          }
        }
      })

      if (existingPart) {
        // ДУБЛИКАТ! Добавляем ЛАБУ вместо части
        await prisma.user.update({
          where: { id: user.id },
          data: { labuBalance: { increment: duplicateReward } }
        })

        // Создаем транзакцию ЛАБУ за дубликат
        await prisma.labuTransaction.create({
          data: {
            userId: user.id,
            amount: duplicateReward,
            type: 'duplicate_exchange',
            description: `${duplicateReward} ЛАБУ за дубликат: ${wonPrize.name}`,
            relatedId: spin.id
          }
        })

        // Увеличиваем количество дубликатов
        await prisma.userCollection.update({
          where: {
            userId_partType_partRarity: {
              userId: user.id,
              partType: wonPrize.partType!,
              partRarity: wonPrize.partRarity!
            }
          },
          data: { quantity: { increment: 1 } }
        })

        prizeResult = {
          ...prizeResult,
          partType: wonPrize.partType,
          partRarity: wonPrize.partRarity,
          isDuplicate: true,
          labuAmount: duplicateReward,
          message: `😕 Упс! Эта часть у вас уже есть. Получите ${duplicateReward} ЛАБУ за дубликат!`
        }
      } else {
        // НОВАЯ ЧАСТЬ! Добавляем в коллекцию
        await prisma.userCollection.create({
          data: {
            userId: user.id,
            partType: wonPrize.partType!,
            partRarity: wonPrize.partRarity!,
            quantity: 1
          }
        })

        prizeResult = {
          ...prizeResult,
          partType: wonPrize.partType,
          partRarity: wonPrize.partRarity,
          isDuplicate: false,
          message: `🎉 Поздравляем! Вы получили новую часть: ${wonPrize.name}!`
        }
      }
    }

    // Если это ЛАБУ
    if (wonPrize.prizeType === 'labu' && (wonPrize as any).labuAmount) {
      await prisma.user.update({
        where: { id: user.id },
        data: { labuBalance: { increment: (wonPrize as any).labuAmount } }
      })

      // Создаем транзакцию ЛАБУ
      await prisma.labuTransaction.create({
        data: {
          userId: user.id,
        amount: (wonPrize as any).labuAmount,
          type: 'spin_reward',
        description: `Получено ${(wonPrize as any).labuAmount} ЛАБУ за спин`,
          relatedId: spin.id
        }
      })

      prizeResult = {
        ...prizeResult,
        labuAmount: (wonPrize as any).labuAmount
      }
    }

    // Создаем выигрыш
    const win = await prisma.win.create({
      data: {
        spinId: spin.id,
        userId: user.id,
        prizeId: wonPrize.id
      }
    })

    // Проверяем реферальные бонусы
    await checkReferralBonuses(user.id)

    // Получаем обновленные данные пользователя
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { 
        collection: true,
        spins: { include: { win: true } }
      }
    })

    // Преобразовать коллекцию в удобный формат
    const normalCollection = { part1: 0, part2: 0, part3: 0, part4: 0 }
    const collectibleCollection = { part1: 0, part2: 0, part3: 0, part4: 0 }

    updatedUser!.collection.forEach(item => {
      if (item.partRarity === 'normal') {
        normalCollection[item.partType as keyof typeof normalCollection] = item.quantity
      } else if (item.partRarity === 'exclusive') {
        collectibleCollection[item.partType as keyof typeof collectibleCollection] = item.quantity
      }
    })

    // Проверяем, есть ли полные коллекции
    const collections = {
      normal: checkCompleteCollection(updatedUser!.collection, 'normal'),
      collection: checkCompleteCollection(updatedUser!.collection, 'exclusive')
    }

    return NextResponse.json({
      success: true,
      spin: {
        id: spin.id,
        timestamp: spin.timestamp,
        cost: spinCost
      },
      prize: wonPrize,
      prizeResult: prizeResult,
      user: {
        labuBalance: updatedUser!.labuBalance,
        rubBalance: updatedUser!.rubBalance,
        totalSpins: updatedUser!.spins.length,
        normalCollection,
        collectibleCollection,
        collections: collections
      },
      win: {
        id: win.id,
        verified: win.verified,
        claimed: win.claimed
      }
    })

  } catch (error) {
    console.error('Spin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Проверяем полную коллекцию
function checkCompleteCollection(userCollection: any[], rarity: string) {
  const requiredParts = ['head', 'body', 'arms', 'legs']
  const collectedParts = userCollection
    .filter(c => c.partRarity === rarity)
    .map(c => c.partType)
  
  const hasAll = requiredParts.every(part => collectedParts.includes(part))
  const progress = collectedParts.length

  return {
    complete: hasAll,
    progress: progress,
    total: 4,
    parts: userCollection
      .filter(c => c.partRarity === rarity)
      .reduce((acc, c) => {
        acc[c.partType] = c.quantity
        return acc
      }, {} as Record<string, number>)
  }
}

export async function GET() {
  try {
    // Получаем последние выигрыши для показа на главной
    const recentWins = await prisma.win.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: true,
        prize: true
      },
      where: {
        prize: {
          value: { gt: 0 } // только реальные призы
        }
      }
    })

    const formattedWins = recentWins.map(win => ({
      user: `${win.user.name?.substring(0, 8)}...`,
      prize: win.prize.name,
      value: win.prize.value,
      timestamp: win.timestamp,
      verified: win.verified
    }))

    return NextResponse.json({ wins: formattedWins })

  } catch (error) {
    console.error('Get wins error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Функция для проверки и начисления реферальных бонусов
async function checkReferralBonuses(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        spins: true,
        collection: true,
        referredBy: true
      }
    })

    if (!user || !user.referredBy) {
      return // Нет реферера
    }

    const referrerId = user.referredBy.id
    const spinCount = user.spins.length

    // Проверяем бонус за первый спин
    if (spinCount === 1) {
      const existingBonus = await prisma.referralBonus.findFirst({
        where: {
          userId: referrerId,
          referralId: userId,
          action: 'first_spin'
        }
      })

      if (!existingBonus) {
        await giveReferralBonus(referrerId, userId, 'first_spin', 1000)
      }
    }

    // Проверяем бонус за 10 спинов
    if (spinCount === 10) {
      const existingBonus = await prisma.referralBonus.findFirst({
        where: {
          userId: referrerId,
          referralId: userId,
          action: 'tenth_spin'
        }
      })

      if (!existingBonus) {
        await giveReferralBonus(referrerId, userId, 'tenth_spin', 2500)
      }
    }

    // Проверяем бонус за сбор полной коллекции
    const hasCompleteCollection = checkCompleteCollection(user.collection, 'normal') || 
                                   checkCompleteCollection(user.collection, 'exclusive')

    if (hasCompleteCollection) {
      const existingBonus = await prisma.referralBonus.findFirst({
        where: {
          userId: referrerId,
          referralId: userId,
          action: 'completed_collection'
        }
      })

      if (!existingBonus) {
        await giveReferralBonus(referrerId, userId, 'completed_collection', 3000)
      }
    }

  } catch (error) {
    console.error('Error checking referral bonuses:', error)
  }
}

// Функция для начисления реферального бонуса
async function giveReferralBonus(referrerId: string, referralId: string, action: string, amount: number) {
  try {
    // Начисляем ЛАБУ рефереру
    await prisma.user.update({
      where: { id: referrerId },
      data: { 
        labuBalance: { increment: amount },
        referralEarnings: { increment: amount }
      }
    })

    // Создаем транзакцию
    await prisma.labuTransaction.create({
      data: {
        userId: referrerId,
        amount: amount,
        type: 'referral_bonus',
        description: `Реферальный бонус: ${getActionDescription(action)}`,
        relatedId: referralId
      }
    })

    // Записываем реферальный бонус
    await prisma.referralBonus.create({
      data: {
        userId: referrerId,
        referralId: referralId,
        action: action,
        amount: amount
      }
    })

    console.log(`Referral bonus given: ${amount} LABU to ${referrerId} for ${action}`)

  } catch (error) {
    console.error('Error giving referral bonus:', error)
  }
}

function getActionDescription(action: string): string {
  switch (action) {
    case 'registration': return 'Регистрация реферала'
    case 'first_spin': return 'Первый спин реферала'
    case 'tenth_spin': return '10 спинов реферала'
    case 'completed_collection': return 'Завершение коллекции рефералом'
    default: return 'Реферальная активность'
  }
}