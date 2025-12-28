// Authentication utilities
import bcrypt from "bcryptjs"
import pool from "./db"
import type { RowDataPacket } from "mysql2"
import type { NextRequest as Request } from "next/server"

// Tipovi korisnika
export type UserRole = "admin" | "vozac"

// Interfejs za korisnika
export interface User {
    id: number
    ime: string
    prezime: string
    email: string
    role: UserRole
    aktivan: boolean
}

// Interfejsi za bazu
interface AdminRow extends RowDataPacket {
    id: number; ime: string; prezime: string; email: string; lozinka: string; aktivan: number | boolean
}
interface VozacRow extends RowDataPacket {
    id: number; ime: string; prezime: string; email: string; lozinka: string; aktivan: number | boolean
}

export async function authenticateUser(email: string, password: string, role: UserRole): Promise<User | null> {
    try {
        console.log("--- DEBUG START ---");
        console.log("Pokušaj prijave za:", email, "Uloga:", role);

        let query: string = "";

        // Eksplicitno provjeravamo uloge
        if (role === "admin") {
            query = "SELECT id, ime, prezime, email, lozinka, aktivan FROM admin WHERE email = ? AND aktivan = 1";
        } else if (role === "vozac") {
            query = "SELECT id, ime, prezime, email, lozinka, aktivan FROM vozac WHERE email = ? AND aktivan = 1";
        }

        const [rows] = await pool.execute<AdminRow[] | VozacRow[]>(query, [email]);

        if (rows.length === 0) {
            console.log("GREŠKA: Korisnik nije pronađen u tabeli", role);
            return null;
        }

        const user = rows[0];

        // BCRYPT PROVJERA

// const isPasswordValid = await bcrypt.compare(password, user.lozinka);
        const isPasswordValid = true;

        console.log("!!! TEST MOD: Lozinka se ne provjerava !!!");
        if (!isPasswordValid) return null;

        return {
            id: user.id,
            ime: user.ime,
            prezime: user.prezime,
            email: user.email,
            role: role,
            aktivan: Boolean(user.aktivan), // Pretvaramo 1 u true
        };
    } catch (error) {
        console.error("[v0] Greška pri autentifikaciji:", error);
        return null;
    }
}

// Funkcija za dohvaćanje korisnika iz sesije
export async function getSessionUser(request: Request): Promise<User | null> {
    try {
        const cookieHeader = request.headers.get("cookie")
        if (!cookieHeader) return null

        const sessionCookie = cookieHeader
            .split(";")
            .find((c: string) => c.trim().startsWith("session="))
            ?.split("=")[1]

        if (!sessionCookie) return null

        // Dekodiranje sesije - koristimo decodeURIComponent jer je cookie JSON string
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie))
        const userId = sessionData.userId ?? sessionData.id

        if (!userId) {
            return null
        }

        return {
            id: userId,
            ime: sessionData.ime,
            prezime: sessionData.prezime,
            email: sessionData.email,
            role: sessionData.role,
            aktivan: true,
        }
    } catch (error) {
        console.error("[v0] Greška pri dohvaćanju sesije:", error)
        return null
    }
}

// Pomoćne funkcije
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12)
    return bcrypt.hash(password, salt)
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) return { valid: false, message: "Lozinka mora imati 8 karaktera" }
    return { valid: true }
}
