import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { normalizeDateInput } from "@/lib/date"
import type { ResultSetHeader } from "mysql2"

// PUT - Ažuriraj gorivo
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
    const { datum, litara, cijena_po_litri, ukupno } = data
    const normalizedDatum = normalizeDateInput(datum)
    const parsedLitara = Number.parseFloat(litara)
    const parsedCijena = Number.parseFloat(cijena_po_litri)
    const parsedUkupno = Number.parseFloat(ukupno)

    if (!normalizedDatum || Number.isNaN(parsedLitara) || Number.isNaN(parsedCijena) || Number.isNaN(parsedUkupno)) {
      return NextResponse.json(
        { success: false, message: "Unesite validan datum i brojčane vrijednosti" },
        { status: 400 },
      )
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE gorivo SET datum = ?, litara = ?, cijena_po_litri = ?, ukupno = ? WHERE id = ?`,
      [normalizedDatum, parsedLitara, parsedCijena, parsedUkupno, params.id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Gorivo nije pronađeno" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Gorivo uspješno ažurirano" })
  } catch (error) {
    console.error("Greška pri ažuriranju goriva:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši gorivo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const [result] = await pool.execute<ResultSetHeader>("UPDATE gorivo SET aktivan = FALSE WHERE id = ?", [params.id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Gorivo nije pronađeno" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Gorivo uspješno obrisano" })
  } catch (error) {
    console.error("Greška pri brisanju goriva:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}
