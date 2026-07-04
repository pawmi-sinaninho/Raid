# Codex Backlog

**Projektversion:** v0.8.6  
**Stand:** Phase 8.5B abgeschlossen; Phase 9B ist der nächste getrennt freizugebende Coding-Scope.

## Statuslegende

- `DONE`: implementiert und automatisiert geprüft;
- `PARTIAL`: Kern umgesetzt, klar benannte Erweiterung offen;
- `OPEN`: noch nicht implementiert;
- `SPECIFIED`: vollständig spezifiziert, aber noch nicht implementiert;
- `BLOCKED`: darf wegen eines vorgelagerten Gates noch nicht implementiert werden.

## C-001 – Schema in TypeScript-Verträge überführen — PARTIAL

Erledigt:

- JSON-Schema als Runtime-Vertrag mit Ajv 2020 integriert;
- beide Definitionen bei Build und Test validiert;
- ID-, Referenz- und DAG-Integrität geprüft;
- Verträge automatisch nach `platform/contracts/` synchronisiert.

Offen:

- CI-Pipeline ausserhalb des lokalen Repositories;
- formale Definition-Migrationen für spätere Versionen.

## C-002 – Definition Loader und Dependency Engine — PARTIAL

Erledigt:

- Definition Loader;
- TaskInstance-Erzeugung;
- `ALL` und `ANY`;
- idempotente Freischaltung im Mutationscommit.

Zusätzlich in Phase 7 erledigt:

- Definition-`dataTransfers`;
- Resultatbestätigungen;
- System-Gates und Sanctuaire-Automationen;
- abgeleitete Werte aus versionierten Lookup-Tabellen.

Offen:

- komplexere Wow-Layer-Regeln aus Phase 9;
- zukünftige komplexe Bedingungen, sobald Definitionen sie tatsächlich verwenden.

## C-003 – Serverautoritärer Sessionzustand — PARTIAL

Erledigt:

- PostgreSQL-Schema und Migration;
- transaktionale Commands;
- globale und Taskrevisionen;
- atomare Claims und Zähler;
- strukturierte Konflikte;
- Event-Outbox.

Offen:

- Test gegen externen PostgreSQL-Dienst;
- Belastung über viele parallele Sessions;
- finale Isolation- und Indexoptimierung aus realen Messdaten.

## C-004 – Realtime-Spike mit 16 Clients — DONE

Referenz: `REALTIME_TEST_REPORT.md` und `spike/`.

## C-005 – Anonyme Identität und Berechtigungen — PARTIAL

Erledigt:

- alle vier Rollen;
- Team-Editor-Scopes;
- gehashte Invite- und Recovery-Tokens;
- Rotation, Widerruf, Nutzungsgrenzen und Ablaufprüfung;
- Same-Origin-Prüfung.

Offen vor Pilot:

- produktive Rate Limits;
- Abuse-Schutz, Security-Header und Penetrationstest.

## C-006 – Eventlog, Snapshots und Undo — PARTIAL

Erledigt:

- Event pro bestätigter Mutation;
- Revision/Event-Invariante;
- Outbox;
- Snapshot-Speicherung;
- Eventcursor und Reconnect.

Offen:

- periodische Snapshotstrategie;
- abhängige Undo-Analyse;
- Kompensation oder Snapshot-Restore in der Produktoberfläche.

## C-007 – Generischer Task-Renderer — DONE

- Definitionsfelder und UI-Hinweise;
- statusabhängige Aktionen;
- Desktop-Drawer und Mobilebedienung;
- Rollen- und Konfliktfehler über den Command-Vertrag.

Sanctuaire- und Gigalodon-Primärmodule sind umgesetzt.

## C-008 – Raid-spezifische Module — DONE

Erledigt:

- Sanctuaire vollständig in Phase 7;
- Gigalodon vollständig in Phase 8;
- Datenübertragungen und Score-/Gate-Regeln aus Definitionen statt UI-Hardcoding.

## C-009 – Luminarium-Algorithmus — OPEN

Bleibt bewusst ausserhalb von Phase 8; nur nach separater Nutzen- und Rechtsprüfung.

## C-010 – Automatisierte Tests und Deployment — PARTIAL

Erledigt:

