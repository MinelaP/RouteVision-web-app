import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
    const session = request.cookies.get("session")
    const { pathname } = request.nextUrl

    // Javne rute koje ne zahtijevaju autentifikaciju
    const publicRoutes = ["/login"]
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

    // Ako korisnik nije prijavljen i pokušava pristupiti zaštićenoj ruti
    if (!session && !isPublicRoute && pathname !== "/") {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // Ako je korisnik prijavljen i pokušava pristupiti login stranici
    if (session && pathname === "/login") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Primjenjuje se na sve rute osim:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
