import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// PUT - Ažuriraj gorivo
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const data = await request.json()
    const { datum, litara, cijena_po_litri, ukupno } = data

    const result = await query(
      `UPDATE gorivo SET datum = ?, litara = ?, cijena_po_litri = ?, ukupno = ? WHERE gorivo_id = ?`,
      [datum, Number.parseFloat(litara), Number.parseFloat(cijena_po_litri), Number.parseFloat(ukupno), params.id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Gorivo nije pronađeno" }, { status: 404 })
    }

    return NextResponse.json({ message: "Gorivo uspješno ažurirano" })
  } catch (error) {
    console.error("Greška pri ažuriranju goriva:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši gorivo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.rola !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const result = await query("DELETE FROM gorivo WHERE gorivo_id = ?", [params.id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Gorivo nije pronađeno" }, { status: 404 })
    }

    return NextResponse.json({ message: "Gorivo uspješno obrisano" })
  } catch (error) {
    console.error("Greška pri brisanju goriva:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
