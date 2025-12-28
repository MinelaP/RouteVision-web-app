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
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Oprema {
  id: number
  naziv: string
  vrsta: string
  kamion_id: number | null
  kamion_tablica: string | null
  kapacitet: number
  stanje: string
  datum_nabavke: string
  datum_zadnje_provjere: string
  napomena: string
  aktivan: boolean
}

interface Kamion {
  id: number
  registarska_tablica: string
  marka: string
  model: string
}

export default function OpremaPage() {
  const { toast } = useToast()
  const [oprema, setOprema] = useState<Oprema[]>([])
  const [kamioni, setKamioni] = useState<Kamion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const [opremaForm, setOpremaForm] = useState({
    naziv: "",
    vrsta: "",
    kamion_id: "",
    kapacitet: "",
    stanje: "",
    datum_nabavke: "",
    datum_zadnje_provjere: "",
    napomena: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [opremaRes, kamionRes] = await Promise.all([fetch("/api/oprema"), fetch("/api/vozni-park")])

      const opremaData = await opremaRes.json()
      const kamionData = await kamionRes.json()

      if (opremaData.success) setOprema(opremaData.data)
      if (kamionData.success) setKamioni(kamionData.data)
    } catch (error) {
      console.error("[v0] Greška pri dohvatanju opreme:", error)
      toast({
        title: "Greška",
        description: "Nije moguće dohvatiti podatke",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (edit = false, item?: Oprema) => {
    setEditMode(edit)

    if (edit && item) {
      setSelectedId(item.id)
      setOpremaForm({
        naziv: item.naziv,
        vrsta: item.vrsta || "",
        kamion_id: item.kamion_id?.toString() || "",
        kapacitet: item.kapacitet?.toString() || "",
        stanje: item.stanje || "",
        datum_nabavke: item.datum_nabavke || "",
        datum_zadnje_provjere: item.datum_zadnje_provjere || "",
        napomena: item.napomena || "",
      })
    } else {
      setSelectedId(null)
      setOpremaForm({
        naziv: "",
        vrsta: "",
        kamion_id: "",
        kapacitet: "",
        stanje: "",
        datum_nabavke: "",
        datum_zadnje_provjere: "",
        napomena: "",
      })
    }

    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editMode ? `/api/oprema/${selectedId}` : "/api/oprema"
      const method = editMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opremaForm),
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
      const response = await fetch(`/api/oprema/${selectedId}`, {
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

  const filteredOprema = oprema.filter(
    (o) =>
      o.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.vrsta && o.vrsta.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Oprema</h1>
          <p className="text-muted-foreground">Upravljanje opremom kompanije RouteVision</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista opreme</CardTitle>
                <CardDescription>Sva oprema u voznom parku</CardDescription>
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
            <div className="flex justify-end mb-4">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj opremu
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naziv</TableHead>
                    <TableHead>Vrsta</TableHead>
                    <TableHead>Kamion</TableHead>
                    <TableHead>Kapacitet</TableHead>
                    <TableHead>Stanje</TableHead>
                    <TableHead>Datum nabavke</TableHead>
                    <TableHead>Posljednja provjera</TableHead>
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
                  ) : filteredOprema.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Nema podataka
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOprema.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {o.naziv}
                          </div>
                        </TableCell>
                        <TableCell>{o.vrsta || "-"}</TableCell>
                        <TableCell>{o.kamion_tablica || "Nedodijeljeno"}</TableCell>
                        <TableCell>{o.kapacitet || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              o.stanje === "Odličan"
                                ? "default"
                                : o.stanje === "Dobar"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {o.stanje || "Nepoznato"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {o.datum_nabavke ? new Date(o.datum_nabavke).toLocaleDateString("bs-BA") : "-"}
                        </TableCell>
                        <TableCell>
                          {o.datum_zadnje_provjere
                            ? new Date(o.datum_zadnje_provjere).toLocaleDateString("bs-BA")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(true, o)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedId(o.id)
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? "Uredi" : "Dodaj"} opremu</DialogTitle>
            <DialogDescription>Popunite formu za {editMode ? "ažuriranje" : "kreiranje"} opreme</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="naziv">Naziv *</Label>
              <Input
                id="naziv"
                value={opremaForm.naziv}
                onChange={(e) => setOpremaForm({ ...opremaForm, naziv: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vrsta">Vrsta</Label>
                <Input
                  id="vrsta"
                  value={opremaForm.vrsta}
                  onChange={(e) => setOpremaForm({ ...opremaForm, vrsta: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kapacitet">Kapacitet</Label>
                <Input
                  id="kapacitet"
                  type="number"
                  step="0.01"
                  value={opremaForm.kapacitet}
                  onChange={(e) => setOpremaForm({ ...opremaForm, kapacitet: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kamion_id">Dodijeljeno kamion</Label>
                <Select
                  value={opremaForm.kamion_id}
                  onValueChange={(value) => setOpremaForm({ ...opremaForm, kamion_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite kamion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nedodijeljeno</SelectItem>
                    {kamioni.map((k) => (
                      <SelectItem key={k.id} value={k.id.toString()}>
                        {k.registarska_tablica} - {k.marka} {k.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stanje">Stanje</Label>
                <Select
                  value={opremaForm.stanje}
                  onValueChange={(value) => setOpremaForm({ ...opremaForm, stanje: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite stanje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Odličan">Odličan</SelectItem>
                    <SelectItem value="Dobar">Dobar</SelectItem>
                    <SelectItem value="Zadovoljavajući">Zadovoljavajući</SelectItem>
                    <SelectItem value="Loš">Loš</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="datum_nabavke">Datum nabavke</Label>
                <Input
                  id="datum_nabavke"
                  type="date"
                  value={opremaForm.datum_nabavke}
                  onChange={(e) => setOpremaForm({ ...opremaForm, datum_nabavke: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="datum_zadnje_provjere">Posljednja provjera</Label>
                <Input
                  id="datum_zadnje_provjere"
                  type="date"
                  value={opremaForm.datum_zadnje_provjere}
                  onChange={(e) => setOpremaForm({ ...opremaForm, datum_zadnje_provjere: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="napomena">Napomena</Label>
              <Textarea
                id="napomena"
                value={opremaForm.napomena}
                onChange={(e) => setOpremaForm({ ...opremaForm, napomena: e.target.value })}
                rows={3}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija će deaktivirati opremu. Možete je ponovo aktivirati kasnije.
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
