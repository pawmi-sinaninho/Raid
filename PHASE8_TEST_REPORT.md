# Phase 8 Test Report

**Projektversion:** v0.8.0  
**Testdatum:** 27.06.2026  
**Prüfobjekt:** Gigalodon-Implementierung im Repository `platform/`  
**Ergebnis:** PASS für den implementierten und simulierten Phase-8-Scope

## 1. Testumgebung

- Node.js 22;
- Next.js 16 Produktionsbuild;
- TypeScript Strict Mode;
- Vitest;
- PGlite als lokaler PostgreSQL-kompatibler Testmotor;
- Chromium über Playwright;
- Viewports 390 × 844 und 1440 × 900.

Ein externer PostgreSQL-Dienst, zwei getrennte App-Prozesse, WAN-Verhalten und ein echter DOFUS-Raid waren nicht Teil dieses Tests.

## 2. Gesamtergebnis

| Prüfung | Ergebnis |
|---|---:|
| TypeScript `tsc --noEmit` | PASS |
| Unit-/Integrationstests | 26/26 PASS |
| Sanctuaire-Regressionssimulation | 49/49 PASS |
| vollständige Gigalodon-Simulation | 44/44 PASS |
| wiederholter Plattform-Reliability-Test | 10/10 PASS |
| Next.js Production Build | PASS |
| Browser-E2E | 6/6 PASS |
| npm-Audit | 0 bekannte Schwachstellen |

Maschinenlesbare Zusammenfassung: `platform/artifacts/test-summary.json`.

## 3. Unit- und Integrationstests

**5 Testdateien, 26 Tests, 26 bestanden.**

### Plattform- und Sanctuaire-Regression

- beide Definitionen validieren gegen Schema und Integritätsregeln;
- Session, Invites, Rollen, Ready-Check und Timer;
- exklusive Claims und atomare Zähler;
- Editor-Scope und Linkrotation;
- Snapshot, Cursor und Outbox;
- Resultatbestätigung, Sanctuaire-Transfers, Raid-Leben, Korridor und beide Finalbosse.

### Neue Gigalodon-Prüfungen

- initialer Gigalodon-State wird aus der Definition normalisiert;
- Ressourcenwerte und Damage-Bonus kommen aus versionierten Lookup-Tabellen;
- Fragmentchance verwendet bestätigten Score;
- Lichtverfall wird aus Serverzeit berechnet;
- Finalbereitschaft trennt blockiert, unbestätigt und bereit;
- generischer Sessionstart funktioniert mit acht Gigalodon-Teilnehmern;
- Lichtbeobachtungen speichern Zeit, Level und Evidenz;
- getragener Score und bestätigter Score bleiben getrennt;
- Einzahlung ist atomar und erzeugt Historie;
- Exécrabe verlangt vier unterschiedliche Formen und Zweitbestätigung;
- bestätigte Sequenz und Unique-Halter werden übertragen;
- aktive Kämpfe können als unbestätigte Startblockade geführt werden;
- Gigalodon-Start, drei Runden, Bonusscore und Raidende bleiben konsistent.

## 4. Vollständige 12-Client-Simulation

Quelle: `platform/artifacts/gigalodon-simulation.json`.

| Messpunkt | Ergebnis |
|---|---:|
| Teilnehmer | 12 |
| TaskDefinitions | 44 |
| abgeschlossene Tasks | 44 |
| finale Sessionrevision | 153 |
| DomainEvents | 153 |
| Revision/Event-Invariante | PASS |
| konvergierte Clients | 12/12 |
| bestätigter Ressourcenscore | 17'960 |
| ungesicherter Score am Ende | 0 |
| Fragmente | 4/4 |
| Lichtetagen | 5 |
| Finalschaden | 600'000 |
| Gigalodon-Bonusscore | 13'000 |
| Gesamtscore | 30'960 |
| Sessionstatus | ENDED |

Das Etage--1-Testziel wurde absichtlich auf `6` gesetzt, damit die vollständige Etagen- und Gate-Logik schnell reproduzierbar geprüft werden kann. `confirmedInGame` blieb `false`; der Test behauptet weder 18 noch 20 reale Gruppen.

### Geprüfte Kernergebnisse

- alle fünf Lichtzustände mit 120-Sekunden-Testkonfiguration gespeichert;
- Intervall und Salzkostensemantik weiterhin nicht als live bestätigt markiert;
- Mureine-, Exécrabe- und Willorque-Unique eindeutig zugewiesen und eingezahlt;
- Pincen-Träger eindeutig gespeichert;
- vier Fragmente und alle Zugänge abgeschlossen;
- Finalstart vor Ablauf gespeichert;
- Runde 3 mit 600'000 kumuliertem Schaden;
- Damage-Lookup ergibt 13'000 Bonuspunkte;
- bestätigter Ressourcenscore und Bonusscore korrekt zum Gesamtscore addiert.

## 5. Sanctuaire-Regressionssimulation

Quelle: `platform/artifacts/sanctuaire-simulation.json`.

| Gate | Ergebnis |
|---|---:|
| Teilnehmer | 16 |
| Tasks | 49/49 |
| Revision/Event | 177/177 |
| konvergierte Clients | 16/16 |
| beide Finalbosse | COMPLETED |
| Session | ENDED |

Eine beim Gesamtlauf gefundene Regression in der allgemeinen `participantId`-Feldvalidierung wurde korrigiert: Der Definitionsvertrag verlangt eine nichtleere Teilnehmer-ID, nicht zwingend ein UUID-Format. Danach bestanden die Unit-Tests und die vollständige Sanctuaire-Simulation erneut.

## 6. Wiederholter Plattformtest

Quelle: `platform/artifacts/platform-reliability.json`.

