-- baza Database Schema
-- Create baza Database and Schema
DROP DATABASE IF EXISTS baza;
CREATE DATABASE baza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE baza;

-- Admin Table
CREATE TABLE admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ime VARCHAR(100) NOT NULL,
    prezime VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    lozinka VARCHAR(255) NOT NULL,
    broj_telefona VARCHAR(20),
    datum_zaposlenja DATE,
    plata DECIMAL(10,2),
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aktivan BOOLEAN DEFAULT TRUE
);
-- Kamion (Truck) Table
CREATE TABLE kamion (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registarska_tablica VARCHAR(20) NOT NULL UNIQUE,
    marka VARCHAR(100),
    ime_vozaca VARCHAR(100),      
    prezime_vozaca VARCHAR(100),
    model VARCHAR(100),
    godina_proizvodnje INT,
    kapacitet_tone DECIMAL(8,2),
    vrsta_voza VARCHAR(100),
    stanje_kilometra INT DEFAULT 0,
    datum_registracije DATE,
    datum_zakljucnog_pregleda DATE,
    zaduzeni_vozac_id INT NULL,
    aktivan BOOLEAN DEFAULT TRUE,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Oprema (Equipment) Table
CREATE TABLE oprema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    naziv VARCHAR(150) NOT NULL,
    vrsta VARCHAR(100),
    kamion_id INT,
    kapacitet DECIMAL(10,2),
    stanje VARCHAR(50),
    datum_nabavke DATE,
    datum_zadnje_provjere DATE,
    napomena TEXT,
    aktivan BOOLEAN DEFAULT TRUE,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kamion_id) REFERENCES kamion(id) ON DELETE SET NULL
);
-- Vozač (Driver) Table
CREATE TABLE vozac (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ime VARCHAR(100) NOT NULL,
    prezime VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    lozinka VARCHAR(255) NOT NULL,
    broj_telefona VARCHAR(20),
    marka_kamiona VARCHAR(100),
    trenutna_kilometraza INT DEFAULT 0,
    tip_goriva VARCHAR(50),
    broj_vozacke_dozvole VARCHAR(50) UNIQUE,
    kategorija_dozvole VARCHAR(50),
    datum_zaposlenja DATE,
    plata DECIMAL(10,2),
    broj_dovrsenih_tura INT DEFAULT 0, 
    aktivan BOOLEAN DEFAULT TRUE,
    kamion_id INT NULL, -- DODIJELJEN KAMION
    oprema_id INT NULL, -- DODIJELJENA PRIKOLICA/OPREMA
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kamion_id) REFERENCES kamion(id) ON DELETE SET NULL,
    FOREIGN KEY (oprema_id) REFERENCES oprema(id) ON DELETE SET NULL
);

ALTER TABLE kamion ADD CONSTRAINT fk_kamion_vozac FOREIGN KEY (zaduzeni_vozac_id) REFERENCES vozac(id);

-- Klijent (Client) Table

