import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import type { RowDataPacket } from "mysql2"

interface KlijentRow extends RowDataPacket {
  id: number
  naziv_firme: string
  tip_klijenta: string | null
  adresa: string | null
  mjesto: string | null
  postanskiBroj: string | null
  drzava: string | null
  kontakt_osoba: string | null
  email: string | null
  broj_telefona: string | null
  broj_faksa: string | null
  poreska_broj: string | null
  naziv_banke: string | null
  racun_broj: string | null
  aktivan: boolean
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const [klijenti] = await pool.execute<KlijentRow[]>(
      `SELECT id, naziv_firme, tip_klijenta, adresa, mjesto, postanskiBroj, drzava, kontakt_osoba, email,
       broj_telefona, broj_faksa, poreska_broj, naziv_banke, racun_broj, aktivan
       FROM klijent ORDER BY datum_kreiranja DESC`,
    )

    return NextResponse.json(klijenti)
  } catch (error) {
    console.error("Greška pri exportu klijenata:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
