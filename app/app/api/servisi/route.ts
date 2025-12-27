import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// GET - Dobavi sve servise
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tip = searchParams.get("tip") // 'kamion' ili 'oprema'

    let sql = `
      SELECT 
        s.*,
        k.registracija as kamion_registracija,
        k.model as kamion_model,
        o.naziv as oprema_naziv
      FROM servis s
      LEFT JOIN kamion k ON s.kamion_id = k.kamion_id
      LEFT JOIN oprema o ON s.oprema_id = o.oprema_id
    `

    const params: any[] = []

    if (tip === "kamion") {
      sql += " WHERE s.kamion_id IS NOT NULL"
    } else if (tip === "oprema") {
      sql += " WHERE s.oprema_id IS NOT NULL"
    }

    sql += " ORDER BY s.datum DESC"

    const servisi = await query(sql, params)
    return NextResponse.json(servisi)
  } catch (error) {
    console.error("Greška pri dohvaćanju servisa:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novi servis
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const data = await request.json()
    const { kamion_id, oprema_id, datum, opis, troskovi } = data

    // Validacija - mora biti ili kamion_id ili oprema_id
    if ((!kamion_id && !oprema_id) || (kamion_id && oprema_id)) {
      return NextResponse.json(
        {
          error: "Morate odabrati ili kamion ili opremu",
        },
        { status: 400 },
      )
    }

    if (!datum || !opis || !troskovi) {
      return NextResponse.json(
        {
          error: "Sva obavezna polja moraju biti popunjena",
        },
        { status: 400 },
      )
    }

    const result = await query(
      `INSERT INTO servis (kamion_id, oprema_id, datum, opis, troskovi)
       VALUES (?, ?, ?, ?, ?)`,
      [kamion_id || null, oprema_id || null, datum, opis, Number.parseFloat(troskovi)],
    )

    return NextResponse.json(
      {
        message: "Servis uspješno kreiran",
        servis_id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju servisa:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
