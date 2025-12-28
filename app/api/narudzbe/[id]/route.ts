import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { cookies } from "next/headers"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface NarudbaRow extends RowDataPacket {
  id: number
  broj_narudzbe: string
  klijent_id: number
  datum_narudzbe: Date
  datum_isporuke: Date
  vrsta_robe: string
  kolicina: number
  jedinica_mjere: string
  lokacija_preuzimanja: string
  lokacija_dostave: string
  napomena: string
  status: string
  aktivan: boolean
}

// GET /api/narudzbe/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const [narudzbe] = await pool.execute<NarudbaRow[]>(
      `SELECT n.*, k.naziv_firme as klijent_naziv 
       FROM narudzba n 
       LEFT JOIN klijent k ON n.klijent_id = k.id 
       WHERE n.id = ?`,
      [id],
    )

    if (narudzbe.length === 0) {
      return NextResponse.json({ success: false, message: "Narudžba nije pronađena" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: narudzbe[0] })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju narudžbe:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// PUT /api/narudzbe/[id]
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
      broj_narudzbe,
      klijent_id,
      datum_narudzbe,
      datum_isporuke,
      vrsta_robe,
      kolicina,
      jedinica_mjere,
      lokacija_preuzimanja,
      lokacija_dostave,
      napomena,
      status,
    } = body

    await pool.execute<ResultSetHeader>(
      `UPDATE narudzba SET broj_narudzbe = ?, klijent_id = ?, datum_narudzbe = ?, datum_isporuke = ?, 
       vrsta_robe = ?, kolicina = ?, jedinica_mjere = ?, lokacija_preuzimanja = ?, lokacija_dostave = ?, 
       napomena = ?, status = ? WHERE id = ?`,
      [
        broj_narudzbe,
        klijent_id,
        datum_narudzbe || null,
        datum_isporuke || null,
        vrsta_robe || null,
        kolicina || null,
        jedinica_mjere || null,
        lokacija_preuzimanja || null,
        lokacija_dostave || null,
        napomena || null,
        status || "Novoprijavljena",
        id,
      ],
    )

    return NextResponse.json({ success: true, message: "Narudžba uspješno ažurirana" })
  } catch (error) {
    console.error("[v0] Greška pri ažuriranju narudžbe:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// DELETE /api/narudzbe/[id]
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

    await pool.execute<ResultSetHeader>("UPDATE narudzba SET aktivan = FALSE WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Narudžba uspješno obrisana" })
  } catch (error) {
    console.error("[v0] Greška pri brisanju narudžbe:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
