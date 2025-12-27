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
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Pencil, Trash2, Search, Calendar, User, Truck } from "lucide-react"
import { useRouter } from "next/navigation"

interface Tura {
  tura_id: number
  vozac_id: number
  vozac_ime: string
  vozac_prezime: string
  kamion_id: number
  kamion_registracija: string
  kamion_model: string
  narudba_id: number
  narudzba_naziv: string
  klijent_naziv: string
  datum_pocetka: string
  datum_zavrsetka?: string
  status: string
  napomena?: string
}

interface Vozac {
  vozac_id: number
  ime: string
  prezime: string
}

interface Kamion {
  kamion_id: number
  registracija: string
  model: string
}

interface Narudzba {
  narudba_id: number
  naziv: string
}

export default function TurePage() {
  const router = useRouter()
  const [ture, setTure] = useState<Tura[]>([])
  const [vozaci, setVozaci] = useState<Vozac[]>([])
  const [kamioni, setKamioni] = useState<Kamion[]>([])
  const [narudzbe, setNarudzbe] = useState<Narudzba[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTura, setCurrentTura] = useState<Tura | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("sve")
  const [userRole, setUserRole] = useState<"admin" | "vozac">("admin")

  const [formData, setFormData] = useState({
    vozac_id: "",
    kamion_id: "",
    narudba_id: "",
    datum_pocetka: "",
    datum_zavrsetka: "",
    status: "U toku",
    napomena: "",
  })

  useEffect(() => {
    checkAuth()
    fetchTure()
    fetchVozaci()
    fetchKamioni()
    fetchNarudzbe()
  }, [])

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

  const fetchTure = async () => {
    try {
      const response = await fetch("/api/ture")
      if (response.ok) {
        const data = await response.json()
        setTure(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju tura:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVozaci = async () => {
    try {
      const response = await fetch("/api/osoblje?rola=vozac")
      if (response.ok) {
        const data = await response.json()
        setVozaci(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju vozača:", error)
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

  const fetchNarudzbe = async () => {
    try {
      const response = await fetch("/api/narudzbe")
      if (response.ok) {
        const data = await response.json()
        setNarudzbe(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju narudžbi:", error)
    }
  }

  const handleOpenDialog = (tura?: Tura) => {
    if (tura) {
      setCurrentTura(tura)
      setFormData({
        vozac_id: tura.vozac_id.toString(),
        kamion_id: tura.kamion_id.toString(),
        narudba_id: tura.narudba_id.toString(),
        datum_pocetka: tura.datum_pocetka.split("T")[0],
        datum_zavrsetka: tura.datum_zavrsetka ? tura.datum_zavrsetka.split("T")[0] : "",
        status: tura.status,
        napomena: tura.napomena || "",
      })
    } else {
      setCurrentTura(null)
      setFormData({
        vozac_id: "",
        kamion_id: "",
        narudba_id: "",
        datum_pocetka: "",
        datum_zavrsetka: "",
        status: "U toku",
        napomena: "",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = currentTura ? `/api/ture/${currentTura.tura_id}` : "/api/ture"
      const method = currentTura ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchTure()
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri spremanju ture")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri spremanju ture")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/ture/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        setDeleteId(null)
        fetchTure()
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri brisanju ture")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri brisanju ture")
    }
  }

  const filteredTure = ture.filter((tura) => {
    const matchesSearch =
      tura.vozac_ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tura.vozac_prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tura.kamion_registracija.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tura.narudzba_naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tura.klijent_naziv.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = activeTab === "sve" || tura.status === activeTab

    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "U toku":
        return <Badge className="bg-blue-500">{status}</Badge>
      case "Završena":
        return <Badge className="bg-green-500">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

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
            <h1 className="text-3xl font-bold">Ture</h1>
            <p className="text-muted-foreground">Upravljanje transportnim turama</p>
          </div>
          {userRole === "admin" && (
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Tura
            </Button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži po vozaču, kamionu, narudžbi ili klijentu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sve">Sve Ture</TabsTrigger>
            <TabsTrigger value="U toku">U Toku</TabsTrigger>
            <TabsTrigger value="Završena">Završene</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid gap-4">
              {filteredTure.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">Nema pronađenih tura</CardContent>
                </Card>
              ) : (
                filteredTure.map((tura) => (
                  <Card key={tura.tura_id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">{tura.narudzba_naziv}</CardTitle>
                          <CardDescription>Klijent: {tura.klijent_naziv}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(tura.status)}
                          {userRole === "admin" && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(tura)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteId(tura.tura_id)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Vozač</p>
                            <p className="font-medium">
                              {tura.vozac_ime} {tura.vozac_prezime}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Kamion</p>
                            <p className="font-medium">{tura.kamion_registracija}</p>
                            <p className="text-sm text-muted-foreground">{tura.kamion_model}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Datum početka</p>
                            <p className="font-medium">{new Date(tura.datum_pocetka).toLocaleDateString("bs-BA")}</p>
                          </div>
                        </div>
                        {tura.datum_zavrsetka && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">Datum završetka</p>
                              <p className="font-medium">
                                {new Date(tura.datum_zavrsetka).toLocaleDateString("bs-BA")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      {tura.napomena && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Napomena:</p>
                          <p className="text-sm">{tura.napomena}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog za kreiranje/ažuriranje ture */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{currentTura ? "Ažuriraj Turu" : "Nova Tura"}</DialogTitle>
              <DialogDescription>
                {currentTura ? "Ažurirajte informacije o turi" : "Unesite informacije za novu turu"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {userRole === "admin" ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="vozac_id">Vozač *</Label>
                      <Select
                        value={formData.vozac_id}
                        onValueChange={(value) => setFormData({ ...formData, vozac_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Odaberite vozača" />
                        </SelectTrigger>
                        <SelectContent>
                          {vozaci.map((vozac) => (
                            <SelectItem key={vozac.vozac_id} value={vozac.vozac_id.toString()}>
                              {vozac.ime} {vozac.prezime}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="kamion_id">Kamion *</Label>
                      <Select
                        value={formData.kamion_id}
                        onValueChange={(value) => setFormData({ ...formData, kamion_id: value })}
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
                      <Label htmlFor="narudba_id">Narudžba *</Label>
                      <Select
                        value={formData.narudba_id}
                        onValueChange={(value) => setFormData({ ...formData, narudba_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Odaberite narudžbu" />
                        </SelectTrigger>
                        <SelectContent>
                          {narudzbe.map((narudzba) => (
                            <SelectItem key={narudzba.narudba_id} value={narudzba.narudba_id.toString()}>
                              {narudzba.naziv}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="datum_pocetka">Datum Početka *</Label>
                        <Input
                          id="datum_pocetka"
                          type="date"
                          value={formData.datum_pocetka}
                          onChange={(e) => setFormData({ ...formData, datum_pocetka: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="datum_zavrsetka">Datum Završetka</Label>
                        <Input
                          id="datum_zavrsetka"
                          type="date"
                          value={formData.datum_zavrsetka}
                          onChange={(e) => setFormData({ ...formData, datum_zavrsetka: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U toku">U toku</SelectItem>
                      <SelectItem value="Završena">Završena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="napomena">Napomena</Label>
                  <Textarea
                    id="napomena"
                    value={formData.napomena}
                    onChange={(e) => setFormData({ ...formData, napomena: e.target.value })}
                    placeholder="Dodatne informacije..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">{currentTura ? "Ažuriraj" : "Kreiraj"}</Button>
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
                Da li ste sigurni da želite obrisati ovu turu? Ova akcija se ne može poništiti.
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
