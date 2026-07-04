# Phase 6 Test Report

**Projektversion:** v0.6.0  
**Testdatum:** 26.06.2026  
**Ergebnis:** PASS für den implementierten Plattformkern

## 1. Prüfobjekt

Geprüft wurde das produktnahe Repository `platform/`, nicht der Phase-5-Spike.

## 2. Umgebung

- Node.js 22;
- Next.js Produktionsbuild;
- TypeScript Strict Mode;
- PGlite als lokaler PostgreSQL-Motor;
- Chromium über Playwright;
- Zielgrössen 390 × 844 und 1440 × 900.

PGlite validiert PostgreSQL-DDL und SQL-Verhalten lokal. Ein externer PostgreSQL-Server, WAN-Latenz und zwei tatsächlich getrennte App-Instanzen sind nicht Bestandteil dieses Berichts.

## 3. Statische und Build-Prüfung

| Prüfung | Ergebnis |
|---|---:|
| TypeScript `tsc --noEmit` | PASS |
| Next.js Production Build | PASS |
| Raidverträge synchronisiert | PASS |
| npm-Audit | 0 bekannte Schwachstellen |

Erzeugte dynamische Routen:

- Session erstellen;
- anonym beitreten;
- Snapshot laden;
- Commands senden;
- SSE-Events ab Cursor empfangen;
- Definitionen und Health lesen.

## 4. Unit- und Integrationstests

**10/10 Tests bestanden.**

Geprüft:

1. beide unveränderten Raiddefinitionen validieren gegen das Schema;
2. Referenzen und Dependency-Graph sind konsistent;
3. Session, TaskInstances und vier getrennte Invites werden erzeugt;
4. Klartext-Invites werden nicht gespeichert;
5. 16 aktive Rollen bestehen Ready-Check und starten den Timer;
6. exklusives Claim-Race ergibt genau einen Gewinner;
7. abhängige Aufgabe wird im selben Domainevent freigeschaltet;
8. 50 parallele Zählerinkremente erzeugen keinen Lost Update;
9. Editor-Scope und Linkwiderruf werden serverseitig erzwungen;
10. Snapshot, Cursor und exklusive Outbox-Claims sind konsistent.

## 5. Wiederholter 16-Client-Test

Quelle: `platform/artifacts/platform-reliability.json`.

| Gate | Ergebnis |
|---|---:|
| vollständige Läufe | 10/10 |
| aktive Rollen pro Lauf | 16 |
| simulierte Rollen gesamt | 160 |
| Burst-Updates pro Lauf | 50 |
| Burst-Updates gesamt | 500/500 |
| Claim Race | immer 1 Gewinner + 1 Konflikt |
| Endzähler | immer 50 |
| Recovery-Identität | 10/10 |
| Eventcursor | 10/10 |
| Outbox exklusiv | 10/10 |
| Event-Invariante | 10/10 |

Messwerte des finalen Laufsatzes:

- durchschnittliche Gesamtdauer pro Lauf: **1'059.05 ms**;
- durchschnittliche Dauer des 50-Update-Bursts: **138.94 ms**;
- langsamster Burst: **158.98 ms**;
- langsamstes Claim-Race: **5.52 ms**.

Diese Werte stammen aus einem lokalen Prozess und sind keine Hosting- oder Internetlatenz.

## 6. Browser-E2E

**4/4 Szenarien bestanden.**

### 390 × 844

- Landingpage und Definitionen laden;
- Session über Produktoberfläche erstellen;
- Captain-Link öffnen;
- ohne Konto beitreten;
- Lobby und Ready-Aktion bedienen;
- persönliche Mission anzeigen;
- Bottom Navigation anzeigen;
- kein horizontales Kernscrolling.

### 1440 × 900

- derselbe Create-/Join-Ablauf;
- Captain Command Center anzeigen;
- Captain Radar anzeigen;
- generische Taskkarten rendern;
- kein horizontales Kernscrolling.

## 7. Sicherheitsprüfung

- Invite- und Recovery-Tokens nur gehasht in der Datenbank;
- Zuschauer-Schreibzugriff abgelehnt;
- Editor-Scope serverseitig geprüft;
- alte Links nach Rotation abgelehnt;
- Same-Origin-Prüfung für schreibende HTTP-Commands;
- npm-Audit: **0** bekannte `info`, `low`, `moderate`, `high` oder `critical` Schwachstellen.

## 8. Nicht bewiesen

1. tatsächlicher Betrieb gegen einen externen PostgreSQL-Dienst;
2. Eventverteilung zwischen zwei real getrennten App-Instanzen;
3. WAN-, Mobilfunk- und Browser-Hintergrundverhalten über lange Zeit;
4. Last über viele parallele Sessions;
5. Backup, Restore und Failover;
6. Security-Penetrationstest;
7. vollständiges Undo abhängiger Folgeereignisse;
8. raid-spezifische Spezialmodule aus Phase 7 und 8.

## 9. Gate

Phase 6 ist als Plattformkern abgeschlossen. Die genannten Deployment- und Infrastrukturprüfungen bleiben explizite Vorbedingungen vor einem öffentlichen Pilotbetrieb, blockieren aber nicht den Beginn von Phase 7.
