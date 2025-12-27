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
}

// GET /api/klijenti/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const [klijenti] = await pool.execute<KlijentRow[]>("SELECT * FROM klijent WHERE id = ?", [id])

    if (klijenti.length === 0) {
      return NextResponse.json({ success: false, message: "Klijent nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: klijenti[0] })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju klijenta:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// PUT /api/klijenti/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    await pool.execute<ResultSetHeader>(
      `UPDATE klijent SET naziv_firme = ?, tip_klijenta = ?, adresa = ?, mjesto = ?, postanskiBroj = ?, 
       drzava = ?, kontakt_osoba = ?, email = ?, broj_telefona = ?, broj_faksa = ?, poreska_broj = ?, 
       naziv_banke = ?, racun_broj = ? WHERE id = ?`,
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
        id,
      ],
    )

    return NextResponse.json({ success: true, message: "Klijent uspješno ažuriran" })
  } catch (error) {
    console.error("[v0] Greška pri ažuriranju klijenta:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// DELETE /api/klijenti/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    await pool.execute<ResultSetHeader>("UPDATE klijent SET aktivan = FALSE WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Klijent uspješno obrisan" })
  } catch (error) {
    console.error("[v0] Greška pri brisanju klijenta:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
