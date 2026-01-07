import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { RowDataPacket, ResultSetHeader } from "mysql2"

interface TuraRow extends RowDataPacket {
  id: number
  broj_ture: string
  vozac_id: number
  vozac_ime: string | null
  vozac_prezime: string | null
  kamion_id: number
  kamion_tablica: string | null
  kamion_model: string | null
  narudzba_id: number
  narudzba_broj: string | null
  klijent_naziv: string | null
  datum_pocetka: Date
  datum_kraja: Date | null
  status: string
  napomena: string | null
}

interface VozacKamionRow extends RowDataPacket {
  kamion_id: number | null
}

interface KamionIdRow extends RowDataPacket {
  id: number
}

async function getVozacKamionIds(vozacId: number): Promise<number[]> {
  const kamionIds = new Set<number>()

  const [primaryRows] = await pool.execute<VozacKamionRow[]>(
    "SELECT kamion_id FROM vozac WHERE id = ? AND kamion_id IS NOT NULL",
    [vozacId],
  )
  for (const row of primaryRows) {
    if (row.kamion_id) kamionIds.add(row.kamion_id)
  }

  const [assignedRows] = await pool.execute<KamionIdRow[]>(
    "SELECT id FROM kamion WHERE aktivan = TRUE AND zaduzeni_vozac_id = ?",
    [vozacId],
  )
  for (const row of assignedRows) {
    if (row.id) kamionIds.add(row.id)
  }

  try {
    const [mappingRows] = await pool.execute<KamionIdRow[]>(
      "SELECT kamion_id as id FROM vozac_kamion WHERE vozac_id = ?",
      [vozacId],
    )
    for (const row of mappingRows) {
      if (row.id) kamionIds.add(row.id)
    }
  } catch {
    // mapping table may not exist
  }

  try {
    const [mappingRows] = await pool.execute<KamionIdRow[]>(
      "SELECT kamion_id as id FROM kamion_vozac WHERE vozac_id = ?",
      [vozacId],
    )
    for (const row of mappingRows) {
      if (row.id) kamionIds.add(row.id)
    }
  } catch {
    // mapping table may not exist
  }

  return Array.from(kamionIds)
}

// GET - Dobavi sve ture
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")

    let sql = `
      SELECT 
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
    `

    const params: Array<string | number> = []
    const conditions: string[] = ["t.aktivan = TRUE"]

    if (user.role === "vozac") {
      conditions.push("t.vozac_id = ?")
      params.push(user.id)
    }

    if (status) {
      conditions.push("t.status = ?")
      params.push(status)
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    sql += " ORDER BY t.datum_pocetka DESC"

    const [ture] = await pool.execute<TuraRow[]>(sql, params)
    return NextResponse.json({ success: true, data: ture })
  } catch (error) {
    console.error("Greška pri dohvaćanju tura:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novu turu
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ success: false, message: "Neautorizovano" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "vozac") {
      return NextResponse.json({ success: false, message: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const {
      broj_ture,
      vozac_id: vozacIdFromBody,
      kamion_id,
      narudzba_id,
      datum_pocetka,
      datum_kraja,
      status,
      napomena,
    } = data

    const vozac_id = user.role === "vozac" ? user.id : vozacIdFromBody

    if (!broj_ture || !vozac_id || !kamion_id || !narudzba_id || !datum_pocetka) {
      return NextResponse.json({ success: false, message: "Sva obavezna polja moraju biti popunjena" }, { status: 400 })
    }

    if (user.role === "vozac") {
      const vozacKamioni = await getVozacKamionIds(user.id)
      if (vozacKamioni.length === 0) {
        return NextResponse.json({ success: false, message: "Nema dodijeljenog kamiona" }, { status: 400 })
      }

      const requestedKamionId = Number(kamion_id)
      if (!vozacKamioni.includes(requestedKamionId)) {
        return NextResponse.json({ success: false, message: "Kamion nije dodijeljen vozaču" }, { status: 403 })
      }
    }

    const [existing] = await pool.execute<RowDataPacket[]>("SELECT id FROM tura WHERE broj_ture = ?", [broj_ture])
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Broj ture već postoji" }, { status: 400 })
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO tura (broj_ture, vozac_id, kamion_id, narudzba_id, datum_pocetka, datum_kraja, status, napomena)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        broj_ture,
        vozac_id,
        kamion_id,
        narudzba_id,
        datum_pocetka,
        datum_kraja || null,
        status || "U toku",
        napomena || null,
      ],
    )

    return NextResponse.json(
      {
        success: true,
        message: "Tura uspješno kreirana",
        id: result.insertId,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju ture:", error)
    return NextResponse.json({ success: false, message: "Greška servera" }, { status: 500 })
  }
}
