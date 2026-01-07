// app/api/vozni-park/route.ts
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface KamionRow extends RowDataPacket {
  id: number
  registarska_tablica: string
  marka?: string
  model?: string
  zaduzeni_vozac_id?: number | null
  vozac_id?: number | null
  aktivan?: boolean
  datum_kreiranja?: Date
  // other fields allowed
}

export async function GET(request: NextRequest) {
  const debugMode = request.nextUrl.searchParams.get("debug") === "1"

  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))
    const userId = session.userId ?? session.id

    // Admin: return all active kamioni
    if (session.role === "admin") {
      const [rows] = await pool.execute<KamionRow[]>(
          `SELECT k.*, k.zaduzeni_vozac_id as vozac_id, v.ime as vozac_ime, v.prezime as vozac_prezime
         FROM kamion k
         LEFT JOIN vozac v ON k.zaduzeni_vozac_id = v.id
         WHERE k.aktivan = TRUE
         ORDER BY k.datum_kreiranja DESC`,
      )
      return NextResponse.json({ success: true, data: rows })
    }

    if (session.role !== "vozac") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    const debug: Array<{ step: string; count: number; note?: string }> = []

    // 1) Primary (YOUR working query): vozac -> kamion via v.kamion_id
    try {
      const [rows] = await pool.execute<KamionRow[]>(
          `SELECT k.*, k.zaduzeni_vozac_id as vozac_id 
         FROM vozac v
         LEFT JOIN kamion k ON v.kamion_id = k.id
         WHERE v.id = ? AND k.aktivan = TRUE`,
          [userId],
      )
      debug.push({ step: "join vozac.v.kamion_id -> kamion", count: Array.isArray(rows) ? rows.length : 0 })
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows, debug: debugMode ? debug : undefined })
      }
    } catch (err) {
      console.warn("[vozni-park] attempt 1 failed:", err)
      debug.push({ step: "join vozac.v.kamion_id -> kamion", count: 0, note: String(err) })
    }

    // 2) Common schema: kamion.zaduzeni_vozac_id OR kamion.vozac_id fields
    try {
      const [rows] = await pool.execute<KamionRow[]>(
          `SELECT k.*, k.zaduzeni_vozac_id as vozac_id
         FROM kamion k
         WHERE k.aktivan = TRUE AND k.zaduzeni_vozac_id = ?
         ORDER BY k.datum_kreiranja DESC`,
          [userId],
      )
      debug.push({ step: "kamion.zaduzeni_vozac_id OR kamion.vozac_id", count: Array.isArray(rows) ? rows.length : 0 })
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows, debug: debugMode ? debug : undefined })
      }
    } catch (err) {
      console.warn("[vozni-park] attempt 2 failed:", err)
      debug.push({ step: "kamion.zaduzeni_vozac_id OR kamion.vozac_id", count: 0, note: String(err) })
    }

    // 3) mapping table vozac_kamion (common name)
    try {
      const [rows] = await pool.execute<KamionRow[]>(
          `SELECT k.*, k.zaduzeni_vozac_id as vozac_id 
         FROM kamion k
         JOIN vozac_kamion vk ON vk.kamion_id = k.id
         WHERE vk.vozac_id = ? AND k.aktivan = TRUE
         ORDER BY k.datum_kreiranja DESC`,
          [userId],
      )
      debug.push({ step: "mapping vozac_kamion", count: Array.isArray(rows) ? rows.length : 0 })
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows, debug: debugMode ? debug : undefined })
      }
    } catch (err) {
      console.warn("[vozni-park] attempt 3 failed:", err)
      debug.push({ step: "mapping vozac_kamion", count: 0, note: String(err) })
    }

    // 4) mapping table kamion_vozac (alternate name)
    try {
      const [rows] = await pool.execute<KamionRow[]>(
          `SELECT k.*, k.zaduzeni_vozac_id as vozac_id 
         FROM kamion k
         JOIN kamion_vozac kv ON kv.kamion_id = k.id
         WHERE kv.vozac_id = ? AND k.aktivan = TRUE
         ORDER BY k.datum_kreiranja DESC`,
          [userId],
      )
      debug.push({ step: "mapping kamion_vozac", count: Array.isArray(rows) ? rows.length : 0 })
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ success: true, data: rows, debug: debugMode ? debug : undefined })
      }
    } catch (err) {
      console.warn("[vozni-park] attempt 4 failed:", err)
      debug.push({ step: "mapping kamion_vozac", count: 0, note: String(err) })
    }

    // 5) no matches: return empty array but include debug when requested
    debug.push({ step: "no-matches-found", count: 0 })
    return NextResponse.json({
      success: true,
      data: [],
      debug: debugMode ? debug : undefined,
      message: "Nema pridruženih kamiona za ovog vozača (provjerite debug polje).",
    })
  } catch (error) {
    console.error("[vozni-park] Greška pri dohvatanju kamiona:", error)
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

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))

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

    if (!registarska_tablica || !marka || !model) {
      return NextResponse.json(
        { success: false, message: "Registarska tablica, marka i model su obavezni" },
        { status: 400 },
      )
    }

    const [existing] = await pool.execute<KamionRow[]>("SELECT id FROM kamion WHERE registarska_tablica = ?", [
      registarska_tablica,
    ])

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Registarska tablica već postoji" }, { status: 400 })
    }

    const normalizedVozacId = vozac_id && Number(vozac_id) !== 0 ? Number(vozac_id) : null

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
    console.error("[vozni-park] Greška pri kreiranju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
