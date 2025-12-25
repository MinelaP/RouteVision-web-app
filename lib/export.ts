// Utility funkcije za export/import podataka

export function exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
        alert("Nema podataka za export")
        return
    }


    const headers = Object.keys(data[0])


    const csvContent = [
        headers.join(","), // Zaglavlje
        ...data.map((row) =>
            headers
                .map((header) => {
                    const cell = row[header]
                    // Eskejpuj vrijednosti koje sadrže zareze ili navodnike
                    if (cell === null || cell === undefined) return ""
                    const cellStr = String(cell)
                    if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
                        return `"${cellStr.replace(/"/g, '""')}"`
                    }
                    return cellStr
                })
                .join(","),
        ),
    ].join("\n")


    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }) // \uFEFF je BOM za UTF-8
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export function parseCSV(csvText: string): any[] {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "")

    if (lines.length < 2) {
        throw new Error("CSV mora sadržavati zaglavlje i najmanje jedan red podataka")
    }

    const headers = lines[0].split(",").map((h) => h.trim())
    const data: any[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
        const row: any = {}

        headers.forEach((header, index) => {
            row[header] = values[index] || null
        })

        data.push(row)
    }

    return data
}
