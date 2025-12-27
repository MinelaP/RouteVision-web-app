import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { hashPassword, validatePassword } from "@/lib/auth"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

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
  stanje_racuna: number
  aktivan: boolean
  datum_kreiranja: Date
}

// GET /api/osoblje/[id] - Dohvatanje pojedinačnog člana osoblja
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { searchParams } = new URL(request.url)
    const tip = searchParams.get("tip")

    if (tip === "admin") {
      const [admini] = await pool.execute<AdminRow[]>(
        "SELECT id, ime, prezime, email, broj_telefona, datum_kreiranja, aktivan FROM admin WHERE id = ?",
        [id],
      )

      if (admini.length === 0) {
        return NextResponse.json({ success: false, message: "Administrator nije pronađen" }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: admini[0] })
    } else if (tip === "vozac") {
      const [vozaci] = await pool.execute<VozacRow[]>(
        `SELECT id, ime, prezime, email, broj_telefona, broj_vozacke_dozvole, kategorija_dozvole,
         datum_zaposlenja, plata, broj_dovrsenih_tura, stanje_racuna, aktivan, datum_kreiranja 
         FROM vozac WHERE id = ?`,
        [id],
      )

      if (vozaci.length === 0) {
        return NextResponse.json({ success: false, message: "Vozač nije pronađen" }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: vozaci[0] })
    } else {
      return NextResponse.json({ success: false, message: "Tip osoblja mora biti specificiran" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju osoblja:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// PUT /api/osoblje/[id] - Ažuriranje člana osoblja
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
    const { tip, ime, prezime, email, lozinka, broj_telefona, ...ostalo } = body

    if (!tip) {
      return NextResponse.json({ success: false, message: "Tip osoblja mora biti specificiran" }, { status: 400 })
    }

    if (tip === "admin") {
      let query = "UPDATE admin SET ime = ?, prezime = ?, email = ?, broj_telefona = ?"
      const queryParams: any[] = [ime, prezime, email, broj_telefona || null]

      // Ako je poslata nova lozinka
      if (lozinka) {
        const passwordValidation = validatePassword(lozinka)
        if (!passwordValidation.valid) {
          return NextResponse.json({ success: false, message: passwordValidation.message }, { status: 400 })
        }
        const hashedPassword = await hashPassword(lozinka)
        query += ", lozinka = ?"
        queryParams.push(hashedPassword)
      }

      query += " WHERE id = ?"
      queryParams.push(id)

      await pool.execute<ResultSetHeader>(query, queryParams)

      return NextResponse.json({ success: true, message: "Administrator uspješno ažuriran" })
    } else if (tip === "vozac") {
      let query =
        "UPDATE vozac SET ime = ?, prezime = ?, email = ?, broj_telefona = ?, broj_vozacke_dozvole = ?, kategorija_dozvole = ?, datum_zaposlenja = ?, plata = ?"
      const queryParams: any[] = [
        ime,
        prezime,
        email,
        broj_telefona || null,
        ostalo.broj_vozacke_dozvole || null,
        ostalo.kategorija_dozvole || null,
        ostalo.datum_zaposlenja || null,
        ostalo.plata || null,
      ]

      if (lozinka) {
        const passwordValidation = validatePassword(lozinka)
        if (!passwordValidation.valid) {
          return NextResponse.json({ success: false, message: passwordValidation.message }, { status: 400 })
        }
        const hashedPassword = await hashPassword(lozinka)
        query += ", lozinka = ?"
        queryParams.push(hashedPassword)
      }

      query += " WHERE id = ?"
      queryParams.push(id)

      await pool.execute<ResultSetHeader>(query, queryParams)

      return NextResponse.json({ success: true, message: "Vozač uspješno ažuriran" })
    } else {
      return NextResponse.json({ success: false, message: "Nevalidan tip osoblja" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Greška pri ažuriranju osoblja:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// DELETE /api/osoblje/[id] - Brisanje člana osoblja (soft delete)
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

    const { searchParams } = new URL(request.url)
    const tip = searchParams.get("tip")

    if (tip === "admin") {
      // Soft delete - postavljamo aktivan na FALSE
      await pool.execute<ResultSetHeader>("UPDATE admin SET aktivan = FALSE WHERE id = ?", [id])

      return NextResponse.json({ success: true, message: "Administrator uspješno obrisan" })
    } else if (tip === "vozac") {
      await pool.execute<ResultSetHeader>("UPDATE vozac SET aktivan = FALSE WHERE id = ?", [id])

      return NextResponse.json({ success: true, message: "Vozač uspješno obrisan" })
    } else {
      return NextResponse.json({ success: false, message: "Tip osoblja mora biti specificiran" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Greška pri brisanju osoblja:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
