import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { writeFile, unlink, mkdir } from "fs/promises"
import path from "path"

// PUT - Ažuriraj fakturu
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const formData = await request.formData()
    const broj_fakture = formData.get("broj_fakture") as string
    const datum_izdavanja = formData.get("datum_izdavanja") as string
    const iznos = formData.get("iznos") as string
    const fajl = formData.get("fajl") as File | null

    // Dobavi postojeću fakturu
    const existingFaktura = await query("SELECT * FROM fakture WHERE faktura_id = ?", [params.id])
    if (existingFaktura.length === 0) {
      return NextResponse.json({ error: "Faktura nije pronađena" }, { status: 404 })
    }

    let putanja_dokumenta = existingFaktura[0].putanja_dokumenta

    // Ako je priložen novi fajl
    if (fajl) {
      // Obriši stari fajl ako postoji
      if (existingFaktura[0].putanja_dokumenta) {
        const oldFilePath = path.join(process.cwd(), "public", existingFaktura[0].putanja_dokumenta)
        try {
          await unlink(oldFilePath)
        } catch (error) {
          console.error("Greška pri brisanju starog fajla:", error)
        }
      }

      // Sačuvaj novi fajl
      const bytes = await fajl.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const uploadDir = path.join(process.cwd(), "public", "uploads", "fakture")
      await mkdir(uploadDir, { recursive: true })

      const timestamp = Date.now()
      const fileExtension = fajl.name.split(".").pop()
      const fileName = `faktura_${timestamp}.${fileExtension}`
      const filePath = path.join(uploadDir, fileName)

      await writeFile(filePath, buffer)
      putanja_dokumenta = `/uploads/fakture/${fileName}`
    }

    // Ažuriraj bazu
    await query(
      `UPDATE fakture 
       SET broj_fakture = ?, datum_izdavanja = ?, iznos = ?, putanja_dokumenta = ?
       WHERE faktura_id = ?`,
      [broj_fakture, datum_izdavanja, Number.parseFloat(iznos), putanja_dokumenta, params.id],
    )

    return NextResponse.json({ message: "Faktura uspješno ažurirana", putanja_dokumenta })
  } catch (error) {
    console.error("Greška pri ažuriranju fakture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}

// DELETE - Obriši fakturu
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    // Dobavi fakturu prije brisanja
    const faktura = await query("SELECT * FROM fakture WHERE faktura_id = ?", [params.id])
    if (faktura.length === 0) {
      return NextResponse.json({ error: "Faktura nije pronađena" }, { status: 404 })
    }

    // Obriši fajl ako postoji
    if (faktura[0].putanja_dokumenta) {
      const filePath = path.join(process.cwd(), "public", faktura[0].putanja_dokumenta)
      try {
        await unlink(filePath)
      } catch (error) {
        console.error("Greška pri brisanju fajla:", error)
      }
    }

    // Obriši iz baze
    await query("DELETE FROM fakture WHERE faktura_id = ?", [params.id])

    return NextResponse.json({ message: "Faktura uspješno obrisana" })
  } catch (error) {
    console.error("Greška pri brisanju fakture:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
