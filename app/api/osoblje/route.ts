import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { hashPassword, validatePassword } from "@/lib/auth"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

// Interfejs za admin i vozac podatke
interface AdminRow extends RowDataPacket {
  id: number
  ime: string
  prezime: string
  email: string
  broj_telefona: string | null
  datum_kreiranja: Date
  aktivan: boolean
}

interface VozacRow extends RowDataPacket {
  id: number
  ime: string
  prezime: string
  email: string
  broj_telefona: string | null
  broj_vozacke_dozvole: string | null
  kategorija_dozvole: string | null
  datum_zaposlenja: Date | null
  plata: number | null
  broj_dovrsenih_tura: number
  aktivan: boolean
  datum_kreiranja: Date
}

// GET /api/osoblje - Dohvatanje svih članova osoblja
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    // Samo admin može pristupiti listi osoblja
    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tip = searchParams.get("tip") // 'admin' ili 'vozac'

    if (tip === "admin") {
      const [admini] = await pool.execute<AdminRow[]>(
        "SELECT id, ime, prezime, email, broj_telefona, datum_kreiranja, aktivan FROM admin ORDER BY datum_kreiranja DESC",
      )
      return NextResponse.json({ success: true, data: admini })
    } else if (tip === "vozac") {
      const [vozaci] = await pool.execute<VozacRow[]>(
        `SELECT id, ime, prezime, email, broj_telefona, broj_vozacke_dozvole, kategorija_dozvole,
         datum_zaposlenja, plata, broj_dovrsenih_tura, aktivan, datum_kreiranja 
         FROM vozac ORDER BY datum_kreiranja DESC`,
      )
      return NextResponse.json({ success: true, data: vozaci })
    } else {
      // Dohvati sve
      const [admini] = await pool.execute<AdminRow[]>(
        "SELECT id, ime, prezime, email, broj_telefona, datum_kreiranja, aktivan, 'admin' as tip FROM admin",
      )
      const [vozaci] = await pool.execute<VozacRow[]>(
        `SELECT id, ime, prezime, email, broj_telefona, datum_zaposlenja, aktivan, 'vozac' as tip, broj_dovrsenih_tura 
         FROM vozac`,
      )

      return NextResponse.json({
        success: true,
        data: {
          admini,
          vozaci,
        },
      })
    }
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju osoblja:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// POST /api/osoblje - Kreiranje novog člana osoblja
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
    const { tip, ime, prezime, email, lozinka, broj_telefona, ...ostalo } = body

    // Validacija osnovnih podataka
    if (!tip || !ime || !prezime || !email || !lozinka) {
      return NextResponse.json({ success: false, message: "Sva obavezna polja moraju biti popunjena" }, { status: 400 })
    }

    // Validacija lozinke
    const passwordValidation = validatePassword(lozinka)
    if (!passwordValidation.valid) {
      return NextResponse.json({ success: false, message: passwordValidation.message }, { status: 400 })
    }

    // Hash lozinke
    const hashedPassword = await hashPassword(lozinka)

    if (tip === "admin") {
      // Provjera da li email već postoji
      const [existing] = await pool.execute<AdminRow[]>("SELECT id FROM admin WHERE email = ?", [email])

      if (existing.length > 0) {
        return NextResponse.json({ success: false, message: "Email adresa već postoji" }, { status: 400 })
      }

      // Kreiranje novog admina
      const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO admin (ime, prezime, email, lozinka, broj_telefona) VALUES (?, ?, ?, ?, ?)",
        [ime, prezime, email, hashedPassword, broj_telefona || null],
      )

      return NextResponse.json({
        success: true,
        message: "Administrator uspješno kreiran",
        id: result.insertId,
      })
    } else if (tip === "vozac") {
      // Provjera da li email već postoji
      const [existing] = await pool.execute<VozacRow[]>("SELECT id FROM vozac WHERE email = ?", [email])

      if (existing.length > 0) {
        return NextResponse.json({ success: false, message: "Email adresa već postoji" }, { status: 400 })
      }

      // Kreiranje novog vozača
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO vozac (ime, prezime, email, lozinka, broj_telefona, broj_vozacke_dozvole, 
         kategorija_dozvole, datum_zaposlenja, plata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ime,
          prezime,
          email,
          hashedPassword,
          broj_telefona || null,
          ostalo.broj_vozacke_dozvole || null,
          ostalo.kategorija_dozvole || null,
          ostalo.datum_zaposlenja || null,
          ostalo.plata || null,
        ],
      )

      return NextResponse.json({
        success: true,
        message: "Vozač uspješno kreiran",
        id: result.insertId,
      })
    } else {
      return NextResponse.json({ success: false, message: "Nevalidan tip osoblja" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Greška pri kreiranju osoblja:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