| Gate | Ergebnis |
|---|---:|
| vollständige Läufe | 10/10 |
| aktive Rollen pro Lauf | 16 |
| Burst-Updates gesamt | 500/500 |
| Claim Race | immer genau ein Gewinner |
| Cursor-Recovery | 10/10 |
| Outbox exklusiv | 10/10 |
| Event-Invariante | 10/10 |

Lokale Messwerte:

- durchschnittliche Gesamtdauer pro Lauf: **1'977.28 ms**;
- durchschnittliche Dauer eines 50-Update-Bursts: **251.70 ms**;
- langsamster Burst: **287.53 ms**;
- langsamstes Claim-Race: **13.08 ms**.

Diese Werte messen einen lokalen Prozess und dürfen nicht als Internet- oder Hostinglatenz interpretiert werden.

## 7. Browser-E2E

**6/6 Szenarien bestanden.**

### 390 × 844

- Session erstellen und anonym beitreten;
- bestehende Sanctuaire-Mission und Navigation als Regression;
- Gigalodon-Mission sichtbar;
- eigener Ressourcenbestand und Score at risk;
- Licht-/Etagenkontext;
- keine Captain-Gesamtledgerdaten in der Teilnehmeransicht;
- kein horizontales Kernscrolling.

### 1440 × 900

- Gigalodon Command Center sichtbar;
- vertikaler Expeditionspfad;
- fünf Lichtinstrumente;
- Etage--1-Ziel und Fortschritt;
- bestätigter Score und Score at risk getrennt;
- Ressourcenledger und Unique-Halter;
- gruppierter Finalstartcheck;
- Schadensrunden-Tracker;
- Captain Radar;
- kein horizontales Kernscrolling im Zielviewport.

Referenzscreens:

- `platform/artifacts/phase8-screens/gigalodon-captain-1440x900.png`;
- `platform/artifacts/phase8-screens/gigalodon-participant-390x844.png`.

Die Containerumgebung blockierte zunächst alle Browser-URLs über eine zentrale Chromium-Policy. Für den Test wurde ausschliesslich der lokale Testserver temporär erlaubt. Der Produktcode wurde dafür nicht verändert.

## 8. Sicherheits- und Fachgrenzen

Bestätigt:

- Rollen- und Scope-Prüfung bleibt serverseitig;
- Zuschauer können keine Gigalodon-Mutation ausführen;
- Resultat-, Grid-, Sequenz- und Scorevalidierung liegen im Server;
- Einzahlungen, Verluste und Folgegates sind transaktional;
- npm-Audit meldet keine bekannte Schwachstelle.

Nicht bewiesen:

1. echter DOFUS-Client und aktueller Live-Patch;
2. reale Lichtintervalle und Salzkostensemantik;
3. reale Etage--1-Gruppenzahl;
4. Unique-Ressourcenverlust bei Niederlage;
5. Fragmentchancen an exakten Grenzwerten;
6. Finalstart bei laufenden Kämpfen;
7. Timerablauf im Live-Raid;
8. externer PostgreSQL-Netzwerkdienst und Multi-Instanz-Fan-out;
9. WAN, Backup, Restore, Failover und Penetrationstest;
10. vollständiges abhängiges Undo.

## 9. Widerspruchsprüfung

| Thema | Ergebnis |
|---|---|
| Licht 120 Sekunden | konfigurierbare `GUIDE_CONFIRMED`-Baseline, sichtbar nicht RAIDWEAVE-live bestätigt |
| Salz 1/3/6/10 | inkrementelle, kumulativ verbrauchte `GUIDE_CONFIRMED`-Baseline; Live-Test offen |
| Gruppen 18/20 | Sessionziel konfigurierbar, separates Evidenzflag |
| Score | bestätigt und ungesichert strikt getrennt |
| Unique-Verlust | nur als beobachteter Verlust mit Evidenzstatus |
| aktive Kämpfe beim Finalstart | unbestätigt kein unsichtbares hartes Gate |
| Luminarium | 4×4-Validierung, kein vorzeitig gebauter Solver |
| Exécrabe | vier eindeutige Formen und zweite Bestätigung |
| UI vs. Fachlogik | UI rendert; Server und Definition entscheiden |
| Sanctuaire | vollständige Regression bestanden |

## 10. Gate

Phase 8 ist für den implementierten Software- und Simulationsscope abgeschlossen. Vor einem echten Pilot müssen die priorisierten Gigalodon-Punkte aus `LIVE_TEST_CHECKLIST.md` im aktuellen DOFUS-Client geprüft werden.

## 11. Addendum v0.8.6.1

Phase 8.6.1 ersetzt die persönliche Salzannahme durch einen gemeinsamen, atomaren Pool und ergänzt Guide-Baseline-Licht, explizites `VICTORY`/`DEFEAT`, Soft Warnings und Pilotkorrekturen. Regressionen prüfen insbesondere: kein persönliches Salz, kumulative Auffüllkosten, parallele Pooländerungen, Etageninitialisierung, serverzeitbasierten Verfall, beide Finalergebnisse, Startsperre und exakt eine Revision/ein Event je Mutation.

Die aktualisierte 12-Client-Simulation schliesst 44/44 Tasks ab, konvergiert auf Revision/Event 155/155 und führt einen realistischen gemeinsamen Salzledger. Ein separater normaler Command-Ablauf deckt `DEFEAT`, Abschluss und die Sperre eines zweiten Starts ab. Die abschliessende vollständige Testmatrix ist im `PHASE8_6_1_RAID_TRUTH_AND_PILOT_HARDENING_REPORT.md` protokolliert.

Die offenen Licht-, Gruppen-, Unique-, Fragment-, Kampf-, Timer- und Disconnectregeln bleiben sichtbar und nicht automatisch blockierend. Phase 9B wurde nicht implementiert.
