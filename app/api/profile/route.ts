import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 })
    }

    // Находим пользователя со всеми данными
    const user = await prisma.user.findUnique({
      where: { sessionId },
      include: {
        collection: true,
        spins: {
          include: {
            win: true
          },
          orderBy: {
            timestamp: 'desc'
          }
        },
        labuTransactions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Обрабатываем коллекции
    const normalCollection = { part1: 0, part2: 0, part3: 0, part4: 0 }
    const collectibleCollection = { part1: 0, part2: 0, part3: 0, part4: 0 }

    user.collection.forEach(item => {
      if (item.partRarity === 'normal') {
        normalCollection[item.partType as keyof typeof normalCollection] = item.quantity
      } else if (item.partRarity === 'exclusive') {
        collectibleCollection[item.partType as keyof typeof collectibleCollection] = item.quantity
      }
    })

    // Считаем статистику
    const totalSpins = user.spins.length
    const totalSpent = user.spins.reduce((sum, spin) => sum + spin.cost, 0)
    const totalWins = user.spins.filter(spin => spin.win).length
    const winRate = totalSpins > 0 ? Math.round((totalWins / totalSpins) * 100) : 0

    // Получаем последние спины с подробностями
    const recentSpins = await Promise.all(
      user.spins.slice(0, 20).map(async (spin) => {
        let prizeDetails = null
        if (spin.win) {
          const prize = await prisma.prize.findUnique({
            where: { id: spin.win.prizeId }
          })
          prizeDetails = prize
        }
        
        return {
          id: spin.id,
          timestamp: spin.timestamp,
          cost: spin.cost,
          spinType: spin.spinType,
          prize: prizeDetails,
          win: spin.win
        }
      })
    )

    // Группируем транзакции ЛАБУ по типам
    const labuStats = {
      total: user.labuBalance,
      earned: user.labuTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      spent: Math.abs(user.labuTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0))
    }

    // Прогресс коллекций
    const normalProgress = Object.values(normalCollection).filter(count => count > 0).length
    const collectibleProgress = Object.values(collectibleCollection).filter(count => count > 0).length

    return NextResponse.json({
      success: true,
      profile: {
        user: {
          sessionId: user.sessionId,
          labuBalance: user.labuBalance,
          createdAt: user.createdAt
        },
        statistics: {
          totalSpins,
          totalSpent,
          totalWins,
          winRate,
          labuStats
        },
        collections: {
          normal: {
            parts: normalCollection,
            progress: normalProgress,
            complete: normalProgress === 4
          },
          collectible: {
            parts: collectibleCollection,
            progress: collectibleProgress,
            complete: collectibleProgress === 4
          }
        },
        recentSpins,
        labuTransactions: user.labuTransactions.slice(0, 20).map(tx => ({
          ...tx,
          timestamp: tx.createdAt
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}