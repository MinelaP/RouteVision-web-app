"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, Upload, FileSpreadsheet } from "lucide-react"
import { exportToCSV, parseCSV } from "@/lib/export"
import { useRef } from "react"

interface ExportImportMenuProps {
    module: "klijenti" | "servisi" | "gorivo" | "fakture"
    onImportComplete?: () => void
}

export function ExportImportMenu({ module, onImportComplete }: ExportImportMenuProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        try {
            const response = await fetch(`/api/export/${module}`)
            if (response.ok) {
                const data = await response.json()
                exportToCSV(data, module)
            } else {
                alert("Greška pri exportu podataka")
            }
        } catch (error) {
            console.error("Greška pri exportu:", error)
            alert("Greška pri exportu podataka")
        }
    }

    const handleImport = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const text = await file.text()
            const data = parseCSV(text)

            const response = await fetch(`/api/import/${module}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [module]: data }),
            })

            if (response.ok) {
                const result = await response.json()
                alert(result.message)
                onImportComplete?.()
            } else {
                const error = await response.json()
                alert(error.error || "Greška pri importu")
            }
        } catch (error) {
            console.error("Greška pri importu:", error)
            alert("Greška pri importu podataka. Provjerite format CSV fajla.")
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Export/Import
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Podatci</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export u CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleImport}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import iz CSV
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        </>
    )
}
