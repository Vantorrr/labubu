import { NextRequest, NextResponse } from 'next/server'
import { TELEGRAM_CONFIG } from '@/lib/telegram'

function getAppUrl(req: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL
  if (fromEnv) return fromEnv
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host') || ''
  return `${proto}://${host}`
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const token = TELEGRAM_CONFIG.BOT_TOKEN
    if (!token) return NextResponse.json({ ok: false, error: 'BOT_TOKEN missing' }, { status: 500 })

    // Only react to /start
    const msg = update?.message
    const text: string | undefined = msg?.text
    if (msg && text && text.startsWith('/start')) {
      const chatId = msg.chat.id
      const appUrl = getAppUrl(req)
      const photo = 'https://i.ibb.co/CtBz5Mq/1JdGFT5X.png'
      const caption = [
        '🎊 <b>LABUBU РУЛЕТКА</b> — выиграй настоящие призы!',
        '',
        '🧸 Собери 4 части или копи ЛАБУ и обменяй на игрушку.',
        '⚡ Честные шансы, красивый интерфейс, реферальные бонусы.',
      ].join('\n')
      const kb = {
        inline_keyboard: [[
          { text: '🎮 Играть', web_app: { url: appUrl } }
        ], [
          { text: '📜 Правила', url: `${appUrl}#rules` },
          { text: '🆘 Поддержка', url: 'https://t.me/pavel_xdev' }
        ]]
      }
      const form = new FormData()
      form.set('chat_id', String(chatId))
      form.set('photo', photo)
      form.set('caption', caption)
      form.set('parse_mode', 'HTML')
      form.set('reply_markup', JSON.stringify(kb))
      await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form as any })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('telegram webhook error', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

