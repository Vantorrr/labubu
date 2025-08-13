import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function md5(s: string) {
  // lightweight md5 via crypto
  const crypto = require('crypto') as typeof import('crypto')
  return crypto.createHash('md5').update(s).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const params: Record<string, string> = {}
    body.forEach((v, k) => { params[k] = String(v) })

    const secret1 = process.env.FK_SECRET_1 || ''
    const secret2 = process.env.FK_SECRET_2 || ''
    if (!secret1 || !secret2) return NextResponse.json({ ok: false }, { status: 500 })

    // Подпись FK: md5(MERCHANT_ID:AMOUNT:SECRET_WORD_2:ORDER_ID)
    const sign = params['SIGN'] || params['SIGNATURE'] || ''
    const merchantId = params['MERCHANT_ID'] || params['MERCHANT_ID1'] || ''
    const amount = params['AMOUNT'] || params['AMOUNT_USD'] || params['AMOUNT_RUB'] || ''
    const orderId = params['MERCHANT_ORDER_ID'] || params['ORDER_ID'] || ''

    const mySign = md5([merchantId, amount, secret2, orderId].join(':')).toUpperCase()
    if (!sign || sign.toUpperCase() !== mySign) {
      return NextResponse.json({ ok: false, error: 'bad signature' }, { status: 400 })
    }

    // Наш custom payload: sessionId и тип покупки
    const sessionId = params['us_session'] || params['int_session'] || ''
    const product = params['us_product'] || 'spins_10'

    // Начислим: пример — за покупку spins_10 даём 10 премиум-спинов (или ЛАБУ)
    const spinCostSetting = await prisma.settings.findUnique({ where: { key: 'premium_spin_cost' } })
    const premiumCost = parseInt(spinCostSetting?.value || '19900')

    if (sessionId) {
      const user = await prisma.user.upsert({
        where: { sessionId },
        update: {},
        create: { sessionId }
      })

      if (product === 'spins_10') {
        // Просто добавим 10 записей Spin с amount=0 как «предоплаченные» либо дадим ЛАБУ
        for (let i = 0; i < 10; i++) {
          await prisma.spin.create({ data: { userId: user.id, amount: 0 } })
        }
      } else if (product === 'labu_5000') {
        await prisma.user.update({ where: { id: user.id }, data: { labuBalance: { increment: 5000 } } })
        await prisma.labuTransaction.create({ data: { userId: user.id, amount: 5000, type: 'purchase', description: 'FreeKassa' } as any })
      } else if (product === 'topup_rub') {
        // Пополнение рублевого кошелька — amount приходит в рублях (дробное)
        const rub = Math.round(parseFloat(amount || '0') * 100) // в копейках
        if (rub > 0) {
          await prisma.user.update({ where: { id: user.id }, data: { rubBalance: { increment: rub } } })
        }
      }
    }

    return new NextResponse('YES', { status: 200 })
  } catch (e) {
    console.error('freekassa webhook error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