CREATE TABLE klijent (
    id INT PRIMARY KEY AUTO_INCREMENT,
    naziv_firme VARCHAR(150) NOT NULL UNIQUE,
    tip_klijenta VARCHAR(50),
    adresa VARCHAR(255),
    mjesto VARCHAR(100),
    postanskiBroj VARCHAR(10),
    drzava VARCHAR(100),
    kontakt_osoba VARCHAR(150),
    email VARCHAR(150),
    broj_telefona VARCHAR(20),
    broj_faksa VARCHAR(20),
    poreska_broj VARCHAR(50) UNIQUE,
    naziv_banke VARCHAR(100),
    racun_broj VARCHAR(50),
    ukupna_narudena_kolicina DECIMAL(15,2) DEFAULT 0,
    ukupno_placeno DECIMAL(15,2) DEFAULT 0,
    aktivan BOOLEAN DEFAULT TRUE,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Narudžba (Order) Table
CREATE TABLE narudzba (
    id INT PRIMARY KEY AUTO_INCREMENT,
    broj_narudzbe VARCHAR(50) NOT NULL UNIQUE,
    klijent_id INT NOT NULL,
    datum_narudzbe DATE,
    datum_isporuke DATE,
    vrsta_robe VARCHAR(50),
    kolicina DECIMAL(10,2),
    jedinica_mjere VARCHAR(20),
    lokacija_preuzimanja VARCHAR(255),
    lokacija_dostave VARCHAR(255),
    napomena TEXT,
    status VARCHAR(50) DEFAULT 'Novoprijavljena',
    aktivan BOOLEAN DEFAULT TRUE,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (klijent_id) REFERENCES klijent(id) ON DELETE CASCADE
);
-- Putovanje (Trip) Table
CREATE TABLE tura (
    id INT PRIMARY KEY AUTO_INCREMENT,
    broj_ture VARCHAR(50) NOT NULL UNIQUE,
    vozac_id INT NOT NULL,
    kamion_id INT NOT NULL,
    narudzba_id INT NOT NULL,
    datum_pocetka DATE,
    vrijeme_pocetka TIME,
    datum_kraja DATE,
    vrijeme_kraja TIME,
    lokacija_pocetka VARCHAR(255),
    kreirao_korisnik VARCHAR(100), 
    nadlezni_admin_id INT,
    lokacija_kraja VARCHAR(255),
    prijedeni_kilometri INT,
    prosjecna_brzina INT,
    spent_fuel DECIMAL(8,2),
    fuel_used DECIMAL(8,2),
    napomena TEXT,
    status VARCHAR(50) DEFAULT 'U toku',
    aktivan BOOLEAN DEFAULT TRUE,
    kreirao_admin_id INT NULL,
    kreirao_vozac_id INT NULL,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tura_admin FOREIGN KEY (kreirao_admin_id) REFERENCES admin(id),
    CONSTRAINT fk_tura_vozac_kreator FOREIGN KEY (kreirao_vozac_id) REFERENCES vozac(id),
    FOREIGN KEY (vozac_id) REFERENCES vozac(id) ON DELETE CASCADE,
    FOREIGN KEY (kamion_id) REFERENCES kamion(id) ON DELETE CASCADE,
    FOREIGN KEY (narudzba_id) REFERENCES narudzba(id) ON DELETE CASCADE
);

-- Račun (Invoice) Table
CREATE TABLE fakture (
    id INT PRIMARY KEY AUTO_INCREMENT,
    broj_fakture VARCHAR(50) NOT NULL UNIQUE,
    tura_id INT NOT NULL,
    klijent_id INT NOT NULL,
    datum_izdavanja DATE,
    odobrio_admin_id INT,
    datum_dospjeća DATE,
    vrsta_usluge VARCHAR(150),
    cijena_po_km DECIMAL(8,2),
    broj_km INT,
    iznos_usluge DECIMAL(10,2),
    porez DECIMAL(10,2),
    ukupan_iznos DECIMAL(10,2),
    status_placanja VARCHAR(50) DEFAULT 'Neplačeno',
    nacin_placanja VARCHAR(50),
    datum_placanja DATE,
    napomena TEXT,
    datoteka_path VARCHAR(255),
    aktivan BOOLEAN DEFAULT TRUE,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tura_id) REFERENCES tura(id) ON DELETE CASCADE,
    FOREIGN KEY (klijent_id) REFERENCES klijent(id) ON DELETE CASCADE
);

-- Servisni dnevnik (Service Log) Table
CREATE TABLE servisni_dnevnik (
    id INT PRIMARY KEY AUTO_INCREMENT,
    kamion_id INT NOT NULL,
    vozac_id INT,
    datum_servisa DATE,
    vrsta_servisa VARCHAR(150),
    opisServisa TEXT,
    kreirao_korisnik VARCHAR(100), 
    nadlezni_admin_id INT,
    km_na_servisu INT,
    troskovi DECIMAL(10,2),
    serviser_naziv VARCHAR(150),
    napomena TEXT,
    datoteka_path VARCHAR(255),
    aktivan BOOLEAN DEFAULT TRUE,
    datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nadlezni_admin_id) REFERENCES admin(id),
    FOREIGN KEY (kamion_id) REFERENCES kamion(id) ON DELETE CASCADE,
    FOREIGN KEY (vozac_id) REFERENCES vozac(id) ON DELETE SET NULL
);
-- Dokumenti (Dokumenti)
DROP TABLE IF EXISTS dokument;
CREATE TABLE dokument (
 id INT AUTO_INCREMENT PRIMARY KEY,
 vezano_za VARCHAR(50), -- npr. 'vozac', 'kamion', 'oprema', 'klijent', 'tura'
  vezani_id INT NULL,
  putanja_datoteke VARCHAR(255),
  uploadao_admin_id INT NULL,
  uploadao_vozac_id INT NULL,
  tip_dokumenta VARCHAR(50), -- npr. 'licenca', 'registracija', 'ugovor', 'faktura_kopija'
  datum_izdavanja DATE,
  datum_isteka DATE,
 datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (uploadao_admin_id) REFERENCES admin(id) ON DELETE SET NULL,
 FOREIGN KEY (uploadao_vozac_id) REFERENCES vozac(id) ON DELETE SET NULL
);

