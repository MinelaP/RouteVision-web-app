"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Search, Wrench, Fuel, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { ExportImportMenu } from "@/components/export-import-menu"

interface Servis {
  servis_id: number
  kamion_id?: number
  kamion_registracija?: string
  kamion_model?: string
  oprema_id?: number
  oprema_naziv?: string
  datum: string
  opis: string
  troskovi: number
}

interface Gorivo {
  gorivo_id: number
  kamion_id: number
  kamion_registracija: string
  kamion_model: string
  datum: string
  litara: number
  cijena_po_litri: number
  ukupno: number
}

interface Kamion {
  kamion_id: number
  registracija: string
  model: string
}

interface Oprema {
  oprema_id: number
  naziv: string
}

export default function EvidencijaPage() {
  const router = useRouter()
  const [servisi, setServisi] = useState<Servis[]>([])
  const [gorivo, setGorivo] = useState<Gorivo[]>([])
  const [kamioni, setKamioni] = useState<Kamion[]>([])
  const [oprema, setOprema] = useState<Oprema[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isServisDialogOpen, setIsServisDialogOpen] = useState(false)
  const [isGorivoDialogOpen, setIsGorivoDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentServis, setCurrentServis] = useState<Servis | null>(null)
  const [currentGorivo, setCurrentGorivo] = useState<Gorivo | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ type: string; id: number } | null>(null)
  const [activeTab, setActiveTab] = useState("servisi")
  const [userRole, setUserRole] = useState<"admin" | "vozac">("admin")

  const [servisFormData, setServisFormData] = useState({
    tip: "kamion",
    kamion_id: "",
    oprema_id: "",
    datum: "",
    opis: "",
    troskovi: "",
  })

  const [gorivoFormData, setGorivoFormData] = useState({
    kamion_id: "",
    datum: "",
    litara: "",
    cijena_po_litri: "",
    ukupno: "",
  })

  useEffect(() => {
    checkAuth()
    fetchServisi()
    fetchGorivo()
    fetchKamioni()
    fetchOprema()
  }, [])

  useEffect(() => {
    // Automatski izračunaj ukupno
    const litara = Number.parseFloat(gorivoFormData.litara) || 0
    const cijena = Number.parseFloat(gorivoFormData.cijena_po_litri) || 0
    setGorivoFormData((prev) => ({
      ...prev,
      ukupno: (litara * cijena).toFixed(2),
    }))
  }, [gorivoFormData.litara, gorivoFormData.cijena_po_litri])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const data = await response.json()
        setUserRole(data.user.rola)
      } else {
        router.push("/login")
      }
    } catch (error) {
      router.push("/login")
    }
  }

  const fetchServisi = async () => {
    try {
      const response = await fetch("/api/servisi")
      if (response.ok) {
        const data = await response.json()
        setServisi(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju servisa:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGorivo = async () => {
    try {
      const response = await fetch("/api/gorivo")
      if (response.ok) {
        const data = await response.json()
        setGorivo(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju goriva:", error)
    }
  }

  const fetchKamioni = async () => {
    try {
      const response = await fetch("/api/vozni-park")
      if (response.ok) {
        const data = await response.json()
        setKamioni(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju kamiona:", error)
    }
  }

  const fetchOprema = async () => {
    try {
      const response = await fetch("/api/oprema")
      if (response.ok) {
        const data = await response.json()
        setOprema(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju opreme:", error)
    }
  }

  const handleOpenServisDialog = (servis?: Servis) => {
    if (servis) {
      setCurrentServis(servis)
      setServisFormData({
        tip: servis.kamion_id ? "kamion" : "oprema",
        kamion_id: servis.kamion_id?.toString() || "",
        oprema_id: servis.oprema_id?.toString() || "",
        datum: servis.datum.split("T")[0],
        opis: servis.opis,
        troskovi: servis.troskovi.toString(),
      })
    } else {
      setCurrentServis(null)
      setServisFormData({
        tip: "kamion",
        kamion_id: "",
        oprema_id: "",
        datum: "",
        opis: "",
        troskovi: "",
      })
    }
    setIsServisDialogOpen(true)
  }

  const handleOpenGorivoDialog = (gorivoItem?: Gorivo) => {
    if (gorivoItem) {
      setCurrentGorivo(gorivoItem)
      setGorivoFormData({
        kamion_id: gorivoItem.kamion_id.toString(),
        datum: gorivoItem.datum.split("T")[0],
        litara: gorivoItem.litara.toString(),
        cijena_po_litri: gorivoItem.cijena_po_litri.toString(),
        ukupno: gorivoItem.ukupno.toString(),
      })
    } else {
      setCurrentGorivo(null)
      setGorivoFormData({
        kamion_id: "",
        datum: "",
        litara: "",
        cijena_po_litri: "",
        ukupno: "",
      })
    }
    setIsGorivoDialogOpen(true)
  }

  const handleServisSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = currentServis ? `/api/servisi/${currentServis.servis_id}` : "/api/servisi"
      const method = currentServis ? "PUT" : "POST"

      const payload = {
        kamion_id: servisFormData.tip === "kamion" ? servisFormData.kamion_id : null,
        oprema_id: servisFormData.tip === "oprema" ? servisFormData.oprema_id : null,
        datum: servisFormData.datum,
        opis: servisFormData.opis,
        troskovi: servisFormData.troskovi,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setIsServisDialogOpen(false)
        fetchServisi()
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri spremanju servisa")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri spremanju servisa")
    }
  }

  const handleGorivoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = currentGorivo ? `/api/gorivo/${currentGorivo.gorivo_id}` : "/api/gorivo"
      const method = currentGorivo ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gorivoFormData),
      })

      if (response.ok) {
        setIsGorivoDialogOpen(false)
        fetchGorivo()
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri spremanju goriva")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri spremanju goriva")
    }
  }

  const handleDelete = async () => {
    if (!deleteInfo) return

    try {
      const url = deleteInfo.type === "servis" ? `/api/servisi/${deleteInfo.id}` : `/api/gorivo/${deleteInfo.id}`

      const response = await fetch(url, { method: "DELETE" })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        setDeleteInfo(null)
        if (deleteInfo.type === "servis") {
          fetchServisi()
        } else {
          fetchGorivo()
        }
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri brisanju")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri brisanju")
    }
  }

  const filteredServisi = servisi.filter((servis) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      servis.kamion_registracija?.toLowerCase().includes(searchLower) ||
      servis.oprema_naziv?.toLowerCase().includes(searchLower) ||
      servis.opis.toLowerCase().includes(searchLower)
    )
  })

  const filteredGorivo = gorivo.filter((g) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      g.kamion_registracija.toLowerCase().includes(searchLower) || g.kamion_model.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8">Učitavanje...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Evidencija</h1>
            <p className="text-muted-foreground">Upravljanje servisima i gorivom</p>
          </div>
          <ExportImportMenu module="servisi" onImportComplete={fetchServisi} />
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="servisi">
              <Wrench className="mr-2 h-4 w-4" />
              Servisi
            </TabsTrigger>
            <TabsTrigger value="gorivo">
              <Fuel className="mr-2 h-4 w-4" />
              Gorivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servisi" className="mt-6">
            <div className="mb-4">
              <Button onClick={() => handleOpenServisDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novi Servis
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredServisi.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">Nema pronađenih servisa</CardContent>
                </Card>
              ) : (
                filteredServisi.map((servis) => (
                  <Card key={servis.servis_id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">
                            {servis.kamion_registracija
                              ? `${servis.kamion_registracija} - ${servis.kamion_model}`
                              : servis.oprema_naziv}
                          </CardTitle>
                          <CardDescription>{new Date(servis.datum).toLocaleDateString("bs-BA")}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenServisDialog(servis)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {userRole === "admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteInfo({ type: "servis", id: servis.servis_id })
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">{servis.opis}</p>
                        <div className="flex items-center gap-2 text-lg font-bold">
                          <DollarSign className="h-5 w-5" />
                          {servis.troskovi.toFixed(2)} KM
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="gorivo" className="mt-6">
            <div className="mb-4">
              <Button onClick={() => handleOpenGorivoDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Punjenje
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredGorivo.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Nema pronađenih unosa goriva
                  </CardContent>
                </Card>
              ) : (
                filteredGorivo.map((g) => (
                  <Card key={g.gorivo_id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">
                            {g.kamion_registracija} - {g.kamion_model}
                          </CardTitle>
                          <CardDescription>{new Date(g.datum).toLocaleDateString("bs-BA")}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenGorivoDialog(g)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {userRole === "admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeleteInfo({ type: "gorivo", id: g.gorivo_id })
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Litara</p>
                          <p className="text-lg font-medium">{g.litara.toFixed(2)} L</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cijena po litri</p>
                          <p className="text-lg font-medium">{g.cijena_po_litri.toFixed(2)} KM</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ukupno</p>
                          <p className="text-lg font-bold">{g.ukupno.toFixed(2)} KM</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog za servis */}
        <Dialog open={isServisDialogOpen} onOpenChange={setIsServisDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentServis ? "Ažuriraj Servis" : "Novi Servis"}</DialogTitle>
              <DialogDescription>
                {currentServis ? "Ažurirajte informacije o servisu" : "Unesite informacije o servisu"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleServisSubmit}>
              <div className="grid gap-4 py-4">
                {!currentServis && (
                  <div className="grid gap-2">
                    <Label>Tip</Label>
                    <Select
                      value={servisFormData.tip}
                      onValueChange={(value) => setServisFormData({ ...servisFormData, tip: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kamion">Kamion</SelectItem>
                        <SelectItem value="oprema">Oprema</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {servisFormData.tip === "kamion" && (
                  <div className="grid gap-2">
                    <Label htmlFor="kamion_id">Kamion *</Label>
                    <Select
                      value={servisFormData.kamion_id}
                      onValueChange={(value) => setServisFormData({ ...servisFormData, kamion_id: value })}
                      disabled={!!currentServis}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite kamion" />
                      </SelectTrigger>
                      <SelectContent>
                        {kamioni.map((kamion) => (
                          <SelectItem key={kamion.kamion_id} value={kamion.kamion_id.toString()}>
                            {kamion.registracija} - {kamion.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {servisFormData.tip === "oprema" && (
                  <div className="grid gap-2">
                    <Label htmlFor="oprema_id">Oprema *</Label>
                    <Select
                      value={servisFormData.oprema_id}
                      onValueChange={(value) => setServisFormData({ ...servisFormData, oprema_id: value })}
                      disabled={!!currentServis}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite opremu" />
                      </SelectTrigger>
                      <SelectContent>
                        {oprema.map((o) => (
                          <SelectItem key={o.oprema_id} value={o.oprema_id.toString()}>
                            {o.naziv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="datum">Datum *</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={servisFormData.datum}
                    onChange={(e) => setServisFormData({ ...servisFormData, datum: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="opis">Opis *</Label>
                  <Textarea
                    id="opis"
                    value={servisFormData.opis}
                    onChange={(e) => setServisFormData({ ...servisFormData, opis: e.target.value })}
                    placeholder="Opis servisa..."
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="troskovi">Troškovi (KM) *</Label>
                  <Input
                    id="troskovi"
                    type="number"
                    step="0.01"
                    value={servisFormData.troskovi}
                    onChange={(e) => setServisFormData({ ...servisFormData, troskovi: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsServisDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">{currentServis ? "Ažuriraj" : "Kreiraj"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog za gorivo */}
        <Dialog open={isGorivoDialogOpen} onOpenChange={setIsGorivoDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentGorivo ? "Ažuriraj Gorivo" : "Novo Punjenje"}</DialogTitle>
              <DialogDescription>
                {currentGorivo ? "Ažurirajte informacije o gorivu" : "Unesite informacije o punjenju"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGorivoSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="kamion_id">Kamion *</Label>
                  <Select
                    value={gorivoFormData.kamion_id}
                    onValueChange={(value) => setGorivoFormData({ ...gorivoFormData, kamion_id: value })}
                    disabled={!!currentGorivo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Odaberite kamion" />
                    </SelectTrigger>
                    <SelectContent>
                      {kamioni.map((kamion) => (
                        <SelectItem key={kamion.kamion_id} value={kamion.kamion_id.toString()}>
                          {kamion.registracija} - {kamion.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="datum">Datum *</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={gorivoFormData.datum}
                    onChange={(e) => setGorivoFormData({ ...gorivoFormData, datum: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="litara">Litara *</Label>
                  <Input
                    id="litara"
                    type="number"
                    step="0.01"
                    value={gorivoFormData.litara}
                    onChange={(e) => setGorivoFormData({ ...gorivoFormData, litara: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cijena_po_litri">Cijena po litri (KM) *</Label>
                  <Input
                    id="cijena_po_litri"
                    type="number"
                    step="0.01"
                    value={gorivoFormData.cijena_po_litri}
                    onChange={(e) => setGorivoFormData({ ...gorivoFormData, cijena_po_litri: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ukupno">Ukupno (KM)</Label>
                  <Input
                    id="ukupno"
                    type="number"
                    step="0.01"
                    value={gorivoFormData.ukupno}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsGorivoDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">{currentGorivo ? "Ažuriraj" : "Kreiraj"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog za potvrdu brisanja */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Potvrda Brisanja</DialogTitle>
              <DialogDescription>
                Da li ste sigurni da želite obrisati ovaj unos? Ova akcija se ne može poništiti.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Odustani
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Obriši
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
