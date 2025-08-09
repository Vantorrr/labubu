import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const prizes = await prisma.prize.findMany({
      where: { isActive: true },
      orderBy: { chance: 'asc' }
    })

    // Добавляем поле rawValue для frontend
    const prizesWithRawValue = prizes.map(prize => ({
      ...prize,
      rawValue: prize.labuAmount || 0
    }))

    return NextResponse.json({
      success: true,
      prizes: prizesWithRawValue
    })
  } catch (error) {
    console.error('Error fetching prizes:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch prizes' },
      { status: 500 }
    )
  }
}