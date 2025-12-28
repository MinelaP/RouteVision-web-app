import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

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

// GET - Dobavi sve stavke goriva
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    const params: Array<string | number> = []
    let sql = `
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
    `

    if (user.role === "vozac") {
      sql += " AND g.kamion_id = (SELECT kamion_id FROM vozac WHERE id = ?)"
      params.push(user.id)
    }

    sql += " ORDER BY g.datum DESC"

    const [gorivo] = await pool.execute<GorivoRow[]>(sql, params)
    return NextResponse.json({ success: true, data: gorivo })
  } catch (error) {
    console.error("Greška pri dohvaćanju goriva:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novo gorivo
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
    const { kamion_id, datum, litara, cijena_po_litri, ukupno } = data
    const kamionId = Number(kamion_id)
    const parsedLitara = Number.parseFloat(litara)
    const parsedCijena = Number.parseFloat(cijena_po_litri)
    const parsedUkupno = Number.parseFloat(ukupno)

    if (!kamionId || !datum || Number.isNaN(parsedLitara) || Number.isNaN(parsedCijena) || Number.isNaN(parsedUkupno)) {
      return NextResponse.json(
        {
          success: false,
          message: "Sva obavezna polja moraju biti popunjena",
        },
        { status: 400 },
      )
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO gorivo (kamion_id, datum, litara, cijena_po_litri, ukupno)
       VALUES (?, ?, ?, ?, ?)`,
      [kamionId, datum, parsedLitara, parsedCijena, parsedUkupno],
    )

    return NextResponse.json(
      {
        success: true,
        message: "Gorivo uspješno kreirano",
        id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju goriva:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}
