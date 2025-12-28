import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { ResultSetHeader } from "mysql2"

interface KlijentImport {
  naziv_firme: string
  tip_klijenta?: string
  adresa?: string
  mjesto?: string
  postanskiBroj?: string
  drzava?: string
  kontakt_osoba?: string
  email?: string
  broj_telefona?: string
  broj_faksa?: string
  poreska_broj?: string
  naziv_banke?: string
  racun_broj?: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
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

    for (const klijent of klijenti as KlijentImport[]) {
      try {
        if (!klijent.naziv_firme) {
          errors++
          continue
        }

        await pool.execute<ResultSetHeader>(
          `INSERT INTO klijent (naziv_firme, tip_klijenta, adresa, mjesto, postanskiBroj, drzava,
           kontakt_osoba, email, broj_telefona, broj_faksa, poreska_broj, naziv_banke, racun_broj)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            klijent.naziv_firme,
            klijent.tip_klijenta || null,
            klijent.adresa || null,
            klijent.mjesto || null,
            klijent.postanskiBroj || null,
            klijent.drzava || null,
            klijent.kontakt_osoba || null,
            klijent.email || null,
            klijent.broj_telefona || null,
            klijent.broj_faksa || null,
            klijent.poreska_broj || null,
            klijent.naziv_banke || null,
            klijent.racun_broj || null,
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
