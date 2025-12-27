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
}

// GET /api/oprema/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const [oprema] = await pool.execute<OpremaRow[]>(
      `SELECT o.*, k.registarska_tablica as kamion_tablica 
       FROM oprema o 
       LEFT JOIN kamion k ON o.kamion_id = k.id 
       WHERE o.id = ?`,
      [id],
    )

    if (oprema.length === 0) {
      return NextResponse.json({ success: false, message: "Oprema nije pronađena" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: oprema[0] })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju opreme:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// PUT /api/oprema/[id]
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
    const { naziv, vrsta, kamion_id, kapacitet, stanje, datum_nabavke, datum_zadnje_provjere, napomena } = body

    await pool.execute<ResultSetHeader>(
      `UPDATE oprema SET naziv = ?, vrsta = ?, kamion_id = ?, kapacitet = ?, stanje = ?, 
       datum_nabavke = ?, datum_zadnje_provjere = ?, napomena = ? WHERE id = ?`,
      [
        naziv,
        vrsta || null,
        kamion_id || null,
        kapacitet || null,
        stanje || null,
        datum_nabavke || null,
        datum_zadnje_provjere || null,
        napomena || null,
        id,
      ],
    )

    return NextResponse.json({ success: true, message: "Oprema uspješno ažurirana" })
  } catch (error) {
    console.error("[v0] Greška pri ažuriranju opreme:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// DELETE /api/oprema/[id]
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

    await pool.execute<ResultSetHeader>("UPDATE oprema SET aktivan = FALSE WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Oprema uspješno obrisana" })
  } catch (error) {
    console.error("[v0] Greška pri brisanju opreme:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
