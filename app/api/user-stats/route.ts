import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, telegramUser } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Найти или создать пользователя
    let user = await prisma.user.findUnique({
      where: { sessionId },
      include: {
        collection: true,
        spins: true
      }
    })

    if (!user) {
      try {
        // Создаем пользователя с Telegram данными
        const userData: any = { sessionId }
        
        if (telegramUser) {
          userData.telegramId = telegramUser.id.toString()
          userData.name = `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`
          userData.email = telegramUser.username ? `${telegramUser.username}@telegram.user` : null
        }
        
        user = await prisma.user.create({
          data: userData,
          include: {
            collection: true,
            spins: true
          }
        })
      } catch (error: any) {
        // Если пользователь уже существует (race condition), найти его
        if (error.code === 'P2002') {
          user = await prisma.user.findUnique({
            where: { sessionId },
            include: {
              collection: true,
              spins: true
            }
          })
        } else {
          throw error
        }
      }
    }

    // Преобразовать коллекцию в удобный формат (part1..part4)
    const normalCollection = { part1: 0, part2: 0, part3: 0, part4: 0 }
    const collectibleCollection = { part1: 0, part2: 0, part3: 0, part4: 0 }

    user!.collection.forEach(item => {
      if (item.partRarity === 'normal') {
        // @ts-ignore безопасно, так как partType хранится как 'part1'..'part4'
        normalCollection[item.partType] = item.quantity
      } else if (item.partRarity === 'exclusive') {
        // @ts-ignore
        collectibleCollection[item.partType] = item.quantity
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        labuBalance: user!.labuBalance,
        totalSpins: user!.spins.length,
        normalCollection,
        collectibleCollection
      }
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}