-- Dnevnici Aktivnosti (Dnevnici_Aktivnosti)
DROP TABLE IF EXISTS dnevnik_aktivnosti;
CREATE TABLE dnevnik_aktivnosti (
 id INT AUTO_INCREMENT PRIMARY KEY,
 admin_id INT NULL,
 akcija VARCHAR(255), -- npr. 'Kreiran novi vozac', 'Izmijenjena faktura'
 entitet VARCHAR(50), -- npr. 'Vozac', 'Faktura', 'Kamion'
 entitet_id INT,
 timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL
);

-- Create Indexes for Performance
CREATE INDEX idx_vozac_email ON vozac(email);
CREATE INDEX idx_admin_email ON admin(email);
CREATE INDEX idx_klijent_naziv ON klijent(naziv_firme);
CREATE INDEX idx_tura_vozac ON tura(vozac_id); -- AŽURIRANO
CREATE INDEX idx_tura_kamion ON tura(kamion_id); -- AŽURIRANO
CREATE INDEX idx_narudzba_klijent ON narudzba(klijent_id);
CREATE INDEX idx_fakture_tura ON fakture(tura_id); -- AŽURIRANO
CREATE INDEX idx_evidencija_servisa_kamion ON servisni_dnevnik(kamion_id);

USE baza;
-- Admin Test Users
-- Password: admin123 (BCrypt hash with LOG_ROUNDS = 12)
-- Hash:$2a$12$dCj/vd.J.mmqWV6uqoIVye7IUeq0iF9hGozoNi./O3KDqRUGFfE6O

INSERT INTO admin (id, ime, prezime, email, lozinka, broj_telefona, datum_zaposlenja, plata, datum_kreiranja, aktivan) VALUES
(1, 'Marko', 'Administrator', 'marko@routevision.com', 'hash123', '+387 1 234 5678', '2023-01-01', 2500.00, NOW(), TRUE),
(2, 'Ana', 'Šef', 'ana.sef@routevision.com', 'hash123', '+387 1 234 5679', '2023-02-01', 2800.00, NOW(), TRUE),
(3, 'Anesa', 'Admin', 'anesa@routevision.com', 'hash123', '+387 61 000 001', '2023-03-01', 2200.00, NOW(), TRUE),
(4, 'Minela', 'Admin', 'minela@routevision.com', 'hash123', '+387 61 000 002', '2023-04-01', 2200.00, NOW(), TRUE),
(5, 'Amar', 'Hodžić', 'amar.hodzic@routevision.com', 'hash123', '+387 61 555 666', '2024-01-10', 2300.00, NOW(), TRUE),
(6, 'Elena', 'Babić', 'elena.babic@routevision.com', 'hash123', '+387 61 777 888', '2024-02-15', 2300.00, NOW(), TRUE);

INSERT INTO klijent (id, naziv_firme, tip_klijenta, adresa, mjesto, postanskiBroj, drzava, kontakt_osoba, email, broj_telefona, broj_faksa, poreska_broj, naziv_banke, racun_broj, ukupna_narudena_kolicina, ukupno_placeno, aktivan, datum_kreiranja) VALUES
(1, 'Adriatic Trade Ltd', 'Privatna', 'Ulica Svetog Save 25', 'Sarajevo', '71000', 'BiH', 'Fahrudin Abdić', 'info@adriatic.ba', '033123456', '033123457', '420000000001', 'UniCredit', '101000', 500.00, 1140.75, TRUE, NOW()),
(2, 'Balkan Foods Export', 'Privatna', 'Industrijska 15', 'Pale', '71410', 'BiH', 'Mirna Adamović', 'contact@balkan.ba', '057234567', NULL, '420000000002', 'Raiffeisen', '202000', 5500.00, 0.00, TRUE, NOW()),
(3, 'Slovenija Logistika', 'Inostrana', 'Cesta Svobode 42', 'Ljubljana', '1000', 'Slovenija', 'Jovan Novak', 'log@slovenija.si', '+3861456', NULL, 'SI999999', 'NLB', '303000', 32.50, 1123.20, TRUE, NOW()),
(4, 'Import Export Centar', 'Privatna', 'Trgovska 8', 'Beograd', '11000', 'Srbija', 'Vesna Nikolić', 'office@import.rs', '+38111567', NULL, '100000001', 'Komercijalna', '404000', 30025.00, 0.00, TRUE, NOW()),
(5, 'Euro Express d.o.o.', 'Logistika', 'Banjalučka bb', 'Banja Luka', '78000', 'BiH', 'Dragan Marić', 'dragan@euroexpress.ba', '051333444', '051333445', '440000000005', 'Nova Banka', '555000', 0.00, 0.00, TRUE, NOW()),
(6, 'AustroTherm GmbH', 'Proizvodnja', 'Wiener Strasse 10', 'Beč', '1010', 'Austrija', 'Hans Muller', 'sales@austrotherm.at', '+431999888', NULL, 'ATU1234567', 'Erste Bank', '666000', 0.00, 0.00, TRUE, NOW());

