# Codex Visual Implementation Plan

**Projektversion:** v0.8.5  
**Nächste Ausführung:** Phase 8.5B durch Codex  
**Zielversion nach Implementierung:** v0.8.6  
**Regel:** ausschliesslich visuelle Struktur, Komponentenkomposition, Microcopy und Präsentationscode ändern. Fachlogik, Commands, API-Verträge und Persistenz bleiben unverändert.

## 1. Unveränderliche Grenzen

Codex darf nicht ändern:

- `platform/src/core/*`-Fachlogik ausser rein typbezogener Importanpassung;
- `platform/src/server/*` und Datenbankmigrationen;
- Command-Namen, Payloads oder Berechtigungsregeln;
- Session-, Task-, Licht-, Ledger-, Score- oder Finalzustände;
- Revisions-, Event-, Outbox- oder SSE-Verträge;
- Definitionen `sanctuaire.v0.2.json` und `gigalodon.v0.2.json`;
- bestehende `data-testid`-Werte ohne gleichzeitige Testmigration;
- `LIVE_REQUIRED`-Semantik;
- Trennung von bestätigtem und ungesichertem Score;
- vier mobile Hauptziele;
- generischen Taskdrawer als Fallback.

## 2. Zu ändernde Dateien

### Primär

- `platform/app/page.tsx`
- `platform/app/globals.css`
- `platform/app/layout.tsx`
- `platform/components/CreateSessionForm.tsx`
- `platform/components/JoinForm.tsx`
- `platform/components/SessionApp.tsx`
- `platform/components/SanctuaireCommandCenter.tsx`
- `platform/components/GigalodonCommandCenter.tsx`

### Neu anzulegen

- `platform/components/brand/RaidweaveMark.tsx`
- `platform/components/icons/RaidIcon.tsx`
- `platform/components/layout/RouteFrame.tsx`
- `platform/components/layout/WorkbenchSheet.tsx`
- `platform/components/layout/PinnedNote.tsx`
- `platform/components/layout/StatusStamp.tsx`
- `platform/components/lobby/BriefingTicket.tsx`
- `platform/components/lobby/FormationBoard.tsx`
- `platform/components/lobby/DepartureGate.tsx`
- `platform/components/sanctuaire/GardenRoute.tsx`
- `platform/components/sanctuaire/PuzzleWorkbench.tsx`
- `platform/components/sanctuaire/CorridorRibbon.tsx`
- `platform/components/gigalodon/DepthRoute.tsx`
- `platform/components/gigalodon/LightBay.tsx`
- `platform/components/gigalodon/CargoManifest.tsx`
- `platform/components/gigalodon/FinalClearance.tsx`
- `platform/components/participant/MissionOrder.tsx`
- `platform/components/participant/NextOrderSlip.tsx`
- `platform/styles/authenticity.css`
- `platform/styles/raid-themes.css`
- `platform/styles/components.css`
- `platform/e2e/visual-authenticity.spec.ts`

## 3. Tokenmigration

Neue Quelle: `design-tokens.v0.8.5.json`.

### Zu ersetzen

| Alt | Neu |
|---|---|
| `font-display: Comfortaa` | `font-display: Gillius ADF No2` |
| `font-ui: Cabin` | `font-ui: Andika` |
| `font-mono: Cousine` | `font-mono: Go Mono` |
| universelles `surface-1/2/3` für jede Karte | Materialtokens `sheet`, `plate`, `note`, `strap`, `inset` |
| universelle Radien 10–14 px | Komponentenabhängige Kantenprofile |
| globale Card-Schatten | Schatten nur für Note, Drawer und echte Überlagerung |
| allgemeiner Theme-Glow | Glow nur `lumen` und aktive Route |
| `phase-pill` | Route-Knoten beziehungsweise schmale Wegmarken |
| `giga-metric` | Situationsstrap mit ungleichen Informationsgewichten |

### Beibehalten

- semantische Statusfarben;
- Risikoabstufungen;
- Fokusfarbe und Fokuskontrast;
- 4-px-Grundraster;
- 44-px-Touchminimum;
- Timer mit tabellarischen Ziffern;
- Breakpoints 390, 768, 1200, 1600.

## 4. Layoutumbau nach Komponente

### `HomePage`

- Hero nicht mehr als `.hero` mit zwei gleichwertigen Spalten bauen.
- Raidposter aus Definitionen rendern.
- `CreateSessionForm` zunächst auf Raidwahl und Sessionname reduzieren; erweiterte Felder progressiv öffnen.
- Join-Code-Dock sichtbar integrieren.
- vorhandene API-Aufrufe unverändert lassen.

### `Lobby`

- bestehende Daten in drei neue Präsentationskomponenten aufteilen: BriefingTicket, FormationBoard, DepartureGate.
- Team- und Teilnehmermutationen unverändert über bestehendes `command` ausführen.
- Ready-Check als gemeinsames Abmarschsignal darstellen.
- Invite-Rotation in sekundären Drawer verschieben.

### `CaptainView`

- gemeinsame Headerkennzahlen verdichten.
- Radar als `PinnedNote`-Liste darstellen.
- Taskgrid nur noch als Fallbacktab verwenden; raid-spezifische Command Centers bleiben Primäransicht.
- Activity Strip als schmale Einsatzchronik beibehalten.

### `SanctuaireCommandCenter`

- `sanctuaire-path` durch `GardenRoute` ersetzen.
- `puzzle-quartet` nicht mehr als vier identische Cards rendern.
- Transfers als sichtbare Verbindung zwischen Quell- und Zielknoten darstellen.
- Guardianstatus in Route beziehungsweise aktivem Workbench-Modul integrieren.
- CorridorDispatcher zum breiten `CorridorRibbon` umbauen.
- Raid-Leben als eigenständiges Siegel rendern.

