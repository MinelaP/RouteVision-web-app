import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.rola !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { klijenti } = data

    if (!Array.isArray(klijenti) || klijenti.length === 0) {
      return NextResponse.json(
        {
          error: "Nevažeći format podataka",
        },
        { status: 400 },
      )
    }

    let imported = 0
    let errors = 0

    for (const klijent of klijenti) {
      try {
        await query(
          `INSERT INTO klijent (naziv, email, telefon, adresa, postanski_broj, grad, 
           kontakt_osoba, napomena, bankovni_racun)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            klijent.naziv,
            klijent.email || null,
            klijent.telefon || null,
            klijent.adresa || null,
            klijent.postanski_broj || null,
            klijent.grad || null,
            klijent.kontakt_osoba || null,
            klijent.napomena || null,
            klijent.bankovni_racun || null,
          ],
        )
        imported++
      } catch (error) {
        console.error("Greška pri importu klijenta:", error)
        errors++
      }
    }

    return NextResponse.json({
      message: `Import završen: ${imported} uspješno, ${errors} grešaka`,
      imported,
      errors,
    })
  } catch (error) {
    console.error("Greška pri importu:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
