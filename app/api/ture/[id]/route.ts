import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// GET - Dobavi jednu turu po ID-u
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const tura = await query(
      `SELECT 
        t.*,
        v.ime as vozac_ime,
        v.prezime as vozac_prezime,
        k.registracija as kamion_registracija,
        k.model as kamion_model,
        n.naziv as narudzba_naziv,
        n.opis as narudzba_opis,
        kl.naziv as klijent_naziv
      FROM tura t
      LEFT JOIN vozac v ON t.vozac_id = v.vozac_id
      LEFT JOIN kamion k ON t.kamion_id = k.kamion_id
      LEFT JOIN narudba n ON t.narudba_id = n.narudba_id
      LEFT JOIN klijent kl ON n.klijent_id = kl.klijent_id
      WHERE t.tura_id = ?`,
      [params.id],
    )

    if (tura.length === 0) {
      return NextResponse.json({ error: "Tura nije pronađena" }, { status: 404 })
    }

    // Ako je vozač, može vidjeti samo svoje ture
    if (user.rola === "vozac" && tura[0].vozac_id !== user.id) {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    return NextResponse.json(tura[0])
  } catch (error) {
    console.error("Greška pri dohvaćanju ture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// PUT - Ažuriraj turu
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const data = await request.json()

    // Provjeri da li tura postoji
    const existingTura = await query("SELECT * FROM tura WHERE tura_id = ?", [params.id])
    if (existingTura.length === 0) {
      return NextResponse.json({ error: "Tura nije pronađena" }, { status: 404 })
    }

    // Vozač može ažurirati samo status i napomenu svojih tura
    if (user.rola === "vozac") {
      if (existingTura[0].vozac_id !== user.id) {
        return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
      }

      // Vozač može ažurirati samo status i napomenu
      const { status, napomena } = data
      await query("UPDATE tura SET status = ?, napomena = ? WHERE tura_id = ?", [
        status || existingTura[0].status,
        napomena !== undefined ? napomena : existingTura[0].napomena,
        params.id,
      ])

      return NextResponse.json({ message: "Tura uspješno ažurirana" })
    }

    // Admin može ažurirati sve
    const { vozac_id, kamion_id, narudba_id, datum_pocetka, datum_zavrsetka, status, napomena } = data

    await query(
      `UPDATE tura 
       SET vozac_id = ?, kamion_id = ?, narudba_id = ?, datum_pocetka = ?, 
           datum_zavrsetka = ?, status = ?, napomena = ?
       WHERE tura_id = ?`,
      [
        vozac_id || existingTura[0].vozac_id,
        kamion_id || existingTura[0].kamion_id,
        narudba_id || existingTura[0].narudba_id,
        datum_pocetka || existingTura[0].datum_pocetka,
        datum_zavrsetka !== undefined ? datum_zavrsetka : existingTura[0].datum_zavrsetka,
        status || existingTura[0].status,
        napomena !== undefined ? napomena : existingTura[0].napomena,
        params.id,
      ],
    )

    return NextResponse.json({ message: "Tura uspješno ažurirana" })
  } catch (error) {
    console.error("Greška pri ažuriranju ture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši turu
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.rola !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const result = await query("DELETE FROM tura WHERE tura_id = ?", [params.id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "Tura nije pronađena" }, { status: 404 })
    }

    return NextResponse.json({ message: "Tura uspješno obrisana" })
  } catch (error) {
    console.error("Greška pri brisanju ture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
