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
  aktivan: boolean
}

// GET /api/vozni-park/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))

    const [kamioni] = await pool.execute<KamionRow[]>(
      `SELECT k.*, k.zaduzeni_vozac_id as vozac_id, v.ime as vozac_ime, v.prezime as vozac_prezime 
       FROM kamion k 
       LEFT JOIN vozac v ON k.zaduzeni_vozac_id = v.id 
       WHERE k.id = ?`,
      [id],
    )

    if (kamioni.length === 0) {
      return NextResponse.json({ success: false, message: "Kamion nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: kamioni[0] })
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// PUT /api/vozni-park/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    const normalizedVozacId = vozac_id && Number(vozac_id) !== 0 ? Number(vozac_id) : null

    await pool.execute<ResultSetHeader>(
      `UPDATE kamion SET registarska_tablica = ?, marka = ?, model = ?, godina_proizvodnje = ?, 
       kapacitet_tone = ?, vrsta_voza = ?, stanje_kilometra = ?, datum_registracije = ?, 
       datum_zakljucnog_pregleda = ?, zaduzeni_vozac_id = ? WHERE id = ?`,
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
        id,
      ],
    )

    return NextResponse.json({ success: true, message: "Kamion uspješno ažuriran" })
  } catch (error) {
    console.error("[v0] Greška pri ažuriranju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}

// DELETE /api/vozni-park/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Neautorizovan pristup" }, { status: 401 })
    }

    const session = JSON.parse(decodeURIComponent(sessionCookie.value))

    if (session.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu za ovu akciju" }, { status: 403 })
    }

    await pool.execute<ResultSetHeader>("UPDATE kamion SET aktivan = FALSE WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Kamion uspješno obrisan" })
  } catch (error) {
    console.error("[v0] Greška pri brisanju kamiona:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
