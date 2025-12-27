import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// GET /api/auth/session - Provjera trenutne sesije
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Nema aktivne sesije" }, { status: 401 })
    }

    const session = JSON.parse(sessionCookie.value)

    return NextResponse.json({
      success: true,
      user: session,
    })
  } catch (error) {
    console.error("[v0] Greška pri provjeri sesije:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
