import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface KlijentRow extends RowDataPacket {
  id: number
  naziv_firme: string
  tip_klijenta: string
  adresa: string
  mjesto: string
  postanskiBroj: string
  drzava: string
  kontakt_osoba: string
  email: string
  broj_telefona: string
  broj_faksa: string
  poreska_broj: string
  naziv_banke: string
  racun_broj: string
  ukupna_narudena_kolicina: number
  ukupno_placeno: number
  aktivan: boolean
  datum_kreiranja: Date
}

// GET /api/klijenti
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

    const [klijenti] = await pool.execute<KlijentRow[]>(`SELECT * FROM klijent ORDER BY datum_kreiranja DESC`)

    return NextResponse.json({ success: true, data: klijenti })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju klijenata:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// POST /api/klijenti
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
      naziv_firme,
      tip_klijenta,
      adresa,
      mjesto,
      postanskiBroj,
      drzava,
      kontakt_osoba,
      email,
      broj_telefona,
      broj_faksa,
      poreska_broj,
      naziv_banke,
      racun_broj,
    } = body

    // Validacija
    if (!naziv_firme) {
      return NextResponse.json({ success: false, message: "Naziv firme je obavezan" }, { status: 400 })
    }

    // Provjera da li naziv firme već postoji
    const [existing] = await pool.execute<KlijentRow[]>("SELECT id FROM klijent WHERE naziv_firme = ?", [naziv_firme])

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Klijent sa ovim nazivom već postoji" }, { status: 400 })
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO klijent (naziv_firme, tip_klijenta, adresa, mjesto, postanskiBroj, drzava, 
       kontakt_osoba, email, broj_telefona, broj_faksa, poreska_broj, naziv_banke, racun_broj) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        naziv_firme,
        tip_klijenta || null,
        adresa || null,
        mjesto || null,
        postanskiBroj || null,
        drzava || null,
        kontakt_osoba || null,
        email || null,
        broj_telefona || null,
        broj_faksa || null,
        poreska_broj || null,
        naziv_banke || null,
        racun_broj || null,
      ],
    )

    return NextResponse.json({
      success: true,
      message: "Klijent uspješno kreiran",
      id: result.insertId,
    })
  } catch (error) {
    console.error("[v0] Greška pri kreiranju klijenta:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
