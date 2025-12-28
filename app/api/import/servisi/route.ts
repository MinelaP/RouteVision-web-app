import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { ResultSetHeader } from "mysql2"

interface ServisImport {
  kamion_id: number
  datum_servisa: string
  vrsta_servisa?: string
  opis_servisa?: string
  troskovi: number
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const data = await request.json()
    const { servisi } = data

    if (!Array.isArray(servisi) || servisi.length === 0) {
      return NextResponse.json({ error: "Nevažeći format podataka" }, { status: 400 })
    }

    let imported = 0
    let errors = 0

    for (const servis of servisi as ServisImport[]) {
      try {
        const troskovi = Number.parseFloat(String(servis.troskovi))
        const kamionId = Number.parseInt(String(servis.kamion_id), 10)

        if (!kamionId || !servis.datum_servisa || Number.isNaN(troskovi)) {
          errors++
          continue
        }

        await pool.execute<ResultSetHeader>(
          `INSERT INTO servisni_dnevnik (kamion_id, datum_servisa, vrsta_servisa, opisServisa, troskovi, nadlezni_admin_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            kamionId,
            servis.datum_servisa,
            servis.vrsta_servisa || null,
            servis.opis_servisa || null,
            troskovi,
            user.id,
          ],
        )
        imported++
      } catch (error) {
        console.error("Greška pri importu servisa:", error)
        errors++
      }
    }

    return NextResponse.json({
      message: `Import završen: ${imported} uspješno, ${errors} grešaka`,
      imported,
      errors,
    })
  } catch (error) {
    console.error("Greška pri importu servisa:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
