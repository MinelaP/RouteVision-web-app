import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { RowDataPacket } from "mysql2"

interface KamionRow extends RowDataPacket {
  id: number
  registarska_tablica: string
  marka: string
  model: string
  godina_proizvodnje: number
  kapacitet_tone: number
  vrsta_voza: string
  stanje_kilometra: number
  datum_registracije: Date
  datum_zakljucnog_pregleda: Date
  aktivan: boolean
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    if (user.role !== "vozac") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    const [kamioni] = await pool.execute<KamionRow[]>(
      `SELECT k.*
       FROM vozac v
       LEFT JOIN kamion k ON v.kamion_id = k.id
       WHERE v.id = ?`,
      [user.id],
    )

    if (kamioni.length === 0 || !kamioni[0].id) {
      return NextResponse.json({ success: false, message: "Nema dodijeljenog kamiona" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: kamioni[0] })
  } catch (error) {
    console.error("Greška pri dohvatanju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
