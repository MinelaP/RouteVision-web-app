import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const servisi = await query(`
      SELECT 
        s.*,
        k.registracija as kamion_registracija,
        k.model as kamion_model,
        o.naziv as oprema_naziv
      FROM servis s
      LEFT JOIN kamion k ON s.kamion_id = k.kamion_id
      LEFT JOIN oprema o ON s.oprema_id = o.oprema_id
      ORDER BY s.datum DESC
    `)

    return NextResponse.json(servisi)
  } catch (error) {
    console.error("Greška pri exportu servisa:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
