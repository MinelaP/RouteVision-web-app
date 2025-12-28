import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface TuraRow extends RowDataPacket {
  id: number
  broj_ture: string
  vozac_id: number
  kamion_id: number
  narudzba_id: number
  datum_pocetka: Date
  datum_kraja: Date | null
  status: string
  napomena: string | null
}

// GET - Dobavi jednu turu po ID-u
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    const [ture] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        t.id,
        t.broj_ture,
        t.vozac_id,
        t.kamion_id,
        t.narudzba_id,
        t.datum_pocetka,
        t.datum_kraja,
        t.status,
        t.napomena,
        v.ime as vozac_ime,
        v.prezime as vozac_prezime,
        k.registarska_tablica as kamion_tablica,
        k.model as kamion_model,
        n.broj_narudzbe as narudzba_broj,
        kl.naziv_firme as klijent_naziv
      FROM tura t
      LEFT JOIN vozac v ON t.vozac_id = v.id
      LEFT JOIN kamion k ON t.kamion_id = k.id
      LEFT JOIN narudzba n ON t.narudzba_id = n.id
      LEFT JOIN klijent kl ON n.klijent_id = kl.id
      WHERE t.id = ?`,
      [params.id],
    )

    if (ture.length === 0) {
      return NextResponse.json({ success: false, message: "Tura nije pronađena" }, { status: 404 })
    }

    if (user.role === "vozac" && ture[0].vozac_id !== user.id) {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: ture[0] })
  } catch (error) {
    console.error("Greška pri dohvaćanju ture:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// PUT - Ažuriraj turu
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    const data = await request.json()

    const [existingTure] = await pool.execute<TuraRow[]>("SELECT * FROM tura WHERE id = ?", [params.id])
    if (existingTure.length === 0) {
      return NextResponse.json({ success: false, message: "Tura nije pronađena" }, { status: 404 })
    }

    const existingTura = existingTure[0]

    if (user.role === "vozac") {
      if (existingTura.vozac_id !== user.id) {
        return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
      }

      const { status, napomena } = data
      await pool.execute<ResultSetHeader>("UPDATE tura SET status = ?, napomena = ? WHERE id = ?", [
        status || existingTura.status,
        napomena !== undefined ? napomena : existingTura.napomena,
        params.id,
      ])

      return NextResponse.json({ success: true, message: "Tura uspješno ažurirana" })
    }

    const { broj_ture, vozac_id, kamion_id, narudzba_id, datum_pocetka, datum_kraja, status, napomena } = data

    await pool.execute<ResultSetHeader>(
      `UPDATE tura 
       SET broj_ture = ?, vozac_id = ?, kamion_id = ?, narudzba_id = ?, datum_pocetka = ?, 
           datum_kraja = ?, status = ?, napomena = ?
       WHERE id = ?`,
      [
        broj_ture || existingTura.broj_ture,
        vozac_id || existingTura.vozac_id,
        kamion_id || existingTura.kamion_id,
        narudzba_id || existingTura.narudzba_id,
        datum_pocetka || existingTura.datum_pocetka,
        datum_kraja !== undefined ? datum_kraja : existingTura.datum_kraja,
        status || existingTura.status,
        napomena !== undefined ? napomena : existingTura.napomena,
        params.id,
      ],
    )

    return NextResponse.json({ success: true, message: "Tura uspješno ažurirana" })
  } catch (error) {
    console.error("Greška pri ažuriranju ture:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši turu
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const [result] = await pool.execute<ResultSetHeader>("UPDATE tura SET aktivan = FALSE WHERE id = ?", [params.id])

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Tura nije pronađena" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Tura uspješno obrisana" })
  } catch (error) {
    console.error("Greška pri brisanju ture:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}