-- KAMIONI (4 regularna + 2 nova regularna + 2 bez vozača = 8)
-- Napomena: zaduzeni_vozac_id ostavljamo NULL dok ne unesemo vozače
INSERT INTO kamion (id, registarska_tablica, marka, model, godina_proizvodnje, kapacitet_tone, vrsta_voza, stanje_kilometra, datum_registracije, datum_zakljucnog_pregleda, zaduzeni_vozac_id, ime_vozaca, prezime_vozaca, aktivan, datum_kreiranja) VALUES
(1, 'BJ-001-AB', 'Volvo', 'FH16', 2022, 25.0, 'Tegljač', 45000, '2024-03-10', '2025-03-10', NULL, 'Marko', 'Marković', TRUE, NOW()),
(2, 'BJ-002-AB', 'Mercedes', 'Actros', 2021, 20.0, 'Tegljač', 62000, '2024-06-15', '2025-06-15', NULL, 'Ivan', 'Horvat', TRUE, NOW()),
(3, npm run dev'BJ-003-AB', 'Scania', 'R440', 2023, 24.0, 'Tegljač', 28000, '2024-01-20', '2025-01-20', NULL, 'Petar', 'Petrović', TRUE, NOW()),
(4, 'BJ-004-AB', 'DAF', 'XF95', 2020, 18.0, 'Cisterna', 78000, '2024-11-05', '2025-11-05', NULL, 'Jovan', 'Jovanović', TRUE, NOW()),
(5, 'E89-M-111', 'MAN', 'TGX', 2024, 26.0, 'Tegljač', 5000, '2024-01-01', '2025-01-01', NULL, 'Haris', 'Delić', TRUE, NOW()),
(6, 'A12-K-222', 'Iveco', 'Stralis', 2022, 19.0, 'Hladnjača', 35000, '2024-05-10', '2025-05-10', NULL, 'Senad', 'Musić', TRUE, NOW()),
-- Dva kamiona BEZ vozača (zaduzeni_vozac_id = NULL po pravilu)
(7, 'T01-E-999', 'Renault', 'T-Range', 2023, 22.0, 'Kiper', 12000, '2024-08-20', '2025-08-20', NULL, NULL, NULL, TRUE, NOW()),
(8, 'M33-J-888', 'Volvo', 'FM', 2021, 25.0, 'Tegljač', 58000, '2024-02-12', '2025-02-12', NULL, NULL, NULL, TRUE, NOW());

