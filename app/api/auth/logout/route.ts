import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// POST /api/auth/logout
export async function POST(request: NextRequest) {
  try {
    // Brisanje sesije
    const cookieStore = await cookies()
    cookieStore.delete("session")

    return NextResponse.json({
      success: true,
      message: "Uspješna odjava",
    })
  } catch (error) {
    console.error("[v0] Greška pri odjavi:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
