import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface OpremaRow extends RowDataPacket {
  id: number
  naziv: string
  vrsta: string
  kamion_id: number | null
  kapacitet: number
  stanje: string
  datum_nabavke: Date
  datum_zadnje_provjere: Date
  napomena: string
  aktivan: boolean
  kamion_tablica: string | null
}

// GET /api/oprema
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    const [oprema] = await pool.execute<OpremaRow[]>(
      `SELECT o.*, k.registarska_tablica as kamion_tablica 
       FROM oprema o 
       LEFT JOIN kamion k ON o.kamion_id = k.id 
       ORDER BY o.datum_kreiranja DESC`,
    )

    return NextResponse.json({ success: true, data: oprema })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju opreme:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// POST /api/oprema
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    const body = await request.json()
    const { naziv, vrsta, kamion_id, kapacitet, stanje, datum_nabavke, datum_zadnje_provjere, napomena } = body

    if (!naziv) {
      return NextResponse.json({ success: false, message: "Naziv je obavezan" }, { status: 400 })
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO oprema (naziv, vrsta, kamion_id, kapacitet, stanje, datum_nabavke, datum_zadnje_provjere, napomena) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        naziv,
        vrsta || null,
        kamion_id || null,
        kapacitet || null,
        stanje || null,
        datum_nabavke || null,
        datum_zadnje_provjere || null,
        napomena || null,
      ],
    )

    return NextResponse.json({
      success: true,
      message: "Oprema uspješno kreirana",
      id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Greška pri kreiranju opreme:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
