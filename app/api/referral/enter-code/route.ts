import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, referralCode, telegramUser } = await request.json()

    if (!sessionId || !referralCode) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session ID и промокод обязательны' 
      }, { status: 400 })
    }

    // Найти или создать пользователя
    let user = await prisma.user.findUnique({
      where: { sessionId }
    })

    if (!user) {
      const userData: any = { sessionId }
      if (telegramUser) {
        userData.telegramId = telegramUser.id.toString()
        userData.name = `${telegramUser.first_name}${telegramUser.last_name ? ' ' + telegramUser.last_name : ''}`
        userData.email = telegramUser.username ? `${telegramUser.username}@telegram.user` : null
      }
      user = await prisma.user.create({ data: userData })
    }

    // Проверить, что пользователь еще не использовал промокод
    if (user.referredById) {
      return NextResponse.json({ 
        success: false, 
        error: 'Вы уже использовали промокод!' 
      }, { status: 400 })
    }

    // Найти пользователя по промокоду
    const referrer = await prisma.user.findUnique({
      where: { referralCode }
    })

    if (!referrer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Промокод не найден!' 
      }, { status: 400 })
    }

    // Нельзя использовать свой собственный промокод
    if (referrer.id === user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Нельзя использовать свой собственный промокод!' 
      }, { status: 400 })
    }

    // Привязать пользователя к рефереру
    await prisma.user.update({
      where: { id: user.id },
      data: { referredById: referrer.id }
    })

    // Дать бонус новому пользователю (500 ЛАБУ)
    await prisma.user.update({
      where: { id: user.id },
      data: { labuBalance: { increment: 500 } }
    })

    // Создать транзакцию для нового пользователя
    await prisma.labuTransaction.create({
      data: {
        userId: user.id,
        amount: 500,
        type: 'referral_bonus',
        description: 'Бонус за использование промокода',
        relatedId: referrer.id
      }
    })

    // Дать бонус рефереру (500 ЛАБУ за регистрацию)
    await prisma.user.update({
      where: { id: referrer.id },
      data: { 
        labuBalance: { increment: 500 },
        referralEarnings: { increment: 500 }
      }
    })

    // Создать транзакцию для реферера
    await prisma.labuTransaction.create({
      data: {
        userId: referrer.id,
        amount: 500,
        type: 'referral_bonus',
        description: `Бонус за приглашение пользователя ${user.name || user.sessionId}`,
        relatedId: user.id
      }
    })

    // Записать реферальный бонус
    await prisma.referralBonus.create({
      data: {
        userId: referrer.id,
        referralId: user.id,
        action: 'registration',
        amount: 500
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Промокод успешно применен! Вы получили 500 ЛАБУ!',
      labuBonus: 500
    })

  } catch (error) {
    console.error('Error applying referral code:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка при применении промокода' 
    }, { status: 500 })
  }
}