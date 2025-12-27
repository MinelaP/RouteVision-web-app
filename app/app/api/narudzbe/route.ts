import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface NarudbaRow extends RowDataPacket {
  id: number
  broj_narudbe: string
  klijent_id: number
  klijent_naziv: string
  datum_narudbe: Date
  datum_isporuke: Date
  vrsta_robe: string
  kolicina: number
  jedinica_mjere: string
  lokacija_preuzimanja: string
  lokacija_dostave: string
  napomena: string
  status: string
  aktivan: boolean
  datum_kreiranja: Date
}

// GET /api/narudzbe
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

    const [narudzbe] = await pool.execute<NarudbaRow[]>(
      `SELECT n.*, k.naziv_firme as klijent_naziv 
       FROM narudba n 
       LEFT JOIN klijent k ON n.klijent_id = k.id 
       ORDER BY n.datum_kreiranja DESC`,
    )

    return NextResponse.json({ success: true, data: narudzbe })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju narudžbi:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// POST /api/narudzbe
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
      broj_narudbe,
      klijent_id,
      datum_narudbe,
      datum_isporuke,
      vrsta_robe,
      kolicina,
      jedinica_mjere,
      lokacija_preuzimanja,
      lokacija_dostave,
      napomena,
      status,
    } = body

    // Validacija
    if (!broj_narudbe || !klijent_id) {
      return NextResponse.json({ success: false, message: "Broj narudžbe i klijent su obavezni" }, { status: 400 })
    }

    // Provjera da li broj narudžbe već postoji
    const [existing] = await pool.execute<NarudbaRow[]>("SELECT id FROM narudba WHERE broj_narudbe = ?", [broj_narudbe])

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Broj narudžbe već postoji" }, { status: 400 })
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO narudba (broj_narudbe, klijent_id, datum_narudbe, datum_isporuke, vrsta_robe, 
       kolicina, jedinica_mjere, lokacija_preuzimanja, lokacija_dostave, napomena, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        broj_narudbe,
        klijent_id,
        datum_narudbe || null,
        datum_isporuke || null,
        vrsta_robe || null,
        kolicina || null,
        jedinica_mjere || null,
        lokacija_preuzimanja || null,
        lokacija_dostave || null,
        napomena || null,
        status || "Novoprijavljena",
      ],
    )

    return NextResponse.json({
      success: true,
      message: "Narudžba uspješno kreirana",
      id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Greška pri kreiranju narudžbe:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
