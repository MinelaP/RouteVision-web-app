"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Plus, Search, Pencil, Trash2, Truck, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

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
  vozac_id: number | null
  vozac_ime: string | null
  vozac_prezime: string | null
  aktivan: boolean
}

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

interface Vozac {
  id: number
  ime: string
  prezime: string
}

export default function VozniParkPage() {
  const { toast } = useToast()
  const [kamioni, setKamioni] = useState<Kamion[]>([])
  const [oprema, setOprema] = useState<Oprema[]>([])
  const [vozaci, setVozaci] = useState<Vozac[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState<"kamioni" | "oprema">("kamioni")
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Form data za kamion
  const [kamionForm, setKamionForm] = useState({
    registarska_tablica: "",
    marka: "",
    model: "",
    godina_proizvodnje: "",
    kapacitet_tone: "",
    vrsta_voza: "",
    stanje_kilometra: "",
    datum_registracije: "",
    datum_zakljucnog_pregleda: "",
    vozac_id: "",
  })

  // Form data za opremu
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
      const [kamionRes, opremaRes, vozacRes] = await Promise.all([
        fetch("/api/vozni-park"),
        fetch("/api/oprema"),
        fetch("/api/osoblje?tip=vozac"),
      ])

      const kamionData = await kamionRes.json()
      const opremaData = await opremaRes.json()
      const vozacData = await vozacRes.json()

      if (kamionData.success) setKamioni(kamionData.data)
      if (opremaData.success) setOprema(opremaData.data)
      if (vozacData.success) setVozaci(vozacData.data)
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

  const handleOpenDialog = (type: "kamioni" | "oprema", edit = false, item?: Kamion | Oprema) => {
    setActiveTab(type)
    setEditMode(edit)

    if (edit && item) {
      setSelectedId(item.id)
      if (type === "kamioni") {
        const k = item as Kamion
        setKamionForm({
          registarska_tablica: k.registarska_tablica,
          marka: k.marka,
          model: k.model,
          godina_proizvodnje: k.godina_proizvodnje?.toString() || "",
          kapacitet_tone: k.kapacitet_tone?.toString() || "",
          vrsta_voza: k.vrsta_voza || "",
          stanje_kilometra: k.stanje_kilometra?.toString() || "",
          datum_registracije: k.datum_registracije || "",
          datum_zakljucnog_pregleda: k.datum_zakljucnog_pregleda || "",
          vozac_id: k.vozac_id?.toString() || "",
        })
      } else {
        const o = item as Oprema
        setOpremaForm({
          naziv: o.naziv,
          vrsta: o.vrsta || "",
          kamion_id: o.kamion_id?.toString() || "",
          kapacitet: o.kapacitet?.toString() || "",
          stanje: o.stanje || "",
          datum_nabavke: o.datum_nabavke || "",
          datum_zadnje_provjere: o.datum_zadnje_provjere || "",
          napomena: o.napomena || "",
        })
      }
    } else {
      setSelectedId(null)
      if (type === "kamioni") {
        setKamionForm({
          registarska_tablica: "",
          marka: "",
          model: "",
          godina_proizvodnje: "",
          kapacitet_tone: "",
          vrsta_voza: "",
          stanje_kilometra: "",
          datum_registracije: "",
          datum_zakljucnog_pregleda: "",
          vozac_id: "",
        })
      } else {
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
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const isKamion = activeTab === "kamioni"
      const url = editMode
        ? `${isKamion ? "/api/vozni-park" : "/api/oprema"}/${selectedId}`
        : isKamion
          ? "/api/vozni-park"
          : "/api/oprema"
      const method = editMode ? "PUT" : "POST"
      const body = isKamion ? kamionForm : opremaForm

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      const url = activeTab === "kamioni" ? `/api/vozni-park/${selectedId}` : `/api/oprema/${selectedId}`

      const response = await fetch(url, {
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

  const filteredKamioni = kamioni.filter(
    (k) =>
      k.registarska_tablica.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.marka.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.model.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredOprema = oprema.filter(
    (o) =>
      o.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.vrsta && o.vrsta.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vozni park</h1>
          <p className="text-muted-foreground">Upravljanje kamionima i opremom</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pregled voznog parka</CardTitle>
                <CardDescription>Kamioni i oprema kompanije RouteVision</CardDescription>
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
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "kamioni" | "oprema")} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="kamioni" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Kamioni ({kamioni.length})
                </TabsTrigger>
                <TabsTrigger value="oprema" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Oprema ({oprema.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kamioni" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenDialog("kamioni")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj kamion
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registarska tablica</TableHead>
                        <TableHead>Marka i model</TableHead>
                        <TableHead>Godina</TableHead>
                        <TableHead>Kapacitet</TableHead>
                        <TableHead>Vrsta</TableHead>
                        <TableHead>Kilometraža</TableHead>
                        <TableHead>Dodijeljeni vozač</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center">
                            Učitavanje...
                          </TableCell>
                        </TableRow>
                      ) : filteredKamioni.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center">
                            Nema podataka
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredKamioni.map((kamion) => (
                          <TableRow key={kamion.id}>
                            <TableCell className="font-medium">{kamion.registarska_tablica}</TableCell>
                            <TableCell>
                              {kamion.marka} {kamion.model}
                            </TableCell>
                            <TableCell>{kamion.godina_proizvodnje || "-"}</TableCell>
                            <TableCell>{kamion.kapacitet_tone ? `${kamion.kapacitet_tone} t` : "-"}</TableCell>
                            <TableCell>{kamion.vrsta_voza || "-"}</TableCell>
                            <TableCell>{kamion.stanje_kilometra?.toLocaleString()} km</TableCell>
                            <TableCell>
                              {kamion.vozac_ime && kamion.vozac_prezime
                                ? `${kamion.vozac_ime} ${kamion.vozac_prezime}`
                                : "Nedodijeljen"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={kamion.aktivan ? "default" : "secondary"}>
                                {kamion.aktivan ? "Aktivan" : "Neaktivan"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDialog("kamioni", true, kamion)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedId(kamion.id)
                                    setActiveTab("kamioni")
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
              </TabsContent>

              <TabsContent value="oprema" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenDialog("oprema")}>
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
                            <TableCell className="font-medium">{o.naziv}</TableCell>
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
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog("oprema", true, o)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedId(o.id)
                                    setActiveTab("oprema")
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialog za dodavanje/uređivanje */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Uredi" : "Dodaj"} {activeTab === "kamioni" ? "kamion" : "opremu"}
            </DialogTitle>
            <DialogDescription>
              Popunite formu za {editMode ? "ažuriranje" : "kreiranje"} {activeTab === "kamioni" ? "kamiona" : "opreme"}
            </DialogDescription>
          </DialogHeader>

          {activeTab === "kamioni" ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="registarska_tablica">Registarska tablica *</Label>
                  <Input
                    id="registarska_tablica"
                    value={kamionForm.registarska_tablica}
                    onChange={(e) => setKamionForm({ ...kamionForm, registarska_tablica: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vrsta_voza">Vrsta voza</Label>
                  <Input
                    id="vrsta_voza"
                    value={kamionForm.vrsta_voza}
                    onChange={(e) => setKamionForm({ ...kamionForm, vrsta_voza: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="marka">Marka *</Label>
                  <Input
                    id="marka"
                    value={kamionForm.marka}
                    onChange={(e) => setKamionForm({ ...kamionForm, marka: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={kamionForm.model}
                    onChange={(e) => setKamionForm({ ...kamionForm, model: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="godina_proizvodnje">Godina proizvodnje</Label>
                  <Input
                    id="godina_proizvodnje"
                    type="number"
                    value={kamionForm.godina_proizvodnje}
                    onChange={(e) => setKamionForm({ ...kamionForm, godina_proizvodnje: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="kapacitet_tone">Kapacitet (t)</Label>
                  <Input
                    id="kapacitet_tone"
                    type="number"
                    step="0.01"
                    value={kamionForm.kapacitet_tone}
                    onChange={(e) => setKamionForm({ ...kamionForm, kapacitet_tone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stanje_kilometra">Kilometraža</Label>
                  <Input
                    id="stanje_kilometra"
                    type="number"
                    value={kamionForm.stanje_kilometra}
                    onChange={(e) => setKamionForm({ ...kamionForm, stanje_kilometra: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="datum_registracije">Datum registracije</Label>
                  <Input
                    id="datum_registracije"
                    type="date"
                    value={kamionForm.datum_registracije}
                    onChange={(e) => setKamionForm({ ...kamionForm, datum_registracije: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="datum_zakljucnog_pregleda">Datum zakl. pregleda</Label>
                  <Input
                    id="datum_zakljucnog_pregleda"
                    type="date"
                    value={kamionForm.datum_zakljucnog_pregleda}
                    onChange={(e) => setKamionForm({ ...kamionForm, datum_zakljucnog_pregleda: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="vozac_id">Dodijeljeni vozač</Label>
                <Select
                  value={kamionForm.vozac_id}
                  onValueChange={(value) => setKamionForm({ ...kamionForm, vozac_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite vozača" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nedodijeljen</SelectItem>
                    {vozaci.map((v) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.ime} {v.prezime}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleSubmit}>{editMode ? "Ažuriraj" : "Kreiraj"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija će deaktivirati {activeTab === "kamioni" ? "kamion" : "opremu"}. Možete ih ponovo aktivirati
              kasnije.
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
