import { NextRequest, NextResponse } from 'next/server'
import { TELEGRAM_CONFIG } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const { chat_id } = await req.json()
    if (!chat_id) return NextResponse.json({ ok: false, error: 'chat_id required' }, { status: 400 })

    const photo = 'https://i.ibb.co/CtBz5Mq/1JdGFT5X.png' // proxy of https://ibb.co/1JdGFT5X
    const caption = [
      '🎊 LABUBU РУЛЕТКА — выиграй настоящие призы!',
      '',
      '🧸 Собирай 4 части Labubu или копи ЛАБУ и обменивай на игрушку.',
      '⚡ Быстрые спины, честные шансы, реферальные бонусы.',
      '',
      'Нажми кнопку ниже, чтобы играть прямо в Telegram.'
    ].join('\n')

    const kb = {
      inline_keyboard: [[
        { text: '🎮 Играть', web_app: { url: process.env.NEXT_PUBLIC_APP_URL || 'https://labubu-production-3acf.up.railway.app' } },
      ], [
        { text: '📜 Правила', url: (process.env.NEXT_PUBLIC_RULES_URL || 'https://labubu-production-3acf.up.railway.app#rules') },
        { text: '🆘 Поддержка', url: 'https://t.me/pavel_xdev' }
      ]]
    }

    const form = new FormData()
    form.set('chat_id', String(chat_id))
    form.set('photo', photo)
    form.set('caption', caption)
    form.set('parse_mode', 'HTML')
    form.set('reply_markup', JSON.stringify(kb))

    const res = await fetch(`${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form as any
    })
    const json = await res.json()
    return NextResponse.json(json)
  } catch (e) {
    console.error('telegram/start error', e)
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 })
  }
}