-- OPREMA (12 postojećih + 2 nove = 14)
INSERT INTO oprema (id, naziv, vrsta, kamion_id, kapacitet, stanje, datum_nabavke, datum_zadnje_provjere, napomena, aktivan, datum_kreiranja) VALUES
(1, 'Hidraulička rampa', 'Pomoćna', 1, 5.0, 'Odličan', '2021-05-10', '2024-11-01', 'Redovno', TRUE, NOW()),
(2, 'Sigurnosni lanac', 'Osiguranje', 2, 2.0, 'Dobar', '2022-02-15', '2024-10-15', 'Standard', TRUE, NOW()),
(3, 'Termostat', 'Hladnjača', 3, 1.0, 'Odličan', '2022-03-01', '2024-11-10', 'Digital', TRUE, NOW()),
(4, 'GPS Tracker', 'Praćenje', 4, 0.5, 'Odličan', '2023-01-15', '2024-11-05', 'Instaliran', TRUE, NOW()),
(5, 'Rezervna točka', 'Dijelovi', 5, 0.3, 'Dobar', '2020-11-20', '2024-09-20', 'Puna', TRUE, NOW()),
(6, 'PP Aparat', 'Sigurnost', 6, 6.0, 'Novo', '2024-01-10', '2024-12-01', 'S6', TRUE, NOW()),
(7, 'Set gurti (10 kom)', 'Osiguranje', 1, 10.0, 'Odličan', '2023-05-20', '2024-11-15', 'Ojačane', TRUE, NOW()),
(8, 'ADR Oprema', 'Specijalna', 2, 0.0, 'Novo', '2024-02-15', '2024-02-15', 'Komplet', TRUE, NOW()),
(9, 'Poluprikolica Schmitz', 'Prikolica', 3, 24.0, 'Odlično', '2023-06-12', '2024-12-01', 'Cerada', TRUE, NOW()),
(10, 'Kiper kadi Švarcmiler', 'Kiper', 7, 22.0, 'Novo', '2024-01-05', '2024-01-05', 'Čelik', TRUE, NOW()),
(11, 'Thermo King Rashladna', 'Hladnjača', 6, 20.0, 'Odlično', '2022-08-15', '2024-11-20', '-25C', TRUE, NOW()),
(12, 'Cisterna za gorivo', 'Cisterna', 4, 30000.0, 'Dobar', '2021-03-10', '2024-10-10', 'Alu', TRUE, NOW()),
-- Dva nova inserta za opremu
(13, 'Zimske gume Set', 'Potrošni', 5, 0.0, 'Novo', '2024-11-01', '2024-11-01', 'Michelin', TRUE, NOW()),
(14, 'Alat za popravku', 'Alat', 8, 0.0, 'Dobar', '2023-05-05', '2024-06-06', 'Univerzalni', TRUE, NOW());

-- VOZAČI (4 postojeća + 2 nova regularna + 2 bez kamiona = 8)
INSERT INTO vozac (id, ime, prezime, email, lozinka, broj_telefona, marka_kamiona, trenutna_kilometraza, tip_goriva, broj_vozacke_dozvole, kategorija_dozvole, datum_zaposlenja, plata, broj_dovrsenih_tura, aktivan, kamion_id, oprema_id, datum_kreiranja) VALUES
(1, 'Marko', 'Marković', 'marko.markovic@routevision.com', 'pass1', '+387 111', 'Volvo', 45000, 'Dizel', 'DL-001', 'CE', '2023-01-15', 1500.00, 45, TRUE, 1, 1, NOW()),
(2, 'Ivan', 'Horvat', 'ivan.horvat@routevision.com', 'pass2', '+387 222', 'Mercedes', 62000, 'Dizel', 'DL-002', 'CE', '2023-03-20', 1500.00, 38, TRUE, 2, 2, NOW()),
(3, 'Petar', 'Petrović', 'petar.petrovic@routevision.com', 'pass3', '+387 333', 'Scania', 28000, 'Dizel', 'DL-003', 'CE', '2023-05-10', 1500.00, 52, TRUE, 3, 9, NOW()),
(4, 'Jovan', 'Jovanović', 'jovan.jovanovic@routevision.com', 'pass4', '+387 444', 'DAF', 78000, 'Dizel', 'DL-004', 'CE', '2023-07-05', 1500.00, 31, TRUE, 4, 12, NOW()),
(5, 'Haris', 'Delić', 'haris.delic@routevision.com', 'pass5', '+387 555', 'MAN', 5000, 'Dizel', 'DL-005', 'CE', '2024-01-01', 1600.00, 5, TRUE, 5, 5, NOW()),
(6, 'Senad', 'Musić', 'senad.music@routevision.com', 'pass6', '+387 666', 'Iveco', 35000, 'Dizel', 'DL-006', 'CE', '2024-02-01', 1600.00, 12, TRUE, 6, 6, NOW()),
-- Dva nova vozača BEZ kamiona (kamion_id = NULL po pravilu)
(7, 'Amar', 'Karić', 'amar.karic@routevision.com', 'pass7', '+387 777', NULL, 0, 'N/A', 'DL-007', 'CE', '2024-11-01', 1400.00, 0, TRUE, NULL, NULL, NOW()),
(8, 'Luka', 'Babić', 'luka.babic@routevision.com', 'pass8', '+387 888', NULL, 0, 'N/A', 'DL-008', 'CE', '2024-12-01', 1400.00, 0, TRUE, NULL, NULL, NOW());

