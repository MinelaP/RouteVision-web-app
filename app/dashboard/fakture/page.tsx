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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Search, FileText, Download, Calendar, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"

interface Faktura {
  faktura_id: number
  tura_id: number
  broj_fakture: string
  datum_izdavanja: string
  iznos: number
  putanja_dokumenta?: string
  narudzba_naziv?: string
  klijent_naziv?: string
}

interface Tura {
  tura_id: number
  narudzba_naziv: string
  klijent_naziv: string
}

export default function FakturePage() {
  const router = useRouter()
  const [fakture, setFakture] = useState<Faktura[]>([])
  const [ture, setTure] = useState<Tura[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentFaktura, setCurrentFaktura] = useState<Faktura | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    tura_id: "",
    broj_fakture: "",
    datum_izdavanja: "",
    iznos: "",
  })

  useEffect(() => {
    checkAuth()
    fetchFakture()
    fetchTure()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const data = await response.json()
        if (data.user.role !== "admin") {
          router.push("/dashboard")
        }
      } else {
        router.push("/login")
      }
    } catch (error) {
      router.push("/login")
    }
  }

  const fetchFakture = async () => {
    try {
      const response = await fetch("/api/fakture")
      if (response.ok) {
        const data = await response.json()
        setFakture(data)
      }
    } catch (error) {
      console.error("Greška pri učitavanju faktura:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTure = async () => {
    try {
      const response = await fetch("/api/ture")
      if (response.ok) {
        const data = await response.json()
        // Kreiraj listu tura sa dodatnim informacijama
        const tureList = data.map((tura: any) => ({
          tura_id: tura.tura_id,
          narudzba_naziv: tura.narudzba_naziv,
          klijent_naziv: tura.klijent_naziv,
        }))
        setTure(tureList)
      }
    } catch (error) {
      console.error("Greška pri učitavanju tura:", error)
    }
  }

  const handleOpenDialog = (faktura?: Faktura) => {
    if (faktura) {
      setCurrentFaktura(faktura)
      setFormData({
        tura_id: faktura.tura_id.toString(),
        broj_fakture: faktura.broj_fakture,
        datum_izdavanja: faktura.datum_izdavanja.split("T")[0],
        iznos: faktura.iznos.toString(),
      })
    } else {
      setCurrentFaktura(null)
      setFormData({
        tura_id: "",
        broj_fakture: "",
        datum_izdavanja: "",
        iznos: "",
      })
    }
    setSelectedFile(null)
    setIsDialogOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = currentFaktura ? `/api/fakture/${currentFaktura.faktura_id}` : "/api/fakture"
      const method = currentFaktura ? "PUT" : "POST"

      const formDataToSend = new FormData()
      if (!currentFaktura) {
        formDataToSend.append("tura_id", formData.tura_id)
      }
      formDataToSend.append("broj_fakture", formData.broj_fakture)
      formDataToSend.append("datum_izdavanja", formData.datum_izdavanja)
      formDataToSend.append("iznos", formData.iznos)

      if (selectedFile) {
        formDataToSend.append("fajl", selectedFile)
      }

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })

      if (response.ok) {
        setIsDialogOpen(false)
        fetchFakture()
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri spremanju fakture")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri spremanju fakture")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const response = await fetch(`/api/fakture/${deleteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteDialogOpen(false)
        setDeleteId(null)
        fetchFakture()
      } else {
        const error = await response.json()
        alert(error.error || "Greška pri brisanju fakture")
      }
    } catch (error) {
      console.error("Greška:", error)
      alert("Greška pri brisanju fakture")
    }
  }

  const filteredFakture = fakture.filter((faktura) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      faktura.broj_fakture.toLowerCase().includes(searchLower) ||
      faktura.narudzba_naziv?.toLowerCase().includes(searchLower) ||
      faktura.klijent_naziv?.toLowerCase().includes(searchLower)
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
            <h1 className="text-3xl font-bold">Fakture</h1>
            <p className="text-muted-foreground">Upravljanje fakturama i dokumentima</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Faktura
          </Button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pretraži po broju fakture, narudžbi ili klijentu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredFakture.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">Nema pronađenih faktura</CardContent>
            </Card>
          ) : (
            filteredFakture.map((faktura) => (
              <Card key={faktura.faktura_id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Faktura #{faktura.broj_fakture}
                      </CardTitle>
                      <CardDescription>
                        {faktura.narudzba_naziv} - {faktura.klijent_naziv}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {faktura.putanja_dokumenta && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={faktura.putanja_dokumenta} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(faktura)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteId(faktura.faktura_id)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Datum izdavanja</p>
                        <p className="font-medium">{new Date(faktura.datum_izdavanja).toLocaleDateString("bs-BA")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Iznos</p>
                        <p className="text-lg font-bold">{faktura.iznos.toFixed(2)} KM</p>
                      </div>
                    </div>
                  </div>
                  {faktura.putanja_dokumenta && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Dokument priložen</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog za kreiranje/ažuriranje fakture */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentFaktura ? "Ažuriraj Fakturu" : "Nova Faktura"}</DialogTitle>
              <DialogDescription>
                {currentFaktura ? "Ažurirajte informacije o fakturi" : "Unesite informacije za novu fakturu"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {!currentFaktura && (
                  <div className="grid gap-2">
                    <Label htmlFor="tura_id">Tura *</Label>
                    <Select
                      value={formData.tura_id}
                      onValueChange={(value) => setFormData({ ...formData, tura_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Odaberite turu" />
                      </SelectTrigger>
                      <SelectContent>
                        {ture.map((tura) => (
                          <SelectItem key={tura.tura_id} value={tura.tura_id.toString()}>
                            {tura.narudzba_naziv} - {tura.klijent_naziv}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="broj_fakture">Broj Fakture *</Label>
                  <Input
                    id="broj_fakture"
                    value={formData.broj_fakture}
                    onChange={(e) => setFormData({ ...formData, broj_fakture: e.target.value })}
                    placeholder="npr. INV-2024-001"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="datum_izdavanja">Datum Izdavanja *</Label>
                  <Input
                    id="datum_izdavanja"
                    type="date"
                    value={formData.datum_izdavanja}
                    onChange={(e) => setFormData({ ...formData, datum_izdavanja: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="iznos">Iznos (KM) *</Label>
                  <Input
                    id="iznos"
                    type="number"
                    step="0.01"
                    value={formData.iznos}
                    onChange={(e) => setFormData({ ...formData, iznos: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fajl">Dokument (PDF, Word, Excel)</Label>
                  <Input id="fajl" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileChange} />
                  {selectedFile && <p className="text-sm text-muted-foreground">Odabrano: {selectedFile.name}</p>}
                  {currentFaktura?.putanja_dokumenta && !selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Trenutni dokument:{" "}
                      <a
                        href={currentFaktura.putanja_dokumenta}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Pogledaj
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Odustani
                </Button>
                <Button type="submit">{currentFaktura ? "Ažuriraj" : "Kreiraj"}</Button>
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
                Da li ste sigurni da želite obrisati ovu fakturu? Dokument će također biti obrisan. Ova akcija se ne
                može poništiti.
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
