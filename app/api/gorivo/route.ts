import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { normalizeDateInput } from "@/lib/date"
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

interface VozacKamionRow extends RowDataPacket {
  kamion_id: number | null
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
    if (error && (error as { code?: string }).code === "ER_NO_SUCH_TABLE") {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Tabela gorivo nije pronađena. Pokrenite migracije baze.",
      })
    }
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

    if (user.role !== "admin" && user.role !== "vozac") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { kamion_id, datum, litara, cijena_po_litri, ukupno } = data
    let kamionId = Number(kamion_id)
    const parsedLitara = Number.parseFloat(litara)
    const parsedCijena = Number.parseFloat(cijena_po_litri)
    const parsedUkupno = Number.parseFloat(ukupno)
    const normalizedDatum = normalizeDateInput(datum)

    if (!normalizedDatum || Number.isNaN(parsedLitara) || Number.isNaN(parsedCijena) || Number.isNaN(parsedUkupno)) {
      return NextResponse.json(
          {
            success: false,
            message: "Sva obavezna polja moraju biti popunjena i validna",
          },
          { status: 400 },
      )
    }

    if (user.role === "vozac") {
      const [vozacKamion] = await pool.execute<VozacKamionRow[]>(
          "SELECT kamion_id FROM vozac WHERE id = ?",
          [user.id],
      )
      const assignedKamionId = vozacKamion?.[0]?.kamion_id
      if (!assignedKamionId) {
        return NextResponse.json({ success: false, message: "Nema dodijeljenog kamiona" }, { status: 400 })
      }
      kamionId = assignedKamionId
    }

    if (user.role === "admin" && !kamionId) {
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
      [kamionId, normalizedDatum, parsedLitara, parsedCijena, parsedUkupno],
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