-- Ažuriranje kamiona sa zaduženim vozačima (Cirkularna veza)
UPDATE kamion SET zaduzeni_vozac_id = 1 WHERE id = 1;
UPDATE kamion SET zaduzeni_vozac_id = 2 WHERE id = 2;
UPDATE kamion SET zaduzeni_vozac_id = 3 WHERE id = 3;
UPDATE kamion SET zaduzeni_vozac_id = 4 WHERE id = 4;
UPDATE kamion SET zaduzeni_vozac_id = 5 WHERE id = 5;
UPDATE kamion SET zaduzeni_vozac_id = 6 WHERE id = 6;

-- NARUDŽBE (8 postojećih + 2 nove = 10)
INSERT INTO narudzba (id, broj_narudzbe, klijent_id, datum_narudzbe, datum_isporuke, vrsta_robe, kolicina, jedinica_mjere, lokacija_preuzimanja, lokacija_dostave, napomena, status, aktivan, datum_kreiranja) VALUES
(1, 'ORD-2024-001', 1, '2024-11-01', '2024-11-15', 'Elektronika', 500.00, 'kom', 'Sarajevo', 'Zagreb', 'Lomljivo', 'Završena', TRUE, NOW()),
(2, 'ORD-2024-002', 2, '2024-11-05', '2024-11-20', 'Hrana', 3500.00, 'kg', 'Pale', 'Ljubljana', 'Hladni režim', 'Završena', TRUE, NOW()),
(3, 'ORD-2024-003', 3, '2024-11-08', '2024-11-25', 'Industrija', 12.50, 'tona', 'Ljubljana', 'Sarajevo', 'Hitno', 'Završena', TRUE, NOW()),
(4, 'ORD-2024-004', 4, '2024-11-10', '2024-11-28', 'Gradnja', 25.00, 'tona', 'Beograd', 'Sarajevo', 'Standard', 'Završena', TRUE, NOW()),
(5, 'ORD-2024-005', 1, '2024-12-15', '2024-12-25', 'Namještaj', 10.00, 'kom', 'Sarajevo', 'Beč', 'Paletirano', 'U toku', TRUE, NOW()),
(6, 'ORD-2024-006', 2, '2024-12-16', '2024-12-26', 'Voće', 2000.00, 'kg', 'Mostar', 'Prag', 'Svježe', 'U toku', TRUE, NOW()),
(7, 'ORD-2024-007', 3, '2024-12-17', '2024-12-27', 'Čelik', 20.00, 'tona', 'Zenica', 'Minhen', 'Teški teret', 'U toku', TRUE, NOW()),
(8, 'ORD-2024-008', 4, '2024-12-18', '2024-12-28', 'Nafta', 30000.00, 'L', 'Brod', 'Tuzla', 'ADR', 'U toku', TRUE, NOW()),
(9, 'ORD-2024-009', 5, '2025-01-05', '2025-01-10', 'Paketi', 100.00, 'kom', 'Banja Luka', 'Berlin', 'Zbirni prevoz', 'Novo', TRUE, NOW()),
(10, 'ORD-2024-010', 6, '2025-01-06', '2025-01-12', 'Izolacija', 50.00, 'paleta', 'Beč', 'Sarajevo', 'Laki teret', 'Novo', TRUE, NOW());

