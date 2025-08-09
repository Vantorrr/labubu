// Утилита для получения постоянного ID пользователя
export function getUserId(telegramUser?: any): string {
  // Используем Telegram ID если доступен
  if (telegramUser?.id) {
    return telegramUser.id.toString()
  }
  
  // Получаем или создаем постоянный guest ID
  if (typeof window !== 'undefined') {
    let guestId = localStorage.getItem('guestUserId')
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('guestUserId', guestId)
    }
    return guestId
  }
  
  // Fallback для серверной стороны
  return `guest_${Date.now()}_fallback`
}