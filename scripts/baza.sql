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
                       datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                       aktivan BOOLEAN DEFAULT TRUE
);

-- Vozač (Driver) Table
CREATE TABLE vozac (
                       id INT PRIMARY KEY AUTO_INCREMENT,
                       ime VARCHAR(100) NOT NULL,
                       prezime VARCHAR(100) NOT NULL,
                       email VARCHAR(150) NOT NULL UNIQUE,
                       lozinka VARCHAR(255) NOT NULL,
                       broj_telefona VARCHAR(20),
                       broj_vozacke_dozvole VARCHAR(50) UNIQUE,
                       kategorija_dozvole VARCHAR(50),
                       datum_zaposlenja DATE,
                       plata DECIMAL(10,2),
                       broj_dovrsenih_tura INT DEFAULT 0,
                       stanje_racuna DECIMAL(10,2) DEFAULT 0,
                       aktivna_slika VARCHAR(255),
                       aktivan BOOLEAN DEFAULT TRUE,
                       datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kamion (Truck) Table
CREATE TABLE kamion (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        registarska_tablica VARCHAR(20) NOT NULL UNIQUE,
                        marka VARCHAR(100),
                        model VARCHAR(100),
                        godina_proizvodnje INT,
                        kapacitet_tone DECIMAL(8,2),
                        vrsta_voza VARCHAR(100),
                        stanje_kilometra INT DEFAULT 0,
                        datum_registracije DATE,
                        datum_zakljucnog_pregleda DATE,
                        vozac_id INT,
                        aktivna_slika VARCHAR(255),
                        aktivan BOOLEAN DEFAULT TRUE,
                        datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (vozac_id) REFERENCES vozac(id) ON DELETE SET NULL
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
                         aktivna_slika VARCHAR(255),
                         aktivan BOOLEAN DEFAULT TRUE,
                         datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Narudžba (Order) Table
CREATE TABLE narudba (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         broj_narudbe VARCHAR(50) NOT NULL UNIQUE,
                         klijent_id INT NOT NULL,
                         datum_narudbe DATE,
                         datum_isporuke DATE,
                         vrsta_robe VARCHAR(150),
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
                      narudba_id INT NOT NULL,
                      datum_pocetka DATE,
                      vrijeme_pocetka TIME,
                      datum_kraja DATE,
                      vrijeme_kraja TIME,
                      lokacija_pocetka VARCHAR(255),
                      lokacija_kraja VARCHAR(255),
                      prijedeni_kilometri INT,
                      prosjecna_brzina INT,
                      spent_fuel DECIMAL(8,2),
                      fuel_used DECIMAL(8,2),
                      napomena TEXT,
                      status VARCHAR(50) DEFAULT 'U toku',
                      aktivan BOOLEAN DEFAULT TRUE,
                      datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      FOREIGN KEY (vozac_id) REFERENCES vozac(id) ON DELETE CASCADE,
                      FOREIGN KEY (kamion_id) REFERENCES kamion(id) ON DELETE CASCADE,
                      FOREIGN KEY (narudba_id) REFERENCES narudba(id) ON DELETE CASCADE
);

-- Račun (Invoice) Table
CREATE TABLE fakture (
                         id INT PRIMARY KEY AUTO_INCREMENT,
                         broj_fakture VARCHAR(50) NOT NULL UNIQUE,
                         tura_id INT NOT NULL,
                         klijent_id INT NOT NULL,
                         datum_izdavanja DATE,
                         datum_dospjeca DATE,
                         vrsta_usluge VARCHAR(150),
                         cijena_po_km DECIMAL(8,2),
                         broj_km INT,
                         iznos_usluge DECIMAL(10,2),
                         porez DECIMAL(10,2),
                         ukupan_iznos DECIMAL(10,2),
                         status_placanja VARCHAR(50) DEFAULT 'Neplaćeno',
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
                                  km_na_servisu INT,
                                  troskovi DECIMAL(10,2),
                                  serviser_naziv VARCHAR(150),
                                  napomena TEXT,
                                  datoteka_path VARCHAR(255),
                                  aktivan BOOLEAN DEFAULT TRUE,
                                  datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                  FOREIGN KEY (kamion_id) REFERENCES kamion(id) ON DELETE CASCADE,
                                  FOREIGN KEY (vozac_id) REFERENCES vozac(id) ON DELETE SET NULL
);

-- Status Vozača (Driver Status)
CREATE TABLE status_vozaca (
                               id INT AUTO_INCREMENT PRIMARY KEY,
                               vozac_id INT NOT NULL,
                               status VARCHAR(50),
                               tura_id INT NULL,
                               timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               napomena TEXT,
                               FOREIGN KEY (vozac_id) REFERENCES vozac(id) ON DELETE CASCADE,
                               FOREIGN KEY (tura_id) REFERENCES tura(id) ON DELETE SET NULL
);

-- Dokumenti (Documents)
CREATE TABLE dokument (
                          id INT AUTO_INCREMENT PRIMARY KEY,
                          vezano_za VARCHAR(50),
                          vezani_id INT NULL,
                          putanja_datoteke VARCHAR(255),
                          uploadao_admin_id INT NULL,
                          uploadao_vozac_id INT NULL,
                          tip_dokumenta VARCHAR(50),
                          datum_izdavanja DATE,
                          datum_isteka DATE,
                          datum_kreiranja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                          FOREIGN KEY (uploadao_admin_id) REFERENCES admin(id) ON DELETE SET NULL,
                          FOREIGN KEY (uploadao_vozac_id) REFERENCES vozac(id) ON DELETE SET NULL
);

-- Dnevnici Aktivnosti (Activity Logs)
CREATE TABLE dnevnik_aktivnosti (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    admin_id INT NULL,
                                    akcija VARCHAR(255),
                                    entitet VARCHAR(50),
                                    entitet_id INT,
                                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE SET NULL
);

-- Create Indexes for Performance
CREATE INDEX idx_vozac_email ON vozac(email);
CREATE INDEX idx_admin_email ON admin(email);
CREATE INDEX idx_klijent_naziv ON klijent(naziv_firme);
CREATE INDEX idx_tura_vozac ON tura(vozac_id);
CREATE INDEX idx_tura_kamion ON tura(kamion_id);
CREATE INDEX idx_narudba_klijent ON narudba(klijent_id);
CREATE INDEX idx_fakture_tura ON fakture(tura_id);
CREATE INDEX idx_evidencija_servisa_kamion ON servisni_dnevnik(kamion_id);
-- baza Test Data
USE baza;

-- Admin Test Users
-- Password: admin123 (BCrypt hash)
INSERT INTO admin (ime, prezime, email, lozinka, broj_telefona, aktivan) VALUES
                                                                             ('Marko', 'Administratorović', 'marko@routevision.com', '$2a$12$dCj/vd.J.mmqWV6uqoIVye7IUeq0iF9hGozoNi./O3KDqRUGFfE6O', '+387 33 123 456', TRUE),
                                                                             ('Ana', 'Šef', 'ana.sef@routevision.com', '$2a$12$dCj/vd.J.mmqWV6uqoIVye7IUeq0iF9hGozoNi./O3KDqRUGFfE6O', '+387 33 123 457', TRUE);

-- Driver Test Users
-- Password: vozac123 (BCrypt hash)
INSERT INTO vozac (
    ime, prezime, email, lozinka, broj_telefona, broj_vozacke_dozvole,
    kategorija_dozvole, datum_zaposlenja, plata, broj_dovrsenih_tura,
    stanje_racuna, aktivan
) VALUES
      ('Marko', 'Marković', 'marko.markovic@routevision.com', '$2a$12$frGVY9RHPc4au4IV/s0L5u.Lw.kC9Q4qj6V/33fMC8hjlqPnbN8H.', '+387 61 222 111', 'DL-001-2024', 'C', '2023-01-15', 1500.00, 45, 3200.50, TRUE),
      ('Ivan', 'Horvat', 'ivan.horvat@routevision.com', '$2a$12$frGVY9RHPc4au4IV/s0L5u.Lw.kC9Q4qj6V/33fMC8hjlqPnbN8H.', '+387 61 222 222', 'DL-002-2024', 'C', '2023-03-20', 1500.00, 38, 2850.75, TRUE),
      ('Petar', 'Petrović', 'petar.petrovic@routevision.com', '$2a$12$frGVY9RHPc4au4IV/s0L5u.Lw.kC9Q4qj6V/33fMC8hjlqPnbN8H.', '+387 61 222 333', 'DL-003-2024', 'C', '2023-05-10', 1500.00, 52, 4100.25, TRUE),
      ('Jovan', 'Jovanović', 'jovan.jovanovic@routevision.com', '$2a$12$frGVY9RHPc4au4IV/s0L5u.Lw.kC9Q4qj6V/33fMC8hjlqPnbN8H.', '+387 61 222 444', 'DL-004-2024', 'C', '2023-07-05', 1500.00, 31, 1950.00, TRUE);

-- Kamion (Trucks)
INSERT INTO kamion (registarska_tablica, marka, model, godina_proizvodnje, kapacitet_tone, vrsta_voza,
                    stanje_kilometra, datum_registracije, datum_zakljucnog_pregleda, vozac_id, aktivan) VALUES
                                                                                                            ('BJ-001-AB', 'Volvo', 'FH16', 2022, 25.0, 'Hladnjača', 45000, '2022-03-10', '2025-03-10', 1, TRUE),
                                                                                                            ('BJ-002-AB', 'Mercedes', 'Actros', 2021, 20.0, 'Standardni', 62000, '2021-06-15', '2025-06-15', 2, TRUE),
                                                                                                            ('BJ-003-AB', 'Scania', 'R440', 2023, 24.0, 'Kiper', 28000, '2023-01-20', '2025-01-20', 3, TRUE),
                                                                                                            ('BJ-004-AB', 'DAF', 'XF95', 2020, 18.0, 'Standardni', 78000, '2020-11-05', '2025-11-05', 4, TRUE);

-- Oprema (Equipment)
INSERT INTO oprema (naziv, vrsta, kamion_id, kapacitet, stanje, datum_nabavke, datum_zadnje_provjere, aktivan) VALUES
                                                                                                                   ('Hidraulička rampa', 'Pomoćna oprema', 1, 5.0, 'Odličan', '2021-05-10', '2024-11-01', TRUE),
                                                                                                                   ('Sigurnosni lanac', 'Osiguranje tereta', 2, 2.0, 'Dobar', '2022-02-15', '2024-10-15', TRUE),
                                                                                                                   ('Termostat', 'Hladnjača', 1, 1.0, 'Odličan', '2022-03-01', '2024-11-10', TRUE),
                                                                                                                   ('GPS Tracker', 'Praćenje', 3, 0.5, 'Odličan', '2023-01-15', '2024-11-05', TRUE),
                                                                                                                   ('Rezervna točka', 'Rezervni dijelovi', 4, 0.3, 'Dobar', '2020-11-20', '2024-09-20', TRUE);

-- Klijent (Clients)
INSERT INTO klijent (naziv_firme, tip_klijenta, adresa, mjesto, postanskiBroj, drzava, kontakt_osoba,
                     email, broj_telefona, poreska_broj, naziv_banke, racun_broj, aktivan) VALUES
                                                                                               ('Adriatic Trade Ltd', 'Privatna', 'Ulica Svetog Save 25', 'Sarajevo', '71000', 'Bosna i Hercegovina',
                                                                                                'Fahrudin Abdić', 'info@adriatic-trade.ba', '+387 33 123 456', 'PIB-001', 'UniCredit Bank', '1010001001001001', TRUE),
                                                                                               ('Balkan Foods Export', 'Privatna', 'Industrijska zona 15', 'Pale', '71410', 'Bosna i Hercegovina',
                                                                                                'Mirna Adamović', 'contact@balkanfoods.ba', '+387 57 234 567', 'PIB-002', 'Raiffeisen Bank', '2020002002002002', TRUE),
                                                                                               ('Slovenija Logistika', 'Privatna', 'Cesta Svobode 42', 'Ljubljana', '1000', 'Slovenija',
                                                                                                'Jovan Novak', 'logistics@slovenija-log.si', '+386 1 456 789', 'PIB-003', 'NLB Bank', '3030003003003003', TRUE),                                                                                     ('Import Export Centar', 'Privatna', 'Trgovska 8', 'Beograd', '11000', 'Srbija',
                                                                                                'Vesna Nikolić', 'office@import-export.rs', '+381 11 567 890', 'PIB-004', 'Komercijalna Banka', '4040004004004004', TRUE);

-- Narudba (Orders)
INSERT INTO narudba (broj_narudbe, klijent_id, datum_narudbe, datum_isporuke, vrsta_robe, kolicina,
                     jedinica_mjere, lokacija_preuzimanja, lokacija_dostave, status, aktivan) VALUES
                                                                                                  ('ORD-2024-001', 1, '2024-11-01', '2024-11-15', 'Elektronika', 500, 'kom', 'Sarajevo', 'Zagreb', 'U toku', TRUE),
                                                                                                  ('ORD-2024-002', 2, '2024-11-05', '2024-11-20', 'Hrana i piće', 3500, 'kg', 'Pale', 'Ljubljana', 'U toku', TRUE),
                                                                                                  ('ORD-2024-003', 3, '2024-11-08', '2024-11-25', 'Industrijska roba', 12.5, 'tona', 'Ljubljana', 'Sarajevo', 'Završena', TRUE),
                                                                                                  ('ORD-2024-004', 4, '2024-11-10', '2024-11-28', 'Materijali za gradnju', 25.0, 'tona', 'Beograd', 'Sarajevo', 'U toku', TRUE);

-- Putovanje (Trips)
INSERT INTO tura (broj_ture, vozac_id, kamion_id, narudba_id, datum_pocetka, vrijeme_pocetka,
                  datum_kraja, vrijeme_kraja, lokacija_pocetka, lokacija_kraja, prijedeni_kilometri, prosjecna_brzina,
                  fuel_used, status, aktivan) VALUES
                                                  ('TRIP-2024-001', 1, 1, 1, '2024-11-01', '08:00:00', '2024-11-03', '14:30:00', 'Sarajevo', 'Zagreb', 650, 85, 195.0, 'Završena', TRUE),
                                                  ('TRIP-2024-002', 2, 2, 2, '2024-11-05', '06:30:00', '2024-11-07', '16:45:00', 'Pale', 'Ljubljana', 520, 80, 156.0, 'Završena', TRUE),
                                                  ('TRIP-2024-003', 3, 3, 3, '2024-11-08', '07:00:00', '2024-11-10', '15:15:00', 'Ljubljana', 'Sarajevo', 480, 82, 144.0, 'Završena', TRUE),
                                                  ('TRIP-2024-004', 4, 4, 4, '2024-11-12', '09:00:00', NULL, NULL, 'Beograd', 'Sarajevo', 0, 0, 0.0, 'U toku', TRUE);

-- Račun (Invoices)
INSERT INTO fakture (broj_fakture, tura_id, klijent_id, datum_izdavanja, datum_dospjeca, vrsta_usluge,
                     cijena_po_km, broj_km, iznos_usluge, porez, ukupan_iznos, status_placanja, nacin_placanja, datum_placanja, aktivan) VALUES
                                                                                                                                             ('INV-2024-001', 1, 1, '2024-11-03', '2024-12-03', 'Prevoz elektronike', 1.5, 650, 975.00, 195.00, 1170.00, 'Plaćeno', 'Bankovni transfer', '2024-11-10', TRUE),
                                                                                                                                             ('INV-2024-002', 2, 2, '2024-11-07', '2024-12-07', 'Prevoz hrane i pića', 1.8, 520, 936.00, 187.20, 1123.20, 'Neplaćeno', 'Bankovni transfer', NULL, TRUE),
                                                                                                                                             ('INV-2024-003', 3, 3, '2024-11-10', '2024-12-10', 'Prevoz industrijske robe', 2.0, 480, 960.00, 192.00, 1152.00, 'Plaćeno', 'Bankovni transfer', '2024-11-15', TRUE);

-- Servisni Dnevnik (Service Logs)
INSERT INTO servisni_dnevnik (kamion_id, vozac_id, datum_servisa, vrsta_servisa, opisServisa, km_na_servisu,
                              troskovi, serviser_naziv, napomena, aktivan) VALUES
                                                                               (1, 1, '2024-10-15', 'Redovni servis', 'Zamjena ulja i filtera', 40000, 450.00, 'Volvo Servis Sarajevo', 'Sve ispravno', TRUE),
                                                                               (2, 2, '2024-09-20', 'Popravka', 'Zamjena kočnica', 55000, 1200.00, 'Mercedes Centar Pale', 'Kočnice zamijenjene', TRUE),
                                                                               (3, 3, '2024-11-01', 'Redovni servis', 'Pregled i održavanje', 25000, 380.00, 'Scania Partner Ljubljana', 'OK', TRUE),
                                                                               (4, 4, '2024-08-10', 'Redovni servis', 'Zamjena filtera i ulja', 70000, 500.00, 'DAF Centar Beograd', 'Sve u redu', TRUE);