-- TURE (8 postojećih + 2 nove = 10)
INSERT INTO tura (id, broj_ture, vozac_id, kamion_id, narudzba_id, datum_pocetka, vrijeme_pocetka, datum_kraja, vrijeme_kraja, lokacija_pocetka, lokacija_kraja, prijedeni_kilometri, prosjecna_brzina, spent_fuel, fuel_used, napomena, status, aktivan, kreirao_admin_id, kreirao_vozac_id, datum_kreiranja) VALUES
(1, 'TRIP-2024-001', 1, 1, 1, '2024-11-01', '08:00', '2024-11-03', '14:30', 'Sarajevo', 'Zagreb', 650, 85, 195.0, 195.0, 'Ok', 'Završena', TRUE, 1, NULL, NOW()),
(2, 'TRIP-2024-002', 2, 2, 2, '2024-11-05', '06:30', '2024-11-07', '16:45', 'Pale', 'Ljubljana', 520, 80, 156.0, 156.0, 'Ok', 'Završena', TRUE, 2, NULL, NOW()),
(3, 'TRIP-2024-003', 3, 3, 3, '2024-11-08', '07:00', '2024-11-10', '15:15', 'Ljubljana', 'Sarajevo', 480, 82, 144.0, 144.0, 'Ok', 'Završena', TRUE, 1, NULL, NOW()),
(4, 'TRIP-2024-004', 4, 4, 4, '2024-11-12', '09:00', '2024-11-14', '18:00', 'Beograd', 'Sarajevo', 300, 75, 90.0, 90.0, 'Ok', 'Završena', TRUE, 2, NULL, NOW()),
(5, 'TRIP-2024-005', 1, 1, 5, '2024-12-20', '07:00', NULL, NULL, 'Sarajevo', 'Beč', 0, 0, 0.0, 0.0, 'U toku', 'U toku', TRUE, 1, NULL, NOW()),
(6, 'TRIP-2024-006', 2, 2, 6, '2024-12-21', '08:00', NULL, NULL, 'Mostar', 'Prag', 0, 0, 0.0, 0.0, 'U toku', 'U toku', TRUE, 2, NULL, NOW()),
(7, 'TRIP-2024-007', 3, 3, 7, '2024-12-22', '06:00', NULL, NULL, 'Zenica', 'Minhen', 0, 0, 0.0, 0.0, 'U toku', 'U toku', TRUE, 3, NULL, NOW()),
(8, 'TRIP-2024-008', 4, 4, 8, '2024-12-23', '09:00', NULL, NULL, 'Brod', 'Tuzla', 0, 0, 0.0, 0.0, 'U toku', 'U toku', TRUE, 4, NULL, NOW()),
(9, 'TRIP-2025-001', 5, 5, 9, '2025-01-05', '05:00', NULL, NULL, 'Banja Luka', 'Berlin', 0, 0, 0.0, 0.0, 'Nova tura', 'Novo', TRUE, 5, NULL, NOW()),
(10, 'TRIP-2025-002', 6, 6, 10, '2025-01-06', '06:00', NULL, NULL, 'Beč', 'Sarajevo', 0, 0, 0.0, 0.0, 'Nova tura', 'Novo', TRUE, 6, NULL, NOW());

-- FAKTURE (8 postojećih + 2 nove = 10)
INSERT INTO fakture (id, broj_fakture, tura_id, klijent_id, datum_izdavanja, odobrio_admin_id, datum_dospjeća, vrsta_usluge, cijena_po_km, broj_km, iznos_usluge, porez, ukupan_iznos, status_placanja, nacin_placanja, datum_placanja, napomena, datoteka_path, aktivan, datum_kreiranja) VALUES
(1, 'INV-2024-001', 1, 1, '2024-11-03', 1, '2024-12-03', 'Prevoz', 1.5, 650, 975.0, 165.75, 1140.75, 'Plaćeno', 'Transfer', '2024-11-10', 'Ok', NULL, TRUE, NOW()),
(2, 'INV-2024-002', 2, 2, '2024-11-07', 2, '2024-12-07', 'Prevoz', 1.8, 520, 936.0, 159.12, 1095.12, 'Neplaćeno', 'Transfer', NULL, 'Čeka se', NULL, TRUE, NOW()),
(3, 'INV-2024-003', 3, 3, '2024-11-10', 1, '2024-12-10', 'Prevoz', 2.0, 480, 960.0, 163.20, 1123.20, 'Plaćeno', 'Transfer', '2024-11-15', 'Ok', NULL, TRUE, NOW()),
(4, 'INV-2024-004', 4, 4, '2024-11-15', 2, '2024-12-15', 'Prevoz', 2.5, 300, 750.0, 127.50, 877.50, 'Neplaćeno', 'Transfer', NULL, 'Čeka se', NULL, TRUE, NOW()),
(5, 'INV-2024-005', 5, 1, '2024-12-20', 1, '2025-01-20', 'Prevoz', 1.5, 800, 1200.0, 204.0, 1404.00, 'U obradi', 'Transfer', NULL, 'Predračun', NULL, TRUE, NOW()),
(6, 'INV-2024-006', 6, 2, '2024-12-21', 2, '2025-01-21', 'Prevoz', 1.9, 950, 1805.0, 306.85, 2111.85, 'U obradi', 'Transfer', NULL, 'Predračun', NULL, TRUE, NOW()),
(7, 'INV-2024-007', 7, 3, '2024-12-22', 3, '2025-01-22', 'Prevoz', 2.2, 700, 1540.0, 261.80, 1801.80, 'U obradi', 'Transfer', NULL, 'Predračun', NULL, TRUE, NOW()),
(8, 'INV-2024-008', 8, 4, '2024-12-23', 4, '2025-01-23', 'Prevoz', 3.0, 450, 1350.0, 229.50, 1579.50, 'U obradi', 'Transfer', NULL, 'Predračun', NULL, TRUE, NOW()),
(9, 'INV-2025-001', 9, 5, '2025-01-05', 5, '2025-02-05', 'Prevoz paketa', 2.0, 1100, 2200.0, 374.00, 2574.00, 'Novo', 'Transfer', NULL, 'Novo', NULL, TRUE, NOW()),
(10, 'INV-2025-002', 10, 6, '2025-01-06', 6, '2025-02-06', 'Prevoz izolacije', 1.7, 900, 1530.0, 260.10, 1790.10, 'Novo', 'Transfer', NULL, 'Novo', NULL, TRUE, NOW());