- Schema-, Unit-, Integration-, Race-, Rollen- und Recovery-Tests;
- zehn Zuverlässigkeitsläufe gegen den Plattformkern;
- Browser-E2E für 390 px und 1440 px;
- npm-Audit ohne bekannte Schwachstellen.

Offen:

- automatisierte Accessibility-Audits;
- externer PostgreSQL-/Multi-Instanz-Test;
- Monitoring, Backup, Restore, Rollback und Statusseite.

## C-011 – Designsystem technisch anbinden — PARTIAL

Erledigt:

- Design-Tokens als Buildvertrag synchronisiert;
- Core-, Semantic- und Raid-Theme-Variablen angebunden;
- responsive Kernansichten und reduzierte Bewegung berücksichtigt.

Offen:

- vollständige visuelle Regression gegen alle vier Referenzscreens;
- eigene finale SVG-Iconbibliothek;
- automatisierte Accessibility-Prüfung.

## C-012 – Plattformkern auf PostgreSQL übertragen — PARTIAL

Erledigt:

- Migrationen;
- bedingte Updates und Transaktionen;
- Event-Outbox;
- PostgreSQL-Notification-Pfad;
- SSE-Cursor und Snapshot-Fallback.

Offen:

- echter Zwei-Instanzen-Test gegen externes PostgreSQL.

## C-013 – Lobby, Teams und Ready-Check — DONE

- Sessionerstellung und getrennte Links;
- Teilnehmerliste und Teams;
- Editor-Scope;
- Ready-Check;
- Sessionstart und serverautoritärer Timer.

## C-014 – Mission und Captain-Kernansichten — DONE

- persönliche Mission;
- Captain Radar Basis;
- unbesetzte, blockierte und veraltete Aufgaben;
- Mobile- und Desktopnavigation.

## C-015 – Sanctuaire-Rätselmodule — DONE

- Boote, Schach, Monochrome und Clos als raid-spezifische Module;
- serverseitige Feldvalidierung;
- Bestätigungsworkflow;
- bestätigte Datenübertragung.

## C-016 – Sanctuaire Raid-Leben und Wächter — DONE

- Lebenshistorie, Ursache und Korrekturbezug;
- vier Wächterkarten;
- übertragene und abgeleitete Mechanikdaten;
- raid-spezifische Radarwarnungen.

## C-017 – Sanctuaire Korridor und Finale — DONE

- konfigurierbares Ziel mit Evidenzstatus;
- Solokampfzuweisungen und Fortschritt;
- getrennte Finalbossteams;
- Sessionende erst nach beiden Siegen.

## C-018 – Sanctuaire End-to-End-Test — DONE

- 49/49 Tasks;
- 16/16 Clients konvergiert;
- 177 Revisionen und 177 Events;
- Mobile- und Desktop-E2E;
- `LIVE_REQUIRED` sichtbar;
- Fachlogik ausserhalb der UI.

## Weiterhin nicht vorzeitig festlegen

- konkreter Hostinganbieter;
- konkreter Managed-Realtime-Anbieter;
- finale Datenbankoptimierung;
- PWA-/Overlay-Ausbau.


## C-019 – Gigalodon-Licht und Etagen — DONE

- fünf Etagenlichtzustände mit Serverzeit und Countdown;
- konfigurierbares Intervall und Evidenz;
- Etage--1-Ziel, Zugänge und Fragmente;
- Licht- und Etagenwarnungen im Radar.

## C-020 – Gigalodon-Ressourcen und Score — DONE

- persönliches Ledger;
- Einzahlungen und Verlusthistorie;
- bestätigter Score getrennt von Score at risk;
- Unique- und Pincen-Träger.

## C-021 – Gigalodon-Bosse und Finale — DONE

- Mureine, Luminarium, Exécrabe und Willorque;
- Finalbereitschaft mit Evidenzstatus;
- drei Schadensrunden und Bonusschwellen;
- vollständige 12-Client-Simulation.

## C-022 – Wow Layer — SPECIFIED / READY FOR SEPARATE SCOPE

Verbindliche Spezifikation:

- `WOW_LAYER_SPECIFICATION.md`;
- `PHASE9A_VALIDATION_REPORT.md`.

Spezifiziert:

