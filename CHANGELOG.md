# Changelog

## v0.8.6.1 – 28.06.2026

- Phase 8.6.1 Raid Truth Reconciliation & Pilot Hardening abgeschlossen;
- Gigalodon-Salz als atomaren gemeinsamen Raidpool mit Actor-/Zeit-/Ursachenledger umgesetzt und aus persönlichen Inventaren entfernt;
- einmalige revisions- und eventkonsistente Migration bestehender Sessions auf Definition `0.2.1` ergänzt;
- Lichtbaseline Etage −1 = 4, neue Etagen −2 bis −5 = 1, 120-Sekunden-Verfall und kumulative Schritte 1/3/6/10 versioniert und sichtbar guidebasiert markiert;
- `VICTORY` und `DEFEAT` als abschliessende Finalergebnisse mit getrennten Schadensrunden und Scorebestandteilen ergänzt;
- Sanctuaire-Korridor auf konfigurierbare Guide-Baseline 10 × 6 = 60 bereinigt;
- Gigalodon-Positionslookup vervollständigt; unbelegte Werte bleiben offen statt geschätzt;
- fachliche Quellenstatus vereinheitlicht und verbleibende Live-Fragen als Soft Warnings formuliert;
- additive Aktion `Information incorrecte` mit berechtigter `PLAYER_CORRECTED`-Bestätigung ergänzt;
- UI, Definitionen, Schema, Migration, Commands, Snapshots, Tests und Simulationen konsistent aktualisiert;
- Phase 9B und sämtliche Wow-Layer-Funktionen nicht implementiert.

## v0.8.6 – 28.06.2026

- Phase 8.5B Visual Authenticity Implementation vollständig abgeschlossen;
- Foundations auf die v0.8.5-Tokenbasis migriert und drei lokal gebündelte, lizenzierte Schriftfamilien integriert;
- eigene RAIDWEAVE-Marke, SVG-Iconbasis und Material-, Route-, Workbench-, Notiz- und Statuskomponenten eingeführt;
- Landing, Session erstellen/beitreten und Lobby in der Art Direction `Field-built Raid Desk` neu aufgebaut;
- Teilnehmer-Mobile als persönlicher Missionsauftrag mit sichtbarer Primäraktion im ersten Viewport umgesetzt;
- Sanctuaire Captain als Gartenroute, vier Puzzle-Arbeitsflächen, Wächtertore, Corridor Ribbon und Finalsplit umgesetzt;
- Gigalodon Captain als Tiefenroute, Light Bay, Cargo Manifest und Final Clearance umgesetzt;
- französische Präsentationslokalisierung für dynamische Missionen, Rollen, Status und Captain-Radar ergänzt, ohne Raiddefinitionen zu ändern;
- 390-, 768-, 1440- und 1920-px-Verhalten ohne horizontales Kernscrolling abgenommen;
- WCAG-AA-Kontrast, Tastaturfokus, Dialog-Fokusfalle und Reduced Motion geprüft;
- Windows-stabilen Playwright-Produktionsserver-Runner und robuste Test-Seeds ergänzt;
- fünf verbindliche v0.8.6-Abnahmescreenshots erzeugt;
- Typecheck, 26 Unit-/Integrationstests, beide vollständigen Raid-Simulationen, 10 Reliability-Läufe, Produktionsbuild, 6 bestehende Browser-E2Es, 7 Visual-E2Es und 2 A11y-Prüfungen bestanden;
- npm-Audit mit 0 bekannten Schwachstellen abgeschlossen;
- Fachlogik, Raiddefinitionen, API, Commands, Realtime, Persistenz, Rollen, Berechtigungen und `LIVE_REQUIRED`-Semantik unverändert belassen;
- Phase 9B und sämtliche Wow-Layer-Funktionen ausdrücklich nicht implementiert.

## v0.8.5.1 – 27.06.2026

