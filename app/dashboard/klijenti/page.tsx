"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ExportImportMenu } from "@/components/export-import-menu"

interface Klijent {
  id: number
  naziv_firme: string
  tip_klijenta: string
  adresa: string
  mjesto: string
  postanskiBroj: string
  drzava: string
  kontakt_osoba: string
  email: string
  broj_telefona: string
  broj_faksa: string
  poreska_broj: string
  naziv_banke: string
  racun_broj: string
  ukupna_narudena_kolicina: number
  ukupno_placeno: number
  aktivan: boolean
}

export default function KlijentiPage() {
  const { toast } = useToast()
  const [klijenti, setKlijenti] = useState<Klijent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    naziv_firme: "",
    tip_klijenta: "",
    adresa: "",
    mjesto: "",
    postanskiBroj: "",
    drzava: "",
    kontakt_osoba: "",
    email: "",
    broj_telefona: "",
    broj_faksa: "",
    poreska_broj: "",
    naziv_banke: "",
    racun_broj: "",
  })

  useEffect(() => {
    fetchKlijenti()
  }, [])

  const fetchKlijenti = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/klijenti")
      const data = await response.json()

      if (data.success) {
        setKlijenti(data.data)
      }
    } catch (error) {
      console.error("[v0] Greška pri dohvatanju klijenata:", error)
      toast({
        title: "Greška",
        description: "Nije moguće dohvatiti podatke o klijentima",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (edit = false, item?: Klijent) => {
    setEditMode(edit)
    if (edit && item) {
      setSelectedId(item.id)
      setFormData({
        naziv_firme: item.naziv_firme,
        tip_klijenta: item.tip_klijenta || "",
        adresa: item.adresa || "",
        mjesto: item.mjesto || "",
        postanskiBroj: item.postanskiBroj || "",
        drzava: item.drzava || "",
        kontakt_osoba: item.kontakt_osoba || "",
        email: item.email || "",
        broj_telefona: item.broj_telefona || "",
        broj_faksa: item.broj_faksa || "",
        poreska_broj: item.poreska_broj || "",
        naziv_banke: item.naziv_banke || "",
        racun_broj: item.racun_broj || "",
      })
    } else {
      setSelectedId(null)
      setFormData({
        naziv_firme: "",
        tip_klijenta: "",
        adresa: "",
        mjesto: "",
        postanskiBroj: "",
        drzava: "",
        kontakt_osoba: "",
        email: "",
        broj_telefona: "",
        broj_faksa: "",
        poreska_broj: "",
        naziv_banke: "",
        racun_broj: "",
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editMode ? `/api/klijenti/${selectedId}` : "/api/klijenti"
      const method = editMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Uspjeh",
          description: data.message,
        })
        setDialogOpen(false)
        fetchKlijenti()
      } else {
        toast({
          title: "Greška",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Greška pri čuvanju:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške na serveru",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedId) return

    try {
      const response = await fetch(`/api/klijenti/${selectedId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Uspjeh",
          description: data.message,
        })
        setDeleteDialogOpen(false)
        fetchKlijenti()
      } else {
        toast({
          title: "Greška",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Greška pri brisanju:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške na serveru",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (klijent: Klijent) => {
    try {
      const response = await fetch(`/api/klijenti/${klijent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...klijent,
          aktivan: !klijent.aktivan,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Uspjeh",
          description: "Status klijenta je ažuriran.",
        })
        fetchKlijenti()
      } else {
        toast({
          title: "Greška",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Greška pri ažuriranju statusa:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške na serveru",
        variant: "destructive",
      })
    }
  }

  const filteredKlijenti = klijenti.filter(
    (k) =>
      k.naziv_firme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.kontakt_osoba && k.kontakt_osoba.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (k.mjesto && k.mjesto.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Klijenti</h1>
            <p className="text-muted-foreground">Upravljanje bazom klijenata</p>
          </div>
          <div className="flex gap-2">
            <ExportImportMenu module="klijenti" onImportComplete={fetchKlijenti} />
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj klijenta
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista klijenata</CardTitle>
                <CardDescription>Svi klijenti kompanije RouteVision</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pretraži..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv firme</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Lokacija</TableHead>
                    <TableHead>Kontakt osoba</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Učitavanje...
                      </TableCell>
                    </TableRow>
                  ) : filteredKlijenti.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Nema podataka
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKlijenti.map((klijent) => (
                      <TableRow key={klijent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {klijent.naziv_firme}
                          </div>
                        </TableCell>
                        <TableCell>{klijent.tip_klijenta || "-"}</TableCell>
                        <TableCell>
                          {klijent.mjesto && klijent.drzava
                            ? `${klijent.mjesto}, ${klijent.drzava}`
                            : klijent.mjesto || klijent.drzava || "-"}
                        </TableCell>
                        <TableCell>{klijent.kontakt_osoba || "-"}</TableCell>
                        <TableCell>{klijent.broj_telefona || "-"}</TableCell>
                        <TableCell>{klijent.email || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={klijent.aktivan ? "default" : "secondary"}>
                              {klijent.aktivan ? "Aktivan" : "Neaktivan"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(klijent)}
                              className="h-7 px-2"
                            >
                              {klijent.aktivan ? "Deaktiviraj" : "Aktiviraj"}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(true, klijent)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedId(klijent.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog za dodavanje/uređivanje */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Uredi" : "Dodaj"} klijenta</DialogTitle>
            <DialogDescription>Popunite formu sa podacima o klijentu</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="naziv_firme">Naziv firme *</Label>
                <Input
                  id="naziv_firme"
                  value={formData.naziv_firme}
                  onChange={(e) => setFormData({ ...formData, naziv_firme: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tip_klijenta">Tip klijenta</Label>
                <Input
                  id="tip_klijenta"
                  value={formData.tip_klijenta}
                  onChange={(e) => setFormData({ ...formData, tip_klijenta: e.target.value })}
                  placeholder="Privatna, Javna, itd."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="adresa">Adresa</Label>
              <Input
                id="adresa"
                value={formData.adresa}
                onChange={(e) => setFormData({ ...formData, adresa: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mjesto">Mjesto</Label>
                <Input
                  id="mjesto"
                  value={formData.mjesto}
                  onChange={(e) => setFormData({ ...formData, mjesto: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postanskiBroj">Poštanski broj</Label>
                <Input
                  id="postanskiBroj"
                  value={formData.postanskiBroj}
                  onChange={(e) => setFormData({ ...formData, postanskiBroj: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="drzava">Država</Label>
                <Input
                  id="drzava"
                  value={formData.drzava}
                  onChange={(e) => setFormData({ ...formData, drzava: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kontakt_osoba">Kontakt osoba</Label>
                <Input
                  id="kontakt_osoba"
                  value={formData.kontakt_osoba}
                  onChange={(e) => setFormData({ ...formData, kontakt_osoba: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="broj_telefona">Broj telefona</Label>
                <Input
                  id="broj_telefona"
                  value={formData.broj_telefona}
                  onChange={(e) => setFormData({ ...formData, broj_telefona: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="broj_faksa">Broj faksa</Label>
                <Input
                  id="broj_faksa"
                  value={formData.broj_faksa}
                  onChange={(e) => setFormData({ ...formData, broj_faksa: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="poreska_broj">Poreski broj</Label>
              <Input
                id="poreska_broj"
                value={formData.poreska_broj}
                onChange={(e) => setFormData({ ...formData, poreska_broj: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="naziv_banke">Naziv banke</Label>
                <Input
                  id="naziv_banke"
                  value={formData.naziv_banke}
                  onChange={(e) => setFormData({ ...formData, naziv_banke: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="racun_broj">Broj računa</Label>
                <Input
                  id="racun_broj"
                  value={formData.racun_broj}
                  onChange={(e) => setFormData({ ...formData, racun_broj: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleSubmit}>{editMode ? "Ažuriraj" : "Kreiraj"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija će deaktivirati klijenta. Možete ga ponovo aktivirati kasnije.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </DashboardLayout>
  )
}
