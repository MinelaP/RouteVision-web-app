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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Pencil, Trash2, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Narudba {
  id: number
  broj_narudbe: string
  klijent_id: number
  klijent_naziv: string
  datum_narudbe: string
  datum_isporuke: string
  vrsta_robe: string
  kolicina: number
  jedinica_mjere: string
  lokacija_preuzimanja: string
  lokacija_dostave: string
  napomena: string
  status: string
  aktivan: boolean
}

interface Klijent {
  id: number
  naziv_firme: string
}

export default function NarudzbePage() {
  const { toast } = useToast()
  const [narudzbe, setNarudzbe] = useState<Narudba[]>([])
  const [klijenti, setKlijenti] = useState<Klijent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    broj_narudbe: "",
    klijent_id: "",
    datum_narudbe: "",
    datum_isporuke: "",
    vrsta_robe: "",
    kolicina: "",
    jedinica_mjere: "",
    lokacija_preuzimanja: "",
    lokacija_dostave: "",
    napomena: "",
    status: "Novoprijavljena",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [narudzbeRes, klijentiRes] = await Promise.all([fetch("/api/narudzbe"), fetch("/api/klijenti")])

      const narudzbeData = await narudzbeRes.json()
      const klijentiData = await klijentiRes.json()

      if (narudzbeData.success) setNarudzbe(narudzbeData.data)
      if (klijentiData.success) setKlijenti(klijentiData.data)
    } catch (error) {
      console.error("[v0] Greška pri dohvatanju podataka:", error)
      toast({
        title: "Greška",
        description: "Nije moguće dohvatiti podatke",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (edit = false, item?: Narudba) => {
    setEditMode(edit)
    if (edit && item) {
      setSelectedId(item.id)
      setFormData({
        broj_narudbe: item.broj_narudbe,
        klijent_id: item.klijent_id.toString(),
        datum_narudbe: item.datum_narudbe || "",
        datum_isporuke: item.datum_isporuke || "",
        vrsta_robe: item.vrsta_robe || "",
        kolicina: item.kolicina?.toString() || "",
        jedinica_mjere: item.jedinica_mjere || "",
        lokacija_preuzimanja: item.lokacija_preuzimanja || "",
        lokacija_dostave: item.lokacija_dostave || "",
        napomena: item.napomena || "",
        status: item.status || "Novoprijavljena",
      })
    } else {
      setSelectedId(null)
      setFormData({
        broj_narudbe: "",
        klijent_id: "",
        datum_narudbe: "",
        datum_isporuke: "",
        vrsta_robe: "",
        kolicina: "",
        jedinica_mjere: "",
        lokacija_preuzimanja: "",
        lokacija_dostave: "",
        napomena: "",
        status: "Novoprijavljena",
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editMode ? `/api/narudzbe/${selectedId}` : "/api/narudzbe"
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
        fetchData()
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
      const response = await fetch(`/api/narudzbe/${selectedId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Uspjeh",
          description: data.message,
        })
        setDeleteDialogOpen(false)
        fetchData()
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Završena":
        return "default"
      case "U toku":
        return "secondary"
      case "Novoprijavljena":
        return "outline"
      default:
        return "secondary"
    }
  }

  const filteredNarudzbe = narudzbe.filter(
    (n) =>
      n.broj_narudbe.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.klijent_naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.vrsta_robe && n.vrsta_robe.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Narudžbe</h1>
            <p className="text-muted-foreground">Upravljanje transportnim narudžbama</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj narudžbu
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista narudžbi</CardTitle>
                <CardDescription>Sve narudžbe za transport</CardDescription>
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
                    <TableHead>Broj narudžbe</TableHead>
                    <TableHead>Klijent</TableHead>
                    <TableHead>Vrsta robe</TableHead>
                    <TableHead>Količina</TableHead>
                    <TableHead>Datum narudžbe</TableHead>
                    <TableHead>Datum isporuke</TableHead>
                    <TableHead>Preuzimanje</TableHead>
                    <TableHead>Dostava</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        Učitavanje...
                      </TableCell>
                    </TableRow>
                  ) : filteredNarudzbe.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        Nema podataka
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNarudzbe.map((narudba) => (
                      <TableRow key={narudba.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            {narudba.broj_narudbe}
                          </div>
                        </TableCell>
                        <TableCell>{narudba.klijent_naziv}</TableCell>
                        <TableCell>{narudba.vrsta_robe || "-"}</TableCell>
                        <TableCell>
                          {narudba.kolicina ? `${narudba.kolicina} ${narudba.jedinica_mjere || ""}` : "-"}
                        </TableCell>
                        <TableCell>
                          {narudba.datum_narudbe ? new Date(narudba.datum_narudbe).toLocaleDateString("bs-BA") : "-"}
                        </TableCell>
                        <TableCell>
                          {narudba.datum_isporuke ? new Date(narudba.datum_isporuke).toLocaleDateString("bs-BA") : "-"}
                        </TableCell>
                        <TableCell>{narudba.lokacija_preuzimanja || "-"}</TableCell>
                        <TableCell>{narudba.lokacija_dostave || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(narudba.status)}>{narudba.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(true, narudba)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedId(narudba.id)
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
            <DialogTitle>{editMode ? "Uredi" : "Dodaj"} narudžbu</DialogTitle>
            <DialogDescription>Popunite formu sa podacima o narudžbi</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="broj_narudbe">Broj narudžbe *</Label>
                <Input
                  id="broj_narudbe"
                  value={formData.broj_narudbe}
                  onChange={(e) => setFormData({ ...formData, broj_narudbe: e.target.value })}
                  placeholder="ORD-2024-001"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="klijent_id">Klijent *</Label>
                <Select
                  value={formData.klijent_id}
                  onValueChange={(value) => setFormData({ ...formData, klijent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite klijenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {klijenti.map((k) => (
                      <SelectItem key={k.id} value={k.id.toString()}>
                        {k.naziv_firme}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="datum_narudbe">Datum narudžbe</Label>
                <Input
                  id="datum_narudbe"
                  type="date"
                  value={formData.datum_narudbe}
                  onChange={(e) => setFormData({ ...formData, datum_narudbe: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="datum_isporuke">Datum isporuke</Label>
                <Input
                  id="datum_isporuke"
                  type="date"
                  value={formData.datum_isporuke}
                  onChange={(e) => setFormData({ ...formData, datum_isporuke: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vrsta_robe">Vrsta robe</Label>
              <Input
                id="vrsta_robe"
                value={formData.vrsta_robe}
                onChange={(e) => setFormData({ ...formData, vrsta_robe: e.target.value })}
                placeholder="Elektronika, Hrana, Materijal..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kolicina">Količina</Label>
                <Input
                  id="kolicina"
                  type="number"
                  step="0.01"
                  value={formData.kolicina}
                  onChange={(e) => setFormData({ ...formData, kolicina: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jedinica_mjere">Jedinica mjere</Label>
                <Select
                  value={formData.jedinica_mjere}
                  onValueChange={(value) => setFormData({ ...formData, jedinica_mjere: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite jedinicu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kom">kom</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="tona">tona</SelectItem>
                    <SelectItem value="m³">m³</SelectItem>
                    <SelectItem value="paleta">paleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="lokacija_preuzimanja">Lokacija preuzimanja</Label>
                <Input
                  id="lokacija_preuzimanja"
                  value={formData.lokacija_preuzimanja}
                  onChange={(e) => setFormData({ ...formData, lokacija_preuzimanja: e.target.value })}
                  placeholder="Grad, Adresa"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lokacija_dostave">Lokacija dostave</Label>
                <Input
                  id="lokacija_dostave"
                  value={formData.lokacija_dostave}
                  onChange={(e) => setFormData({ ...formData, lokacija_dostave: e.target.value })}
                  placeholder="Grad, Adresa"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novoprijavljena">Novoprijavljena</SelectItem>
                  <SelectItem value="U toku">U toku</SelectItem>
                  <SelectItem value="Završena">Završena</SelectItem>
                  <SelectItem value="Otkazana">Otkazana</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="napomena">Napomena</Label>
              <Textarea
                id="napomena"
                value={formData.napomena}
                onChange={(e) => setFormData({ ...formData, napomena: e.target.value })}
                rows={3}
                placeholder="Dodatne informacije o narudžbi..."
              />
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
              Ova akcija će deaktivirati narudžbu. Možete je ponovo aktivirati kasnije.
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
