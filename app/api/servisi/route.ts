import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { ResultSetHeader, RowDataPacket } from "mysql2"

interface ServisRow extends RowDataPacket {
  id: number
  kamion_id: number
  kamion_tablica: string | null
  kamion_model: string | null
  datum_servisa: Date
  vrsta_servisa: string | null
  opis_servisa: string | null
  troskovi: number | null
  vozac_id: number | null
}

// GET - Dobavi sve servise
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    const params: Array<string | number> = []
    let sql = `
      SELECT 
        s.id,
        s.kamion_id,
        s.vozac_id,
        s.datum_servisa,
        s.vrsta_servisa,
        s.opisServisa as opis_servisa,
        s.troskovi,
        k.registarska_tablica as kamion_tablica,
        k.model as kamion_model
      FROM servisni_dnevnik s
      LEFT JOIN kamion k ON s.kamion_id = k.id
      WHERE s.aktivan = TRUE
    `

    if (user.role === "vozac") {
      sql += " AND s.kamion_id = (SELECT kamion_id FROM vozac WHERE id = ?)"
      params.push(user.id)
    }

    sql += " ORDER BY s.datum_servisa DESC"

    const [servisi] = await pool.execute<ServisRow[]>(sql, params)
    return NextResponse.json({ success: true, data: servisi })
  } catch (error) {
    console.error("Greška pri dohvaćanju servisa:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novi servis
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { kamion_id, datum_servisa, vrsta_servisa, opis_servisa, troskovi } = data
    const kamionId = Number(kamion_id)
    const parsedTroskovi = Number.parseFloat(troskovi)

    if (!kamionId || !datum_servisa || Number.isNaN(parsedTroskovi)) {
      return NextResponse.json(
        {
          success: false,
          message: "Kamion, datum servisa i troškovi su obavezni",
        },
        { status: 400 },
      )
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO servisni_dnevnik (kamion_id, datum_servisa, vrsta_servisa, opisServisa, troskovi, nadlezni_admin_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        kamionId,
        datum_servisa,
        vrsta_servisa || null,
        opis_servisa || null,
        parsedTroskovi,
        user.id,
      ],
    )

    return NextResponse.json(
      {
        success: true,
        message: "Servis uspješno kreiran",
        id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju servisa:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}