- Phase 9A als vollständige Wow-Layer-Spezifikation abgeschlossen;
- Live Raid Map für Sanctuaire und Gigalodon mit verbindlicher Task-/Phasenzuordnung definiert;
- Smart Next Action mit Kandidaten, Scoring, Rechteprüfung, Tie-Breakern und Erklärbarkeit spezifiziert;
- gemeinsame und raid-spezifische Risk Engine mit Datenvertrauen und Deduplizierung erstellt;
- `Chemin critique structurel` statt nicht belastbarer Zeitprognose festgelegt;
- Engpasstypen, Folgeauswirkung und parallele Pfadregeln definiert;
- Replay Summary mit Eventvollständigkeit, Partial State, Kapiteln, Highlights und erlaubten Kennzahlen spezifiziert;
- optionalen additiven read-only Replay-Eventendpunkt abgegrenzt, ohne bestehende API-Verträge zu verändern;
- lokale opt-in Sounds mit Rollenfilter, Dedupe und Cooldown definiert;
- informationshaltige Motion und Reduced-Motion-Verhalten spezifiziert;
- Visual-Art-Direction v0.8.5 auf Map, Risk Notes, Critical Thread und Replay übertragen;
- Desktop-, Tablet-, Mobile- und Captain-Notbetrieb vollständig beschrieben;
- französische Microcopy, Accessibility, Performance, Tests und visuelle Abnahme festgelegt;
- `PHASE9A_VALIDATION_REPORT.md` ergänzt;
- Produktcode, Raiddefinitionen, Fachlogik, API, Realtime, Persistenz und Berechtigungen unverändert belassen;
- Phase 8.5B bleibt nächster technischer Schritt mit Zielversion v0.8.6; Phase 9B bleibt bis dahin gesperrt.

## v0.8.5 – 27.06.2026

- Visual-Authenticity-Audit der tatsächlich implementierten Landing-, Lobby-, Captain- und Mobile-Screens erstellt;
- gleichförmige Dark-Dashboard-, Card-, Metrik- und Symmetriemuster konkret dokumentiert;
- neue Art Direction `Field-built Raid Desk` festgelegt;
- Route, Übergabe, Verantwortung und Entscheidung als primäre visuelle Hierarchie definiert;
- kontrollierte Unregelmässigkeit mit stabilen UX- und Accessibility-Grenzen eingeführt;
- Zieltypografie auf Gillius ADF No2, Andika, Go Mono und punktuelles EB Garamond SC umgestellt;
- Materialsystem aus Sheet, Plate, Note, Strap, Manifest, Route und Stamp definiert;
- eigenständige Icon- und Illustrationslogik für beide Raidwelten spezifiziert;
- Microcopy von generischen Systembegriffen auf konkrete Einsatzsprache umgestellt;
- Landingpage, Session-Lobby, Sanctuaire Captain, Gigalodon Captain und Teilnehmer-Mobile vollständig neu konzipiert;
- fünf editierbare HTML-Referenzen und fünf PNG-Abnahmebilder erzeugt;
- `design-tokens.v0.8.5.json` als neue Implementierungsquelle ergänzt;
- `CODEX_VISUAL_IMPLEMENTATION_PLAN.md` mit Dateien, Komponenten, Tokenmigration, PR-Reihenfolge, Stop-Regeln und Abnahme erstellt;
- `PHASE8_5_VALIDATION_REPORT.md` ergänzt;
- Fachlogik, API, Realtime, Persistenz und Raiddefinitionen unverändert belassen;
- Phase 9 hinter die Codex-Implementierung Phase 8.5B verschoben.

## v0.8.0 – 27.06.2026

