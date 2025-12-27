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
        f.*,
        t.tura_id,
        n.naziv as narudzba_naziv,
        k.naziv as klijent_naziv
      FROM fakture f
      LEFT JOIN tura t ON f.tura_id = t.tura_id
      LEFT JOIN narudba n ON t.narudba_id = n.narudba_id
      LEFT JOIN klijent k ON n.klijent_id = k.klijent_id
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
    if (!user || user.rola !== "admin") {
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

    // Spremi u bazu
    const result = await query(
      `INSERT INTO fakture (tura_id, broj_fakture, datum_izdavanja, iznos, putanja_dokumenta)
       VALUES (?, ?, ?, ?, ?)`,
      [tura_id, broj_fakture, datum_izdavanja, Number.parseFloat(iznos), putanja_dokumenta],
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
