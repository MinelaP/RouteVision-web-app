import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, type UserRole } from "@/lib/auth"
import { cookies } from "next/headers"

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, role } = body

    // Validacija podataka
    if (!email || !password || !role) {
      return NextResponse.json({ success: false, message: "Email, lozinka i uloga su obavezni" }, { status: 400 })
    }

    // Provjera da li je uloga validna
    if (role !== "admin" && role !== "vozac") {
      return NextResponse.json({ success: false, message: "Nevalidna uloga korisnika" }, { status: 400 })
    }

    // Autentifikacija korisnika
    const user = await authenticateUser(email, password, role as UserRole)

    if (!user) {
      return NextResponse.json({ success: false, message: "Neispravni pristupni podaci" }, { status: 401 })
    }

    // Kreiranje sesije (spremanje u cookie)
    const sessionData = {
      userId: user.id,
      email: user.email,
      ime: user.ime,
      prezime: user.prezime,
      role: user.role,
    }

    // Postavljanje cookie-a sa sesijom
    const cookieStore = await cookies()
    cookieStore.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 sati
    })

    return NextResponse.json({
      success: true,
      message: "Uspješna prijava",
      user: {
        id: user.id,
        ime: user.ime,
        prezime: user.prezime,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("[v0] Greška pri prijavi:", error)
    return NextResponse.json({ success: false, message: "Greška na serveru" }, { status: 500 })
  }
}