- vollständige Gigalodon-Implementierung auf dem bestehenden Plattform- und Raid-State-Kern erstellt;
- Sessionstatus `FINAL_PREP` und `FINAL_ACTIVE` sowie Migration `0003_gigalodon.sql` ergänzt;
- Gigalodon-State für Etagen, Licht, Inventare, Einzahlungen, Verluste, Fragmente, Unique, Finalcheck und Finalkampf umgesetzt;
- Etage--1-Ziel konfigurierbar und getrennten In-Game-Evidenzstatus implementiert;
- fünf serverautoritativ zeitgestempelte Lichtzustände mit Countdown und Verantwortlichem gebaut;
- Lichtintervall und Salzkostensemantik sichtbar `LIVE_REQUIRED` belassen;
- getragenen Score und bestätigten Score strikt getrennt;
- transaktionale Einzahlungen und unveränderliche Einzahlungs-/Verlusthistorien umgesetzt;
- Unique-Ressourcenrisiko ohne unbestätigte Verlustannahme modelliert;
- Mureine-, Luminarium-, Exécrabe- und Willorque-Module implementiert;
- 4×4-Luminarium-Feldvalidierung ergänzt, ohne eigenen Solver vorzeitig zu bauen;
- Exécrabe-Sequenz mit vier eindeutigen Formen und Zweitbestätigung umgesetzt;
- Fragmente, Pincen-Träger, Unique-Halter und Zugänge definitionsgetrieben verbunden;
- Finalstartcheck in blockiert, unbestätigt und bereit getrennt;
- drei Gigalodon-Schadensrunden, Verschluckstatus und versionierte Bonusschwellen umgesetzt;
- Gigalodon-spezifischen Captain Radar und Teilnehmerkontext ergänzt;
- responsive Gigalodon-Primäransicht für 390 × 844 und 1440 × 900 integriert;
- vollständige 12-Client-Simulation mit 44/44 Tasks und 153/153 Revisionen/Events bestanden;
- Sanctuaire-Regressionssimulation mit 49/49 Tasks und 177/177 Revisionen/Events bestanden;
- 26/26 Unit-/Integrationstests bestanden;
- zehn Reliability-Läufe mit 500/500 Burst-Updates bestanden;
- 6/6 Browser-E2E-Szenarien auf Mobile und Desktop bestanden;
- npm-Audit auf 0 bekannte Schwachstellen bestätigt;
- `GIGALODON_IMPLEMENTATION_ARCHITECTURE.md` und `PHASE8_TEST_REPORT.md` ergänzt;
- Phase 8 abgeschlossen und Phase 9 Wow Layer vorbereitet.

## v0.7.0 – 27.06.2026

- vollständige Sanctuaire-Implementierung auf dem bestehenden Plattformkern erstellt;
- persistentes `raid_state` und automatische Initialisierung aus dem Definition-`stateModel` ergänzt;
- zweite Datenbankmigration und automatische Ausführung sortierter Migrationen implementiert;
- getrennte Commands für Resultatentwurf, Einreichung und Bestätigung eingeführt;
- serverseitige Definitionvalidierung für Pflichtfelder, Typen, Enums und Mengenregeln umgesetzt;
- `SELF`, `SECOND_PERSON`, `CAPTAIN` und `SYSTEM` als Bestätigungsrichtlinien erzwungen;
- sechs definitionsbasierte Sanctuaire-Datenübertragungen angebunden;
- abgeleitete Sentinelle- und Clos-Werte aus versionierten Lookup-Tabellen implementiert;
- Automationen, Dependencies, System-Gates und Transfers in derselben Domaintransaktion ausgeführt;
- vier parallele Rätselmodule für Boote, Schach, Monochrome und Clos gebaut;
- Raid-Leben mit Ursache, Actor, Zeit, Task- und Korrekturbezug umgesetzt;
- vier Wächterkarten mit übertragenen Mechanikdaten erstellt;
- konfigurierbares Korridorziel, Evidenzstatus, Fortschritt und Spielerzuweisungen implementiert;
- Reine Écarlate und Princesse Maudite getrennt verfolgt und gemeinsame Abschlussbedingung umgesetzt;
- Sanctuaire-spezifischen Captain Radar ergänzt;
- responsive Sanctuaire-Primäransicht und Resultatformulare integriert;
- vollständige 16-Client-Simulation mit 49/49 Tasks und 177/177 Revisionen/Events bestanden;
- 18/18 Unit-/Integrationstests bestanden;
- zehn Reliability-Läufe mit 500/500 Burst-Updates bestanden;
- 4/4 Browser-E2E-Szenarien auf 390 × 844 und 1440 × 900 bestanden;
- npm-Audit auf 0 bekannte Schwachstellen bestätigt;
- `SANCTUAIRE_IMPLEMENTATION_ARCHITECTURE.md` und `PHASE7_TEST_REPORT.md` ergänzt;
- Phase 7 abgeschlossen und Phase 8 Gigalodon vorbereitet.

