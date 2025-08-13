import { NextRequest, NextResponse } from 'next/server'

function md5(s: string) {
  const crypto = require('crypto') as typeof import('crypto')
  return crypto.createHash('md5').update(s).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { amountRub, sessionId, product = 'spins_10', orderId } = await req.json()

    if (!amountRub || !sessionId) {
      return NextResponse.json({ success: false, error: 'amountRub and sessionId are required' }, { status: 400 })
    }

    const merchantId = (process.env.FK_MERCHANT_ID || '').trim()
    const secret1 = (process.env.FK_SECRET_1 || '').trim()

    if (!merchantId || !secret1) {
      return NextResponse.json({ success: false, error: 'FreeKassa not configured' }, { status: 500 })
    }

    const amount = Number(amountRub).toFixed(2)
    const oid = orderId || `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

    // Подпись для ссылки оплаты (SCI): md5(MERCHANT_ID:AMOUNT:SECRET_WORD_1:ORDER_ID)
    const signString = [merchantId, amount, secret1, oid].join(':')
    const sign = md5(signString).toUpperCase()

    // Используем официальный домен SCI. Если провайдер блокирует, FK рекомендует pay.fk.money
    const url = new URL('https://pay.fk.money/')
    url.searchParams.set('m', String(merchantId))
    url.searchParams.set('oa', String(amount))
    url.searchParams.set('o', oid)
    url.searchParams.set('currency', 'RUB')
    url.searchParams.set('us_session', sessionId)
    url.searchParams.set('us_product', product)
    url.searchParams.set('s', sign)
    url.searchParams.set('lang', 'ru')

    return NextResponse.json({ success: true, link: url.toString(), orderId: oid })
  } catch (e) {
    console.error('freekassa create-link error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}


