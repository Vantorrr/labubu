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

    // Поддерживаем оба варианта по документации:
    // - без валюты md5(m:oa:secret1:o)
    // - с валютой md5(m:oa:secret1:currency:o) если параметр currency передаётся
    const currency = 'RUB'
    const signString = [merchantId, amount, secret1, currency, oid].join(':')
    const sign = md5(signString).toUpperCase()

    // Если настроен API-ключ FK, пробуем создать заказ через API (актуальный способ)
    const apiKey = (process.env.FK_API_KEY || '').trim()
    if (apiKey) {
      try {
        const nonce = Date.now()
        const apiSignature = md5([merchantId, nonce, apiKey].join(':')) // согласно API FK
        const apiRes = await fetch('https://api.fk.life/v1/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopId: Number(merchantId),
            nonce,
            signature: apiSignature,
            paymentId: oid,
            amount: Number(amount),
            currency,
          })
        })
        const apiData = await apiRes.json().catch(() => null)
        if (apiRes.ok && apiData) {
          const location = apiData?.location || apiData?.data?.location || apiData?.data?.link || apiData?.link
          if (location) {
            return NextResponse.json({ success: true, link: String(location), orderId: oid, via: 'api' })
          }
        }
      } catch {}
    }

    // Fallback на классический SCI
    const url = new URL('https://pay.freekassa.ru/')
    url.searchParams.set('m', String(merchantId))
    url.searchParams.set('oa', String(amount))
    url.searchParams.set('o', oid)
    url.searchParams.set('currency', currency)
    url.searchParams.set('us_session', sessionId)
    url.searchParams.set('us_product', product)
    url.searchParams.set('s', sign)
    url.searchParams.set('lang', 'ru')

    return NextResponse.json({ success: true, link: url.toString(), orderId: oid, via: 'sci' })
  } catch (e) {
    console.error('freekassa create-link error', e)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}


