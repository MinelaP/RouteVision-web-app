import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

// GET - Dobavi sve ture
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    let sql = `
      SELECT 
        t.*,
        v.ime as vozac_ime,
        v.prezime as vozac_prezime,
        k.registracija as kamion_registracija,
        k.model as kamion_model,
        n.naziv as narudzba_naziv,
        kl.naziv as klijent_naziv
      FROM tura t
      LEFT JOIN vozac v ON t.vozac_id = v.vozac_id
      LEFT JOIN kamion k ON t.kamion_id = k.kamion_id
      LEFT JOIN narudba n ON t.narudba_id = n.narudba_id
      LEFT JOIN klijent kl ON n.klijent_id = kl.klijent_id
    `

    const params: any[] = []

    // Ako je vozač, prikaži samo njegove ture
    if (user.rola === "vozac") {
      sql += " WHERE t.vozac_id = ?"
      params.push(user.id)
    }

    // Filter po statusu
    if (status) {
      sql += user.rola === "vozac" ? " AND t.status = ?" : " WHERE t.status = ?"
      params.push(status)
    }

    sql += " ORDER BY t.datum_pocetka DESC"

    const ture = await query(sql, params)
    return NextResponse.json(ture)
  } catch (error) {
    console.error("Greška pri dohvaćanju tura:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novu turu
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    // Samo admin može kreirati ture
    if (user.rola !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { vozac_id, kamion_id, narudba_id, datum_pocetka, datum_zavrsetka, status, napomena } = data

    // Validacija
    if (!vozac_id || !kamion_id || !narudba_id || !datum_pocetka) {
      return NextResponse.json({ error: "Sva obavezna polja moraju biti popunjena" }, { status: 400 })
    }

    // Provjeri da li vozač, kamion i narudžba postoje
    const vozacExists = await query("SELECT vozac_id FROM vozac WHERE vozac_id = ?", [vozac_id])
    const kamionExists = await query("SELECT kamion_id FROM kamion WHERE kamion_id = ?", [kamion_id])
    const narudzbaExists = await query("SELECT narudba_id FROM narudba WHERE narudba_id = ?", [narudba_id])

    if (vozacExists.length === 0) {
      return NextResponse.json({ error: "Vozač ne postoji" }, { status: 400 })
    }
    if (kamionExists.length === 0) {
      return NextResponse.json({ error: "Kamion ne postoji" }, { status: 400 })
    }
    if (narudzbaExists.length === 0) {
      return NextResponse.json({ error: "Narudžba ne postoji" }, { status: 400 })
    }

    const result = await query(
      `INSERT INTO tura (vozac_id, kamion_id, narudba_id, datum_pocetka, datum_zavrsetka, status, napomena)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vozac_id, kamion_id, narudba_id, datum_pocetka, datum_zavrsetka || null, status || "U toku", napomena || null],
    )

    return NextResponse.json(
      {
        message: "Tura uspješno kreirana",
        tura_id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju ture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
