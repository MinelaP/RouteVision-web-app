// Database connection utility for MySQL
import mysql from "mysql2/promise"

// Kreiranje connection pool-a za MySQL bazu podataka
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "baza",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
})

// Testiranje konekcije pri inicijalizaciji
pool
    .getConnection()
    .then((connection) => {
        console.log("[v0] MySQL baza podataka uspješno povezana")
        connection.release()
    })
    .catch((err) => {
        console.error("[v0] Greška pri povezivanju sa MySQL bazom:", err)
    })

export async function query(sql: string, params?: any[]) {
    const [rows] = await pool.execute(sql, params)
    return rows
}

export default pool
