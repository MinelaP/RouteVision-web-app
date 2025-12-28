import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// GET - Dobavi sve fakture
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user) {
      return NextResponse.json({ error: "Neautorizovano" }, { status: 401 })
    }

    const fakture = await query(
      `SELECT 
        f.id as faktura_id,
        f.broj_fakture,
        f.tura_id,
        f.klijent_id,
        f.datum_izdavanja,
        COALESCE(f.ukupan_iznos, f.iznos_usluge) as iznos,
        f.datoteka_path as putanja_dokumenta,
        t.id as tura_id,
        n.broj_narudzbe as narudzba_naziv,
        k.naziv_firme as klijent_naziv
      FROM fakture f
      LEFT JOIN tura t ON f.tura_id = t.id
      LEFT JOIN narudzba n ON t.narudzba_id = n.id
      LEFT JOIN klijent k ON f.klijent_id = k.id
      ORDER BY f.datum_izdavanja DESC`,
    )

    return NextResponse.json(fakture)
  } catch (error) {
    console.error("Greška pri dohvaćanju faktura:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// POST - Kreiraj novu fakturu sa dokumentom
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const formData = await request.formData()
    const tura_id = formData.get("tura_id") as string
    const broj_fakture = formData.get("broj_fakture") as string
    const datum_izdavanja = formData.get("datum_izdavanja") as string
    const iznos = formData.get("iznos") as string
    const fajl = formData.get("fajl") as File | null

    // Validacija
    if (!tura_id || !broj_fakture || !datum_izdavanja || !iznos) {
      return NextResponse.json(
        {
          error: "Sva obavezna polja moraju biti popunjena",
        },
        { status: 400 },
      )
    }

    let putanja_dokumenta = null

    // Ako je priložen fajl, sačuvaj ga
    if (fajl) {
      const bytes = await fajl.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Kreiraj direktorijum ako ne postoji
      const uploadDir = path.join(process.cwd(), "public", "uploads", "fakture")
      await mkdir(uploadDir, { recursive: true })

      // Generiši jedinstveno ime fajla
      const timestamp = Date.now()
      const fileExtension = fajl.name.split(".").pop()
      const fileName = `faktura_${timestamp}.${fileExtension}`
      const filePath = path.join(uploadDir, fileName)

      // Sačuvaj fajl
      await writeFile(filePath, buffer)

      // Sačuvaj relativnu putanju za bazu
      putanja_dokumenta = `/uploads/fakture/${fileName}`
    }

    const [ture] = await query(
      `SELECT n.klijent_id
       FROM tura t
       LEFT JOIN narudzba n ON t.narudzba_id = n.id
       WHERE t.id = ?`,
      [tura_id],
    )

    if (ture.length === 0) {
      return NextResponse.json({ error: "Tura nije pronađena" }, { status: 404 })
    }

    const klijent_id = ture[0].klijent_id

    const parsedIznos = Number.parseFloat(iznos)

    // Spremi u bazu
    const result = await query(
      `INSERT INTO fakture (tura_id, klijent_id, broj_fakture, datum_izdavanja, iznos_usluge, ukupan_iznos, datoteka_path)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tura_id, klijent_id, broj_fakture, datum_izdavanja, parsedIznos, parsedIznos, putanja_dokumenta],
    )

    return NextResponse.json(
      {
        message: "Faktura uspješno kreirana",
        faktura_id: result.insertId,
        putanja_dokumenta,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Greška pri kreiranju fakture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
