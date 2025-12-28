import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { RowDataPacket } from "mysql2"

interface GorivoRow extends RowDataPacket {
  id: number
  kamion_id: number
  kamion_tablica: string | null
  kamion_model: string | null
  datum: Date
  litara: number
  cijena_po_litri: number
  ukupno: number
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const [gorivo] = await pool.execute<GorivoRow[]>(`
      SELECT 
        g.id,
        g.kamion_id,
        g.datum,
        g.litara,
        g.cijena_po_litri,
        g.ukupno,
        k.registarska_tablica as kamion_tablica,
        k.model as kamion_model
      FROM gorivo g
      LEFT JOIN kamion k ON g.kamion_id = k.id
      WHERE g.aktivan = TRUE
      ORDER BY g.datum DESC
    `)

    return NextResponse.json(gorivo)
  } catch (error) {
    console.error("Greška pri exportu goriva:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
