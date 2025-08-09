import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID обязателен' 
      }, { status: 400 })
    }

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { sessionId },
      include: {
        referrals: {
          include: {
            spins: true,
            collection: true
          }
        },
        referralBonuses: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Пользователь не найден' 
      }, { status: 404 })
    }

    // Подсчитать статистику рефералов
    const referralStats = user.referrals.map(referral => {
      const spinCount = referral.spins.length
      const hasCompleteCollection = checkCompleteCollection(referral.collection)
      
      return {
        id: referral.id,
        name: referral.name || `Пользователь ${referral.sessionId.slice(-4)}`,
        createdAt: referral.createdAt,
        spinCount,
        hasCompleteCollection
      }
    })

    // Подсчитать заработанные бонусы по типам
    const bonusesByAction = user.referralBonuses.reduce((acc, bonus) => {
      acc[bonus.action] = (acc[bonus.action] || 0) + bonus.amount
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      stats: {
        referralCode: user.referralCode,
        totalReferrals: user.referrals.length,
        totalEarnings: user.referralEarnings,
        referrals: referralStats,
        bonusesByAction,
        recentBonuses: user.referralBonuses.slice(0, 10) // Последние 10 бонусов
      }
    })

  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка при получении статистики' 
    }, { status: 500 })
  }
}

function checkCompleteCollection(collection: any[]) {
  const requiredParts = ['part1', 'part2', 'part3', 'part4']
  const normalParts = collection.filter(c => c.partRarity === 'normal').map(c => c.partType)
  const exclusiveParts = collection.filter(c => c.partRarity === 'exclusive').map(c => c.partType)
  
  const hasCompleteNormal = requiredParts.every(part => normalParts.includes(part))
  const hasCompleteExclusive = requiredParts.every(part => exclusiveParts.includes(part))
  
  return hasCompleteNormal || hasCompleteExclusive
}