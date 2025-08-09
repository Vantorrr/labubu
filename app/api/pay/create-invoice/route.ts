import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, spinType = 'normal' } = await req.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'sessionId required' }, { status: 400 })
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ success: false, error: 'BOT token not configured' }, { status: 500 })
    }

    // Read star price from settings (string values)
    const starKey = spinType === 'premium' ? 'premium_spin_cost_stars' : 'spin_cost_stars'
    const setting = await prisma.settings.findUnique({ where: { key: starKey } })
    const stars = parseInt(setting?.value || (spinType === 'premium' ? '199' : '120'))

    // Create a unique payload so you can match payments later if нужно
    const payload = JSON.stringify({ t: Date.now(), sessionId, spinType })

    const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`

    const body = {
      title: spinType === 'premium' ? 'Premium Spin ×2' : 'Spin',
      description: spinType === 'premium' ? 'Премиум спин: x2 шанс на части' : 'Обычный спин',
      payload,
      currency: 'XTR', // Telegram Stars
      prices: [{ label: spinType === 'premium' ? 'Premium Spin' : 'Spin', amount: stars }],
      // Recommended for digital goods
      is_flexible: false,
    }

    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const tgJson = await tgRes.json()

    if (!tgJson.ok) {
      return NextResponse.json({ success: false, error: tgJson.description || 'Telegram error' }, { status: 502 })
    }

    const link: string = tgJson.result
    return NextResponse.json({ success: true, link, stars })
  } catch (e) {
    console.error('create-invoice error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