## v0.6.0 – 26.06.2026

- produktnahes Next.js-/TypeScript-Repository `platform/` erstellt;
- Phase-5-Spike unverändert als technische Referenz erhalten;
- PostgreSQL-Schema und Startmigration für alle Plattformentitäten implementiert;
- PGlite als ausschliesslich lokalen PostgreSQL-kompatiblen Testmodus ergänzt;
- Definition Loader, Schema- und Integritätsvalidierung für beide Raiddefinitionen umgesetzt;
- TaskInstances aus versionierten Definitionen erzeugt;
- generische `ALL`-/`ANY`-Dependency-Auswertung und atomare Folgefreischaltung implementiert;
- serverautoritative Commands, Sessionrevisionen, Taskrevisionen, Claims und Zähler umgesetzt;
- DomainEvent und Event-Outbox im selben transaktionalen Commit implementiert;
- exklusives Outbox-Claiming, PostgreSQL `LISTEN/NOTIFY` und SSE-Cursor-Recovery ergänzt;
- Captain-, Editor-, Teilnehmer- und Zuschauerrechte vollständig umgesetzt;
- teambezogenen Editor-Scope serverseitig erzwungen;
- getrennte Invites, Rotation, Widerruf, Ablaufprüfung und anonyme Recovery implementiert;
- Lobby, Teams, Ready-Check und serverautoritativen Sessionstart gebaut;
- generischen Task-Renderer, persönliche Mission und Captain-Radar-Basis erstellt;
- Aktivitätsverlauf und responsive Vier-Ziele-Navigation integriert;
- Phase-4-Tokens und beide Raidthemes technisch angebunden;
- 10/10 Unit-/Integrationstests bestanden;
- 10/10 Zuverlässigkeitsläufe mit je 16 Rollen und insgesamt 500/500 Burst-Updates bestanden;
- 4/4 Browser-E2E-Szenarien für 390 × 844 und 1440 × 900 bestanden;
- npm-Audit auf 0 bekannte Schwachstellen bereinigt;
- `PLATFORM_CORE_ARCHITECTURE.md` und `PHASE6_TEST_REPORT.md` ergänzt;
- Phase 6 abgeschlossen und Phase 7 Sanctuaire vorbereitet.

## v0.5.0 – 26.06.2026

- technischen Realtime-Spike als ausführbaren TypeScript-Unterordner erstellt;
- Session-, Teilnehmer-, Task-, Timer- und Eventmodell implementiert;
- HTTP-Command-API und Server-Sent Events als Realtime-Vertrag validiert;
- getrennte Captain-, Teilnehmer- und Zuschauer-Invites umgesetzt;
- Invite- und Recovery-Tokens nur gehasht gespeichert;
- globale Sessionrevision und Taskrevisionen eingeführt;
- exklusive Claims und atomare Zähler transaktional umgesetzt;
- explizite `409 REVISION_CONFLICT`-Antworten implementiert;
- serverautoritativen Timer, Reconnect und Serverneustartpersistenz geprüft;
- Eventlog-Invariante `session.revision == eventCount` validiert;
- zehn Wiederholungsläufe mit je 16 Clients erfolgreich ausgeführt;
- 500 von 500 schnellen Updates bestätigt;
- lokale Push-Latenz und Burst-Dauer dokumentiert;
- Architekturentscheidung auf Next.js, TypeScript, PostgreSQL, HTTP-Commands und SSE finalisiert;
- SQLite als reine Spike-/Testtechnologie abgegrenzt;
- Phase 5 abgeschlossen und Phase 6 Plattformkern vorbereitet.

## v0.4.0 – 26.06.2026

