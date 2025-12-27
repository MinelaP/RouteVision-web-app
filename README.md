# RouteVision - Sistem za upravljanje logistikom i transportom

Kompletan web sistem za upravljanje transportnom kompanijom RouteVision.

## Tehnologije

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Baza podataka**: MySQL
- **Autentifikacija**: BCrypt, HTTP-only cookies
- **UI Komponente**: Radix UI, shadcn/ui

## Postavljanje projekta

### 1. Instalacija zavisnosti

```bash
npm install
```

### 2. Postavljanje MySQL baze podataka

U dijelu lib db.ts promjeniti lozinsku sa svojom da bi vam radila baza:


### 3. Pokretanje aplikacije

```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

## Test nalozi

### Administrator
- Email: `marko@routevision.com`
- Lozinka: `admin123`

### Vozač
- Email: `marko.markovic@routevision.com`
- Lozinka: `vozac123`

## Struktura projekta

```
RouteVision/
├── app/                          # Next.js App Router
│   ├── api/                      # API rute
│   │   └── auth/                 # Autentifikacija
│   ├── dashboard/                # Dashboard stranice
│   ├── login/                    # Login stranica
│   └── layout.tsx                # Root layout
├── components/                   # React komponente
│   ├── ui/                       # UI komponente (shadcn/ui)
│   └── dashboard-layout.tsx      # Dashboard layout
├── lib/                          # Pomoćne funkcije
│   ├── db.ts                     # MySQL konekcija
│   ├── auth.ts                   # Auth utilities
│   └── utils.ts                  # Opšte funkcije
├── scripts/                      # SQL skripte
│   ├── 01-create-database-schema.sql
│   └── 02-seed-test-data.sql
└── proxy.ts                      # Middleware za zaštitu ruta
```

## Funkcionalnosti

### Administrator
- Upravljanje osobljem (admini i vozači)
- Upravljanje voznim parkom (kamioni i oprema)
- Upravljanje klijentima i narudžbama
- Kreiranje i praćenje tura
- Upravljanje fakturama i dokumentima
- Servisni dnevnik
- Izvoz podataka (CSV/Excel)

### Vozač
- Pregled trenutnih tura
- Praćenje dodijeljenog kamiona
- Upload dokumentacije (slike, PDF)
- Pregled profila i zarade
- Ažuriranje statusa

## Testiranje API-ja sa Postmanom

### Login
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "marko@routevision.com",
  "password": "admin123",
  "role": "admin"
}
```

### Provjera sesije
```http
GET http://localhost:3000/api/auth/session
```

### Logout
```http
POST http://localhost:3000/api/auth/logout
```

## Razvoj

Projekt koristi MVC arhitekturu:
- **Models**: TypeScript interfejsi i tipovi
- **Views**: React komponente
- **Controllers**: Next.js API rute

Sve poruke i labels su na bosanskom jeziku.
Sva dokumentacija koda je takođe na bosanskom.

## Licenca

Privatni projekt - RouteVision © 2025
