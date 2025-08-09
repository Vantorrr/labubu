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
      const photoUrl = 'https://i.ibb.co/Dg8f0QyM/97-EEDBE6-0482-43-B8-B47-C-92584-E7-B19-DD.png'
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
          { text: '📜 Правила', callback_data: 'rules' },
          { text: '🆘 Поддержка', url: 'https://t.me/pavel_xdev' }
        ]]
      }
      const form = new FormData()
      form.set('chat_id', String(chatId))
      // Используем прямую ссылку как просил пользователь
      form.set('photo', photoUrl)
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
      const chatId = callback.message?.chat.id || callback.from.id
      const data = callback.data
      try {
        // acknowledge to stop spinner
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callback_query_id: callback.id })
        })
      } catch {}
      if (data === 'rules') {
        const rules = [
          '<b>Правила игры Labubu Roulette</b>',
          '',
          '• Стоимость спина: 120₽ (обычный) / 199₽ (премиум, x2 шанс на части).',
          '• На колесе 12 секторов: 4 части обычные, 4 части эксклюзив, и ЛАБУ.',
          '• Дубликаты частей автоматически обмениваются на <b>200 ЛАБУ</b>.',
          '• ЛАБУ — внутренняя валюта, не выводится, копится в профиле.',
          '',
          '<b>Как получить приз</b>',
          '1) Собери 4 разные части — игрушка Labubu (авто-зачёт).',
          '2) Накопи ЛАБУ и обменяй в магазине.',
          '',
          '<b>Реферальные бонусы</b>',
          '• Регистрируется по твоему коду: +500 ЛАБУ.',
          '• Делает 1 спин: +1000 ЛАБУ.',
          '• Делает 10 спинов суммарно: +2500 ЛАБУ.',
          '• Собирает 4 части: +3000 ЛАБУ.',
          '',
          'Шансы выпадения и логика определения приза считаются на сервере. Все спины и балансы сохраняются.',
          '',
          'Поддержка: @pavel_xdev'
        ].join('\n')
        const form = new FormData()
        form.set('chat_id', String(chatId))
        form.set('text', rules)
        form.set('parse_mode', 'HTML')
        // Клавиатура с кнопкой назад в главное меню
        const backKb = { inline_keyboard: [[[{ text: '⬅️ Главное меню', callback_data: 'home' }]]] }
        form.set('reply_markup', JSON.stringify(backKb))
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', body: form as any })
        const bodyText = await tgRes.text().catch(() => '')
        if (!tgRes.ok) console.error('Telegram sendMessage rules failed', tgRes.status, bodyText)
      } else if (data === 'home') {
        await sendWelcome(chatId)
      } else {
        await sendWelcome(chatId)
      }
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

