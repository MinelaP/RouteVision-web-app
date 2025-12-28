import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

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
  vozac_id: number | null
  vozac_ime: string | null
  vozac_prezime: string | null
  aktivan: boolean
  datum_kreiranja: Date
}

// GET /api/vozni-park - Dohvatanje svih kamiona
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

    const [kamioni] = await pool.execute<KamionRow[]>(
      `SELECT k.*, k.zaduzeni_vozac_id as vozac_id, v.ime as vozac_ime, v.prezime as vozac_prezime 
       FROM kamion k 
       LEFT JOIN vozac v ON k.zaduzeni_vozac_id = v.id 
       ORDER BY k.datum_kreiranja DESC`,
    )

    return NextResponse.json({ success: true, data: kamioni })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// POST /api/vozni-park - Kreiranje novog kamiona
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
    const {
      registarska_tablica,
      marka,
      model,
      godina_proizvodnje,
      kapacitet_tone,
      vrsta_voza,
      stanje_kilometra,
      datum_registracije,
      datum_zakljucnog_pregleda,
      vozac_id,
    } = body

    const normalizedVozacId = vozac_id && Number(vozac_id) !== 0 ? Number(vozac_id) : null

    // Validacija
    if (!registarska_tablica || !marka || !model) {
      return NextResponse.json(
        { success: false, message: "Registarska tablica, marka i model su obavezni" },
        { status: 400 },
      )
    }

    // Provjera da li registarska tablica već postoji
    const [existing] = await pool.execute<KamionRow[]>("SELECT id FROM kamion WHERE registarska_tablica = ?", [
      registarska_tablica,
    ])

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Registarska tablica već postoji" }, { status: 400 })
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO kamion (registarska_tablica, marka, model, godina_proizvodnje, kapacitet_tone, 
       vrsta_voza, stanje_kilometra, datum_registracije, datum_zakljucnog_pregleda, zaduzeni_vozac_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registarska_tablica,
        marka,
        model,
        godina_proizvodnje || null,
        kapacitet_tone || null,
        vrsta_voza || null,
        stanje_kilometra || 0,
        datum_registracije || null,
        datum_zakljucnog_pregleda || null,
        normalizedVozacId,
      ],
    )

    return NextResponse.json({
      success: true,
      message: "Kamion uspješno kreiran",
      id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Greška pri kreiranju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
