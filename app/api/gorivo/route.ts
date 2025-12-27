import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// GET - Dobavi sva punj enja goriva
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const servisi = await query(
      `SELECT 
        g.*,
        k.registracija as kamion_registracija,
        k.model as kamion_model
      FROM gorivo g
      LEFT JOIN kamion k ON g.kamion_id = k.kamion_id
      ORDER BY g.datum DESC`,
    )

    return NextResponse.json(servisi)
  } catch (error) {
    console.error("Greška pri dohvaćanju goriva:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novi unos goriva
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const data = await request.json()
    const { kamion_id, datum, litara, cijena_po_litri, ukupno } = data

    if (!kamion_id || !datum || !litara || !cijena_po_litri || !ukupno) {
      return NextResponse.json(
        {
          error: "Sva obavezna polja moraju biti popunjena",
        },
        { status: 400 },
      )
    }

    const result = await query(
      `INSERT INTO gorivo (kamion_id, datum, litara, cijena_po_litri, ukupno)
       VALUES (?, ?, ?, ?, ?)`,
      [kamion_id, datum, Number.parseFloat(litara), Number.parseFloat(cijena_po_litri), Number.parseFloat(ukupno)],
    )

    return NextResponse.json(
      {
        message: "Gorivo uspješno kreirano",
        gorivo_id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju goriva:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
