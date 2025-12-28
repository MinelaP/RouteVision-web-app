import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { ResultSetHeader } from "mysql2"

interface GorivoImport {
  kamion_id: number
  datum: string
  litara: number
  cijena_po_litri: number
  ukupno: number
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { gorivo } = data

    if (!Array.isArray(gorivo) || gorivo.length === 0) {
      return NextResponse.json({ error: "Nevažeći format podataka" }, { status: 400 })
    }

    let imported = 0
    let errors = 0

    for (const entry of gorivo as GorivoImport[]) {
      try {
        const kamionId = Number.parseInt(String(entry.kamion_id), 10)
        const litara = Number.parseFloat(String(entry.litara))
        const cijenaPoLitri = Number.parseFloat(String(entry.cijena_po_litri))
        const ukupno = Number.parseFloat(String(entry.ukupno))

        if (!kamionId || !entry.datum || Number.isNaN(litara) || Number.isNaN(cijenaPoLitri) || Number.isNaN(ukupno)) {
          errors++
          continue
        }

        await pool.execute<ResultSetHeader>(
          `INSERT INTO gorivo (kamion_id, datum, litara, cijena_po_litri, ukupno)
           VALUES (?, ?, ?, ?, ?)`,
          [kamionId, entry.datum, litara, cijenaPoLitri, ukupno],
        )
        imported++
      } catch (error) {
        console.error("Greška pri importu goriva:", error)
        errors++
      }
    }

    return NextResponse.json({
      message: `Import završen: ${imported} uspješno, ${errors} grešaka`,
      imported,
      errors,
    })
  } catch (error) {
    console.error("Greška pri importu goriva:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