### `GigalodonCommandCenter`

- `gigalodon-metrics` entfernen.
- `DepthRoute` permanent links halten.
- Lichtinformationen an Etagen binden und zusätzlich in einer kompakten `LightBay` bearbeiten.
- `ResourceLedger` als CargoManifest darstellen.
- Unique-Status nicht in vier gleichartigen Cards, sondern als priorisierte Frachtenliste.
- Finalreadiness in begründete Bänder umwandeln.

### `MissionView` und `GigalodonParticipantPanel`

- `mission-card` durch `MissionOrder` ersetzen.
- Ort/Team in eigenes Routenband verschieben.
- `ENSUITE` als `NextOrderSlip` darstellen.
- persönliche Kennzahlen auf maximal zwei kompakte Felder begrenzen.
- vorhandene Buttons, Commands und Resultatfelder funktional identisch halten.

## 5. Microcopy-Migration

Codex darf nur Präsentationstexte ändern, nicht fachliche Werte. Verbindliche Beispiele stehen in `VISUAL_ART_DIRECTION_V2.md` und `SCREEN_REDESIGN_SPECS.md`.

Alle neuen Texte müssen:

- französisch zuerst vorliegen;
- konkrete Person, Ort oder Ursache nennen, wenn verfügbar;
- `LIVE_REQUIRED` sichtbar lassen;
- keine neue Spiellogik behaupten;
- bei fehlenden Daten einen nächsten Auslöser nennen.

## 6. Implementierungsreihenfolge

### PR 1 – Foundations

- Fonts und Tokenmigration;
- neue Basiskomponenten;
- neue Marken- und Iconbasis;
- keine Screenkomposition ändern;
- bestehende Tests grün.

### PR 2 – Public + Lobby

- Landingpage;
- Join;
- Sessionerstellung;
- Lobby;
- 390- und 1440-Screenshots.

### PR 3 – Participant Mobile

- MissionOrder;
- NextOrderSlip;
- Gigalodon-Eigeninventar;
- mobile Navigation und Alerts;
- Touch- und Zoomprüfung.

### PR 4 – Sanctuaire Captain

- GardenRoute;
- PuzzleWorkbenches;
- Transfers;
- CorridorRibbon;
- Finalkopplung.

### PR 5 – Gigalodon Captain

- DepthRoute;
- LightBay;
- CargoManifest;
- FinalClearance;
- Radarpriorisierung.

### PR 6 – Regression und Cleanup

- ungenutzte alte Klassen entfernen;
- visuelle Regression;
- Accessibility;
- Build, Unit, Simulation, Reliability und E2E;
- v0.8.6-Übergabe.

## 7. Visuelle Abnahmekriterien

### Referenzvergleich

Codex erzeugt exakt diese fünf Screenshots:

- `landing-1440x900.png`
- `session-lobby-1440x900.png`
- `sanctuaire-captain-1440x900.png`
- `gigalodon-captain-1440x900.png`
- `participant-mobile-390x844.png`

Vergleichsbasis:

- `reference-authenticity/landing_1440x900.png`
- `reference-authenticity/session_lobby_1440x900.png`
- `reference-authenticity/sanctuaire_captain_1440x900.png`
- `reference-authenticity/gigalodon_captain_1440x900.png`
- `reference-authenticity/participant_mobile_390x844.png`

Es ist **keine Pixelkopie** erforderlich. Verbindlich sind Komposition, Informationsgewicht, Materiallogik und die Reduktion gleichartiger Cards.

### Messbare Kriterien

- keine Screenebene enthält mehr als drei direkt nebeneinanderliegende gleichartig gerahmte Cards;
- Landing Hero enthält keine Benefit-Card-Zweierreihe;
- Lobby zeigt Teamformation und Ready-Entscheidung ohne separaten Adminscreen;
- Sanctuaire zeigt Resultattransfers als sichtbare Verbindungen;
- Gigalodon bindet jedes sichtbare Lichtinstrument an eine Etage;
- Teilnehmer sieht Ort, Mission und Primäraktion innerhalb der ersten 620 px Höhe;
- `LIVE_REQUIRED` ist auf jedem betroffenen Screen lesbar;
- 390 px und 1440 px besitzen kein horizontales Kernscrolling;
- Touchziele mindestens 44 × 44 px;
- Textkontrast mindestens WCAG AA;
- Fokus ist auf jeder interaktiven Fläche sichtbar;
- `prefers-reduced-motion` besteht ohne Verlust von Statusinformation.

## 8. Technische Regression

Vor Abschluss müssen weiterhin bestehen:

- `npm run typecheck`;
- `npm run test`;
- Sanctuaire-Simulation;
- Gigalodon-Simulation;
- Reliability-Läufe;
- Produktionsbuild;
- bestehende Browser-E2E;
- neue visuelle Authenticity-E2E;
- npm-Audit ohne bekannte Schwachstellen.

## 9. Stop-Regeln für Codex

Codex stoppt und dokumentiert statt zu raten, wenn:

- eine visuelle Änderung einen Command- oder Statevertrag ändern würde;
- lange französische Texte nicht ohne Informationsverlust passen;
- eine Referenz gegen Accessibility verstösst;
- eine bestehende E2E-Annahme nur durch Datenlogikänderung erfüllbar wäre;
- eine offene Live-Regel als sicherer Gate-Text formuliert werden müsste.