- öffentlichen Produktnamen `RAIDWEAVE` und Markenrichtung festgelegt;
- Weave-Node-Signet, Wortmarkenlogik, Positionierung und Microcopy definiert;
- visuelles System in Core-, Semantic- und Raid-Theme-Ebene strukturiert;
- vollständige Farb-, Typografie-, Abstands-, Geometrie-, Icon-, Motion- und Accessibility-Regeln erstellt;
- maschinenlesbare Design-Tokens ergänzt;
- alle Task-, Risiko-, Verbindungs-, Konflikt-, Datenfrische- und Bestätigungszustände visuell spezifiziert;
- gemeinsame Komponentenverträge für Captain Desktop und Teilnehmer Mobile erstellt;
- Sanctuaire als botanisch-königliche Garten-Kommandozentrale gestaltet;
- Gigalodon als vertikales Tiefsee-Expeditionsinstrument gestaltet;
- vier statische High-Fidelity-Referenzscreens als HTML und PNG erstellt;
- Kontraste und Artefaktabdeckung validiert;
- Phase 4 abgeschlossen und Phase 5 als technischer Realtime-Spike festgelegt;
- bestehende Raiddefinitionen und Phase-3-JSON-Verträge fachlich unverändert belassen.


## v0.3.1 – 26.06.2026

- konsolidierte Master-Datei als einzige ChatGPT-Projektquelle eingeführt;
- vollständiger ZIP-Ordner als exaktes versionsgebundenes Archiv bestätigt;
- dreifach angehängte Abschnitte in README, UI-Architektur, Datenmodell und Entscheidungslog bereinigt;
- logisch invertierten Satz im Phase-3-Validierungsbericht korrigiert;
- Entscheidungslog um verbindlichen Quellen- und Versionsworkflow ergänzt;
- keine fachlichen Raiddefinitionen oder JSON-Verträge verändert.

## v0.3 – 26.06.2026

- gemeinsames JSON-Schema für versionierte Raiddefinitionen erstellt;
- Sanctuaire und Gigalodon vollständig maschinenlesbar modelliert;
- vollständige Clos-Zuordnung aus Statue, Farbe, Zielmonster und Karte ergänzt;
- Guideangabe zum Reset aller versenkten Papierboote bei Fehler als weiterhin live zu bestätigende Regel erfasst;
- Phasen, Aufgaben, Statusmaschine, Zuweisungen, Eingabefelder und Abschlussbedingungen formalisiert;
- Abhängigkeiten, Scoreregeln, Warnungen, Automationen und Datenübertragungen explizit erfasst;
- unsichere Regeln als `LIVE_REQUIRED` konfigurierbar gemacht;
- Screen-Inventar für öffentliche Ebene, Lobby, Captain, Teilnehmer, Editor und Zuschauer erstellt;
- Low-Fidelity-Wireframes für alle kritischen Nutzerabläufe erstellt;
- generischen Task-Detail-Fallback als verbindlichen UI-Vertrag festgelegt;
- Schema-, ID-, Referenz- und Task-Graph-Abdeckung validiert;
- Entscheidungslog um Datenmodell- und UX-Verträge erweitert;
- Roadmap-Phasennummerierung an den tatsächlichen Projektablauf angepasst;
- Codex-/Implementierungsarbeiten separat abgegrenzt.

## v0.2 – 26.06.2026

- vollständiger Sanctuaire-Aufgaben- und Abhängigkeitsgraph;
- vollständiger Gigalodon-Aufgaben- und Abhängigkeitsgraph;
- globale Licht-, Inventar-, Score- und Risikoprozesse;
- automatische Datenübertragungen zwischen Rätseln und Kämpfen;
- Captain-Radar-Warnregeln;
- vollständige Live-Testcheckliste;
- offene Quellenwidersprüche explizit markiert;
- Projektstatus und nächster Schritt aktualisiert.

## v0.1 – 26.06.2026

- erste verbindliche Produktspezifikation;
- Zielgruppen und Jobs to be done;
- V1-Scope und Nichtziele;
- einzigartige Kernmechaniken;
- User Flows;
- Featurepriorisierung;
- UI-Architektur;
- Realtime- und Datenmodell;
- Raidgrundlagen;
- offene Live-Fragen;
- Roadmap und Projektstatus.
