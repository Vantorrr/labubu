import { NextRequest, NextResponse } from 'next/server'
import { TELEGRAM_CONFIG } from '@/lib/telegram'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

    // Helpers
    const sendWelcome = async (chatId: number | string) => {
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
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: form as any })
      const bodyText = await tgRes.text().catch(() => '')
      if (!tgRes.ok) {
        console.error('Telegram sendPhoto failed', tgRes.status, bodyText)
      } else {
        try { const parsed = JSON.parse(bodyText); if (!parsed.ok) console.error('Telegram API error', parsed) } catch {}
      }
    }

    // React to /start and also to any first message
    const msg = update?.message
    const text: string | undefined = msg?.text
    const entities: any[] | undefined = msg?.entities
    const hasStartEntity = !!entities?.some(e => {
      try {
        if (e.type !== 'bot_command') return false
        const cmd = text?.substring(e.offset, e.offset + e.length)
        return cmd === '/start'
      } catch { return false }
    })
    // Для надёжности шлём привет на любой первый месседж, и точно на /start
    if (msg && (hasStartEntity || (text && text.toLowerCase().startsWith('/start')) || text)) {
      await sendWelcome(msg.chat.id)
    }
    // Handle callback_query presses (e.g., user tapped button again)
    const callback = update?.callback_query
    if (callback) {
      await sendWelcome(callback.message?.chat.id || callback.from.id)
    }
    // Some clients send my_chat_member when user starts chat; reply to greet anyway
    const membership = update?.my_chat_member
    if (membership) {
      await sendWelcome(membership.chat.id)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('telegram webhook error', e)
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