-- SERVISNI DNEVNIK (8 postojećih + 2 nove = 10)
INSERT INTO servisni_dnevnik (id, kamion_id, vozac_id, datum_servisa, vrsta_servisa, opisServisa, kreirao_korisnik, nadlezni_admin_id, km_na_servisu, troskovi, serviser_naziv, napomena, datoteka_path, aktivan, datum_kreiranja) VALUES
(1, 1, 1, '2024-12-01', 'Kvar', 'Lupanje', 'Marko', 1, 46000, 0.0, 'Servis 1', 'Prijavljeno', NULL, TRUE, NOW()),
(2, 2, 2, '2024-12-05', 'Sijalica', 'Zamjena', 'Ivan', 2, 63500, 20.0, 'Vlastiti', 'Ok', NULL, TRUE, NOW()),
(3, 3, 3, '2024-12-08', 'Ulje', 'Dopuna', 'Petar', 3, 29000, 45.0, 'Pumpa', 'Ok', NULL, TRUE, NOW()),
(4, 4, 4, '2024-12-10', 'Pranje', 'Dubinsko', 'Jovan', 4, 79500, 50.0, 'Wash', 'Ok', NULL, TRUE, NOW()),
(5, 1, NULL, '2024-12-12', 'Redovni', 'Filteri', 'Admin', 1, 46500, 850.0, 'Volvo SA', 'Odrađeno', NULL, TRUE, NOW()),
(6, 2, NULL, '2024-12-15', 'Registracija', 'Tehnički', 'Admin', 2, 64000, 1200.0, 'MUP', 'Ok', NULL, TRUE, NOW()),
(7, 3, NULL, '2024-12-18', 'Gume', 'Nove', 'Admin', 3, 30000, 2400.0, 'GumaM', 'Ok', NULL, TRUE, NOW()),
(8, 4, NULL, '2024-12-20', 'Cisterna', 'Ventili', 'Admin', 4, 80000, 300.0, 'Inspekt', 'Ok', NULL, TRUE, NOW()),
(9, 5, 5, '2025-01-02', 'Nulti servis', 'Provjera', 'Haris', 5, 5001, 100.0, 'MAN centar', 'Novo vozilo', NULL, TRUE, NOW()),
(10, 6, 6, '2025-01-03', 'Kočnice', 'Pločice', 'Senad', 6, 35100, 400.0, 'Iveco Servis', 'Potrošni materijal', NULL, TRUE, NOW());

-- DOKUMENTI (2 potpuno nova reda)
INSERT INTO dokument (id, vezano_za, vezani_id, putanja_datoteke, uploadao_admin_id, uploadao_vozac_id, tip_dokumenta, datum_izdavanja, datum_isteka, datum_kreiranja) VALUES
(1, 'vozac', 1, '/docs/licenca_marko.pdf', 1, NULL, 'licenca', '2024-01-01', '2029-01-01', NOW()),
(2, 'kamion', 1, '/docs/reg_bj001.pdf', 1, NULL, 'registracija', '2024-03-10', '2025-03-10', NOW());

-- DNEVNIK AKTIVNOSTI (2 potpuno nova reda)
INSERT INTO dnevnik_aktivnosti (id, admin_id, akcija, entitet, entitet_id, timestamp) VALUES
(1, 1, 'Kreiran novi vozač Haris Delić', 'Vozac', 5, NOW()),
(2, 2, 'Odobrena faktura INV-2024-001', 'Faktura', 1, NOW());