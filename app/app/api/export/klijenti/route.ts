import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || user.rola !== "admin") {
      return NextResponse.json({ error: "Nemate dozvolu" }, { status: 403 })
    }

    const klijenti = await query("SELECT * FROM klijent ORDER BY klijent_id")

    return NextResponse.json(klijenti)
  } catch (error) {
    console.error("Greška pri exportu klijenata:", error)
    return NextResponse.json({ error: "Greška servera" }, { status: 500 })
  }
}
