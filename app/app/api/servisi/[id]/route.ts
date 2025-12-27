import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// PUT - Ažuriraj servis
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const data = await request.json()
    const { datum, opis, troskovi } = data

    const result = await query(`UPDATE servis SET datum = ?, opis = ?, troskovi = ? WHERE servis_id = ?`, [
      datum,
      opis,
      Number.parseFloat(troskovi),
      params.id,
    ])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Servis nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ message: "Servis uspješno ažuriran" })
  } catch (error) {
    console.error("Greška pri ažuriranju servisa:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši servis
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.rola !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const result = await query("DELETE FROM servis WHERE servis_id = ?", [params.id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Servis nije pronađen" }, { status: 404 })
    }

    return NextResponse.json({ message: "Servis uspješno obrisan" })
  } catch (error) {
    console.error("Greška pri brisanju servisa:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