- Live Raid Map für Sanctuaire und Gigalodon;
- Smart Next Action für Teilnehmer, Captain und Editor;
- Risk Engine mit Vertrauensstatus;
- struktureller kritischer Pfad und Engpässe;
- Replay Summary mit Eventvollständigkeit;
- lokale opt-in Sounds;
- informationshaltige Motion;
- Desktop, Tablet, Mobile, Accessibility, Performance und Tests.

Implementierungsgate:

- Phase 8.5B ist als v0.8.6 regressionssicher abgeschlossen;
- bestehende Fach-, API-, Realtime-, Raiddefinitions- und Berechtigungsverträge bleiben unverändert;
- ein neuer Replay-Endpunkt darf nur additiv und read-only sein;
- kein automatischer Command und keine zweite persistierte Wahrheit.

Ziel nach Freigabe: Phase 9B Wow Layer Implementation.

## C-023 – Visual Authenticity Implementation — DONE

**Reihenfolge:** Dieser Scope wird vor C-022 implementiert. Phase-9A-Spezifikation darf nicht in denselben PR-Scope gezogen werden.

Verbindliche Eingaben:

- `VISUAL_AUTHENTICITY_AUDIT.md`;
- `VISUAL_ART_DIRECTION_V2.md`;
- `SCREEN_REDESIGN_SPECS.md`;
- `CODEX_VISUAL_IMPLEMENTATION_PLAN.md`;
- `design-tokens.v0.8.5.json`;
- `reference-authenticity/`.

Scope:

- Landing, Join/Create, Lobby, Teilnehmer-Mobile, Sanctuaire Captain und Gigalodon Captain visuell umbauen;
- neue Material-, Route-, Notiz- und Manifestkomponenten;
- eigene SVG-Iconbasis;
- visuelle Regression;
- vollständige technische Regression;
- Zielversion v0.8.6.

Nicht im Scope:

- Fachlogik, Raiddefinitionen, API, Realtime, Persistenz oder Phase-9-Wow-Funktionen.

Ergebnis v0.8.6:

- Foundations, Fonts und Tokens migriert;
- Landing, Join/Create, Lobby, Teilnehmer-Mobile und beide Captain-Screens umgesetzt;
- neue Marken-, Icon-, Material-, Route-, Notiz-, Formation-, Mission-, Manifest- und Freigabekomponenten integriert;
- französische Präsentations-Microcopy, Responsive, Accessibility und Reduced Motion abgeschlossen;
- fünf Abnahmescreenshots erzeugt;
- vollständige technische und visuelle Regression grün;
- geschützte Verträge bytegleich zur Ausgangsbasis;
- Abschlussbericht: `PHASE8_5B_IMPLEMENTATION_AND_TEST_REPORT.md`.

## C-024 – Raid Truth Reconciliation & Pilot Hardening — DONE

Zielversion: `v0.8.6.1`.

- Gigalodon-Salz von persönlichem Inventar in einen serverautoritativen gemeinsamen Pool migriert;
- Guide-Baseline für Lichtinitialisierung, 120-Sekunden-Verfall und kumulative Kosten `1/3/6/10` versioniert und sichtbar als nicht live bestätigt markiert;
- Finalergebnis `VICTORY`/`DEFEAT` mit getrenntem Schaden, Ressourcenscore, Finalbonus und Gesamtscore;
- Sanctuaire-Korridor auf die Guide-Baseline `10 × 6 = 60` korrigiert und konfigurierbar belassen;
- Etagenpositionen vollständig gegen die Projektquellen auditiert; unbekannte Werte bleiben explizit offen;
- Quellenstatus auf `OFFICIAL_CONFIRMED`, `GUIDE_CONFIRMED`, `LIVE_CONFIRMED`, `LIVE_REQUIRED` und `PLAYER_CORRECTED` vereinheitlicht;
- unbestätigte Raidregeln als übersteuerbare Soft Warnings statt als harte Gates;
- abgegrenzter Pilotkanal `Information incorrecte` mit berechtigter Bestätigung;
- Migration, Regression, Simulationen und Phase-8.6.1-E2E ergänzt;
- Phase 9B und Wow-Layer-Funktionen ausdrücklich nicht implementiert.

Abschlussbericht: `PHASE8_6_1_RAID_TRUTH_AND_PILOT_HARDENING_REPORT.md`.
