import { NextRequest, NextResponse } from 'next/server'

function md5(s: string) {
  const crypto = require('crypto') as typeof import('crypto')
  return crypto.createHash('md5').update(s).digest('hex')
}

// Формат суммы для FK: без лишних нулей (199 вместо 199.00),
// но с двумя знаками, если есть копейки (199.50)
function formatAmountForFK(amountRub: number | string): string {
  const n = Number(amountRub)
  if (!Number.isFinite(n)) return '0'
  const fixed = n.toFixed(2)
  // убираем завершающие нули и возможную точку
  return fixed.replace(/\.00$/, '').replace(/\.0$/, '').replace(/\.$/, '')
}

export async function POST(req: NextRequest) {
  try {
    const { amountRub, sessionId, product = 'spins_10', orderId } = await req.json()

    if (!amountRub || !sessionId) {
      return NextResponse.json({ success: false, error: 'amountRub and sessionId are required' }, { status: 400 })
    }

    const merchantId = (process.env.FK_MERCHANT_ID_OVERRIDE || process.env.FK_MERCHANT_ID || '').trim()
    const secret1 = (process.env.FK_SECRET_1_OVERRIDE || process.env.FK_SECRET_1 || '').trim()

    console.log('🔧 DEBUG FK CONFIG:', {
      merchantId,
      secret1,
      override_merchant: process.env.FK_MERCHANT_ID_OVERRIDE,
      override_secret: process.env.FK_SECRET_1_OVERRIDE
    })

    if (!merchantId || !secret1) {
      return NextResponse.json({ success: false, error: 'FreeKassa not configured' }, { status: 500 })
    }

    const amount = formatAmountForFK(amountRub)
    const oid = orderId || `${Date.now()}_${Math.floor(Math.random() * 1e6)}`

    // Пробуем разные варианты подписи FK - иногда они меняют формат
    const variants = [
      [merchantId, amount, secret1, oid].join(':'),                    // стандартный
      [merchantId, amount, secret1, 'RUB', oid].join(':'),             // с валютой  
      [merchantId, amount, 'RUB', secret1, oid].join(':'),             // валюта перед секретом
      [oid, merchantId, amount, secret1].join(':'),                    // order_id первый
      [secret1, merchantId, amount, oid].join(':'),                    // секрет первый
    ]
    
    console.log('🔧 DEBUG ALL VARIANTS:', variants.map((v, i) => ({ 
      variant: i+1, 
      string: v, 
      hash: md5(v).toUpperCase() 
    })))
    
    // Используем стандартный вариант
    const signString = variants[0]
    const sign = md5(signString).toUpperCase()

    // Пробуем альтернативный домен FK
    const url = new URL('https://pay.freekassa.ru/')
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


