import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { ResultSetHeader } from "mysql2"

// PUT - Ažuriraj servis
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    if (user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { datum_servisa, vrsta_servisa, opis_servisa, troskovi } = data
    const parsedTroskovi = Number.parseFloat(troskovi)

    if (Number.isNaN(parsedTroskovi)) {
      return NextResponse.json({ success: false, message: "Troškovi moraju biti broj" }, { status: 400 })
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE servisni_dnevnik SET datum_servisa = ?, vrsta_servisa = ?, opisServisa = ?, troskovi = ? WHERE id = ?`,
      [datum_servisa, vrsta_servisa || null, opis_servisa || null, parsedTroskovi, params.id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Servis nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Servis uspješno ažuriran" })
  } catch (error) {
    console.error("Greška pri ažuriranju servisa:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši servis
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const [result] = await pool.execute<ResultSetHeader>("UPDATE servisni_dnevnik SET aktivan = FALSE WHERE id = ?", [
      params.id,
    ])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Servis nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Servis uspješno obrisan" })
  } catch (error) {
    console.error("Greška pri brisanju servisa:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}
