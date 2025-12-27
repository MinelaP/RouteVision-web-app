import DashboardLayout from "@/components/dashboard-layout"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Users, Package, FileText, TrendingUp, AlertCircle } from "lucide-react"
import pool from "@/lib/db"
import type { RowDataPacket } from "mysql2"

interface DashboardStats {
  ukupnoVozaca: number
  ukupnoKamiona: number
  aktivneTure: number
  neplaceneFakture: number
}

interface StatusCount extends RowDataPacket {
  count: number
}

async function getDashboardStats(role: string, userId: number): Promise<DashboardStats> {
  try {
    if (role === "admin") {
      // Admin vidi sve statistike
      const [vozaciResult] = await pool.execute<StatusCount[]>(
        "SELECT COUNT(*) as count FROM vozac WHERE aktivan = TRUE",
      )
      const [kamioniResult] = await pool.execute<StatusCount[]>(
        "SELECT COUNT(*) as count FROM kamion WHERE aktivan = TRUE",
      )
      const [tureResult] = await pool.execute<StatusCount[]>(
        "SELECT COUNT(*) as count FROM tura WHERE status = 'U toku' AND aktivan = TRUE",
      )
      const [faktureResult] = await pool.execute<StatusCount[]>(
        "SELECT COUNT(*) as count FROM fakture WHERE status_placanja = 'Neplaćeno' AND aktivan = TRUE",
      )

      return {
        ukupnoVozaca: vozaciResult[0].count,
        ukupnoKamiona: kamioniResult[0].count,
        aktivneTure: tureResult[0].count,
        neplaceneFakture: faktureResult[0].count,
      }
    } else {
      // Vozač vidi samo svoje statistike
      const [tureResult] = await pool.execute<StatusCount[]>(
        "SELECT COUNT(*) as count FROM tura WHERE vozac_id = ? AND status = 'U toku' AND aktivan = TRUE",
        [userId],
      )

      return {
        ukupnoVozaca: 0,
        ukupnoKamiona: 0,
        aktivneTure: tureResult[0].count,
        neplaceneFakture: 0,
      }
    }
  } catch (error) {
    console.error("[v0] Greška pri dohvatanju statistika:", error)
    return {
      ukupnoVozaca: 0,
      ukupnoKamiona: 0,
      aktivneTure: 0,
      neplaceneFakture: 0,
    }
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    redirect("/login")
  }

  const session = JSON.parse(sessionCookie.value)
  const stats = await getDashboardStats(session.role, session.userId)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Naslov */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dobrodošli, {session.ime} {session.prezime}
          </h1>
          <p className="text-muted-foreground">Pregled stanja i aktivnosti u sistemu RouteVision</p>
        </div>

        {/* Statistika karticama */}
        {session.role === "admin" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ukupno vozača</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ukupnoVozaca}</div>
                <p className="text-xs text-muted-foreground">Aktivni vozači u sistemu</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vozni park</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ukupnoKamiona}</div>
                <p className="text-xs text-muted-foreground">Aktivni kamioni</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktivne ture</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.aktivneTure}</div>
                <p className="text-xs text-muted-foreground">Ture u toku</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Neplaćene fakture</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.neplaceneFakture}</div>
                <p className="text-xs text-muted-foreground">Fakture na čekanju</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktivne ture</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.aktivneTure}</div>
                <p className="text-xs text-muted-foreground">Vaše ture u toku</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Aktivan</div>
                <p className="text-xs text-muted-foreground">Spremni za vožnju</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Brzi pristup */}
        <Card>
          <CardHeader>
            <CardTitle>Brzi pristup</CardTitle>
            <CardDescription>Najčešće korištene funkcije</CardDescription>
          </CardHeader>
          <CardContent>
            {session.role === "admin" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <a
                  href="/dashboard/osoblje"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Upravljanje osobljem</p>
                    <p className="text-sm text-muted-foreground">Dodaj/Uredi osoblje</p>
                  </div>
                </a>
                <a
                  href="/dashboard/ture"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Pregled tura</p>
                    <p className="text-sm text-muted-foreground">Praćenje aktivnih tura</p>
                  </div>
                </a>
                <a
                  href="/dashboard/fakture"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Fakture</p>
                    <p className="text-sm text-muted-foreground">Upravljanje fakturama</p>
                  </div>
                </a>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href="/dashboard/moje-ture"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Moje ture</p>
                    <p className="text-sm text-muted-foreground">Pregled mojih tura</p>
                  </div>
                </a>
                <a
                  href="/dashboard/moj-kamion"
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
                >
                  <Truck className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">Moj kamion</p>
                    <p className="text-sm text-muted-foreground">Detalji vozila</p>
                  </div>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Obavještenja */}
        <Card>
          <CardHeader>
            <CardTitle>Nedavne aktivnosti</CardTitle>
            <CardDescription>Pregled nedavnih promjena u sistemu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sistem je uspješno pokrenut</p>
                  <p className="text-xs text-muted-foreground">RouteVision je spreman za korištenje</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
