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
import { Plus, Search, Pencil, Trash2, UserCog, TruckIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

interface Admin {
  id: number
  ime: string
  prezime: string
  email: string
  broj_telefona: string | null
  datum_kreiranja: string
  aktivan: boolean
}

interface Vozac {
  id: number
  ime: string
  prezime: string
  email: string
  broj_telefona: string | null
  broj_vozacke_dozvole: string | null
  kategorija_dozvole: string | null
  datum_zaposlenja: string | null
  plata: number | null
  broj_dovrsenih_tura: number
  stanje_racuna: number
  aktivan: boolean
  datum_kreiranja: string
}

type FormData = {
  tip: "admin" | "vozac"
  ime: string
  prezime: string
  email: string
  lozinka: string
  broj_telefona: string
  broj_vozacke_dozvole?: string
  kategorija_dozvole?: string
  datum_zaposlenja?: string
  plata?: string
}

export default function OsobljePage() {
  const { toast } = useToast()
  const [admini, setAdmini] = useState<Admin[]>([])
  const [vozaci, setVozaci] = useState<Vozac[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<"admin" | "vozac" | null>(null)
  const [formData, setFormData] = useState<FormData>({
    tip: "admin",
    ime: "",
    prezime: "",
    email: "",
    lozinka: "",
    broj_telefona: "",
  })

  useEffect(() => {
    fetchOsoblje()
  }, [])

  const fetchOsoblje = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/osoblje")
      const data = await response.json()

      if (data.success) {
        setAdmini(data.data.admini)
        setVozaci(data.data.vozaci)
      }
    } catch (error) {
      console.error("[v0] Greška pri dohvatanju osoblja:", error)
      toast({
        title: "Greška",
        description: "Nije moguće dohvatiti podatke o osoblju",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (tip: "admin" | "vozac", edit = false, item?: Admin | Vozac) => {
    setEditMode(edit)
    if (edit && item) {
      setSelectedId(item.id)
      setSelectedType(tip)
      setFormData({
        tip,
        ime: item.ime,
        prezime: item.prezime,
        email: item.email,
        lozinka: "",
        broj_telefona: item.broj_telefona || "",
        ...(tip === "vozac" && {
          broj_vozacke_dozvole: (item as Vozac).broj_vozacke_dozvole || "",
          kategorija_dozvole: (item as Vozac).kategorija_dozvole || "",
          datum_zaposlenja: (item as Vozac).datum_zaposlenja || "",
          plata: (item as Vozac).plata?.toString() || "",
        }),
      })
    } else {
      setSelectedId(null)
      setSelectedType(null)
      setFormData({
        tip,
        ime: "",
        prezime: "",
        email: "",
        lozinka: "",
        broj_telefona: "",
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const url = editMode ? `/api/osoblje/${selectedId}?tip=${selectedType}` : "/api/osoblje"
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
        fetchOsoblje()
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
    if (!selectedId || !selectedType) return

    try {
      const response = await fetch(`/api/osoblje/${selectedId}?tip=${selectedType}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Uspjeh",
          description: data.message,
        })
        setDeleteDialogOpen(false)
        fetchOsoblje()
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

  const filteredAdmini = admini.filter(
    (admin) =>
      admin.ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredVozaci = vozaci.filter(
    (vozac) =>
      vozac.ime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vozac.prezime.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vozac.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Upravljanje osobljem</h1>
            <p className="text-muted-foreground">Pregled i upravljanje administratorima i vozačima</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista osoblja</CardTitle>
                <CardDescription>Svi članovi tima u sistemu RouteVision</CardDescription>
              </div>
              <div className="flex gap-2">
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
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vozaci" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="vozaci" className="flex items-center gap-2">
                  <TruckIcon className="h-4 w-4" />
                  Vozači ({vozaci.length})
                </TabsTrigger>
                <TabsTrigger value="admini" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Administratori ({admini.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vozaci" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenDialog("vozac")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj vozača
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ime i prezime</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Dozvola</TableHead>
                        <TableHead>Datum zaposlenja</TableHead>
                        <TableHead>Plata (KM)</TableHead>
                        <TableHead>Dovršene ture</TableHead>
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
                      ) : filteredVozaci.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center">
                            Nema podataka
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredVozaci.map((vozac) => (
                          <TableRow key={vozac.id}>
                            <TableCell className="font-medium">
                              {vozac.ime} {vozac.prezime}
                            </TableCell>
                            <TableCell>{vozac.email}</TableCell>
                            <TableCell>{vozac.broj_telefona || "-"}</TableCell>
                            <TableCell>
                              {vozac.broj_vozacke_dozvole || "-"}
                              {vozac.kategorija_dozvole && ` (${vozac.kategorija_dozvole})`}
                            </TableCell>
                            <TableCell>
                              {vozac.datum_zaposlenja
                                ? new Date(vozac.datum_zaposlenja).toLocaleDateString("bs-BA")
                                : "-"}
                            </TableCell>
                            <TableCell>{vozac.plata?.toFixed(2) || "-"}</TableCell>
                            <TableCell>{vozac.broj_dovrsenih_tura}</TableCell>
                            <TableCell>
                              <Badge variant={vozac.aktivan ? "default" : "secondary"}>
                                {vozac.aktivan ? "Aktivan" : "Neaktivan"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDialog("vozac", true, vozac)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedId(vozac.id)
                                    setSelectedType("vozac")
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

              <TabsContent value="admini" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenDialog("admin")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj administratora
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ime i prezime</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Datum kreiranja</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Akcije</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            Učitavanje...
                          </TableCell>
                        </TableRow>
                      ) : filteredAdmini.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            Nema podataka
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAdmini.map((admin) => (
                          <TableRow key={admin.id}>
                            <TableCell className="font-medium">
                              {admin.ime} {admin.prezime}
                            </TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>{admin.broj_telefona || "-"}</TableCell>
                            <TableCell>{new Date(admin.datum_kreiranja).toLocaleDateString("bs-BA")}</TableCell>
                            <TableCell>
                              <Badge variant={admin.aktivan ? "default" : "secondary"}>
                                {admin.aktivan ? "Aktivan" : "Neaktivan"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDialog("admin", true, admin)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedId(admin.id)
                                    setSelectedType("admin")
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Uredi" : "Dodaj"} {formData.tip === "admin" ? "administratora" : "vozača"}
            </DialogTitle>
            <DialogDescription>
              Popunite formu za {editMode ? "ažuriranje" : "kreiranje"}{" "}
              {formData.tip === "admin" ? "administratora" : "vozača"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {!editMode && (
              <div className="grid gap-2">
                <Label htmlFor="tip">Tip</Label>
                <Select
                  value={formData.tip}
                  onValueChange={(value: "admin" | "vozac") => setFormData({ ...formData, tip: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="vozac">Vozač</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ime">Ime *</Label>
                <Input
                  id="ime"
                  value={formData.ime}
                  onChange={(e) => setFormData({ ...formData, ime: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prezime">Prezime *</Label>
                <Input
                  id="prezime"
                  value={formData.prezime}
                  onChange={(e) => setFormData({ ...formData, prezime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lozinka">
                Lozinka {editMode && "(ostavite prazno ako ne mijenjate)"}
                {!editMode && " *"}
              </Label>
              <Input
                id="lozinka"
                type="password"
                value={formData.lozinka}
                onChange={(e) => setFormData({ ...formData, lozinka: e.target.value })}
                required={!editMode}
                placeholder="Min. 8 karaktera, jedno veliko slovo, jedan broj"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="broj_telefona">Broj telefona</Label>
              <Input
                id="broj_telefona"
                value={formData.broj_telefona}
                onChange={(e) => setFormData({ ...formData, broj_telefona: e.target.value })}
                placeholder="+387 XX XXX XXX"
              />
            </div>

            {formData.tip === "vozac" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="broj_vozacke_dozvole">Broj vozačke dozvole</Label>
                    <Input
                      id="broj_vozacke_dozvole"
                      value={formData.broj_vozacke_dozvole}
                      onChange={(e) => setFormData({ ...formData, broj_vozacke_dozvole: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="kategorija_dozvole">Kategorija</Label>
                    <Input
                      id="kategorija_dozvole"
                      value={formData.kategorija_dozvole}
                      onChange={(e) => setFormData({ ...formData, kategorija_dozvole: e.target.value })}
                      placeholder="C, C+E, itd."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="datum_zaposlenja">Datum zaposlenja</Label>
                    <Input
                      id="datum_zaposlenja"
                      type="date"
                      value={formData.datum_zaposlenja}
                      onChange={(e) => setFormData({ ...formData, datum_zaposlenja: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plata">Plata (KM)</Label>
                    <Input
                      id="plata"
                      type="number"
                      step="0.01"
                      value={formData.plata}
                      onChange={(e) => setFormData({ ...formData, plata: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleSubmit}>{editMode ? "Ažuriraj" : "Kreiraj"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog za brisanje */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija će deaktivirati {selectedType === "admin" ? "administratora" : "vozača"}. Možete ih ponovo
              aktivirati kasnije.
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
