"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck } from "lucide-react"

interface Kamion {
  id: number
  registarska_tablica: string
  marka: string
  model: string
  godina_proizvodnje: number
  kapacitet_tone: number
  vrsta_voza: string
  stanje_kilometra: number
  datum_registracije: string
  datum_zakljucnog_pregleda: string
  aktivan: boolean
}

export default function MojKamionPage() {
  const [kamion, setKamion] = useState<Kamion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchKamion = async () => {
      try {
        const response = await fetch("/api/moj-kamion")
        const data = await response.json()

        if (data.success) {
          setKamion(data.data)
        } else {
          setError(data.message || "Nema dodijeljenog kamiona")
        }
      } catch (err) {
        setError("Došlo je do greške pri dohvatanju kamiona")
      } finally {
        setLoading(false)
      }
    }

    fetchKamion()
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Moj kamion</h1>
          <p className="text-muted-foreground">Detalji vašeg dodijeljenog vozila</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Učitavanje...</CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">{error}</CardContent>
          </Card>
        ) : kamion ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                {kamion.registarska_tablica}
              </CardTitle>
              <CardDescription>
                {kamion.marka} {kamion.model}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Godina proizvodnje</p>
                  <p className="font-medium">{kamion.godina_proizvodnje || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kapacitet</p>
                  <p className="font-medium">
                    {kamion.kapacitet_tone ? `${kamion.kapacitet_tone} t` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vrsta voza</p>
                  <p className="font-medium">{kamion.vrsta_voza || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kilometraža</p>
                  <p className="font-medium">{kamion.stanje_kilometra?.toLocaleString() || "0"} km</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum registracije</p>
                  <p className="font-medium">
                    {kamion.datum_registracije
                      ? new Date(kamion.datum_registracije).toLocaleDateString("bs-BA")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum zakl. pregleda</p>
                  <p className="font-medium">
                    {kamion.datum_zakljucnog_pregleda
                      ? new Date(kamion.datum_zakljucnog_pregleda).toLocaleDateString("bs-BA")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={kamion.aktivan ? "default" : "secondary"}>
                    {kamion.aktivan ? "Aktivan" : "Neaktivan"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
