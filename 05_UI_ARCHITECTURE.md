# UI Architecture

## 1. Designrichtung

**Stimmung:** hochwertige Fantasy-Kommandozentrale, nicht generisches SaaS-Dashboard.

### Leitlinien

- eigene Formen, Icons und Texturen;
- starke Informationshierarchie;
- wenige dominante Farben pro Raid;
- subtile Bewegung, keine dauernden Effekte;
- grosse Statuszahlen und klare Symbole;
- Karten und Wege statt Tabellen, wo räumliche Zusammenhänge wichtig sind;
- Standardkarten nur dort, wo sie die Bedienung verbessern.

### Visuelle Identität pro Raid

**Sanctuaire**

- botanisch, verwunschen, königlich;
- organische Rahmen, Papier-, Garten- und Glasdetails;
- Fortschritt wie ein Weg zur Schlosstour.

**Gigalodon**

- Tiefsee, Druck, Dunkelheit, Licht;
- leuchtende Signale, Tiefenebenen, vertikale Abwärtsbewegung;
- Timer und Ressourcen wirken wie Expeditionsinstrumente.

## 2. Informationsarchitektur

### Öffentliche Ebene

1. Landingpage;
2. Raid auswählen;
3. Session erstellen;
4. Session beitreten.

### Sessionebene

1. Lobby;
2. Live Command Center;
3. persönliche Mission;
4. Raidkarte;
5. Detailmodul;
6. Verlauf;
7. Zusammenfassung;
8. Einstellungen.

## 3. Captain Desktop

### Fixierter Kopfbereich

- Raidname;
- Restzeit;
- Score;
- Raid-Leben oder Hauptrisiko;
- Teilnehmerstatus;
- Verbindung.

### Hauptfläche

- visuelle Raidkarte;
- Phasen und Abhängigkeiten;
- aktive Teams;
- blockierte Aufgaben.

### rechte Kontrollspalte

- Captain Radar;
- neue Meldungen;
- unbesetzte Aufgaben;
- kritische Warnungen.

### untere Aktivitätsleiste

- jüngste Änderungen;
- Rückgängig;
- Filter.

## 4. Teilnehmer Mobile

### Oberer Bereich

- Restzeit;
- persönlicher Status;
- Verbindung.

### Hauptkarte

- aktuelle Mission;
- Ort;
- Team;
- benötigte Information;
- Aktion: Starten, Abschliessen, Problem melden.

### Sekundär

- danach;
- Teamstatus;
- kompakte Raidübersicht.

### Navigationsprinzip

Maximal vier Hauptziele:

- Mission;
- Raid;
- Team;
- Meldungen.

## 5. Zentrale Komponenten

| Komponente | Zweck |
|---|---|
| `RaidHeader` | globale Kennzahlen |
| `RaidMap` | Phasen und Wege |
| `PhaseNode` | Status einer Phase |
| `TaskCard` | Aufgabe und Verantwortliche |
| `MissionCard` | persönliche nächste Aktion |
| `TeamChip` | Teamzuordnung |
| `ParticipantAvatar` | Person, Klasse, Verbindung |
| `SharedTimer` | synchroner Timer |
| `RiskBadge` | Warnstufe |
| `CaptainRadar` | Ausnahmen statt Vollständigkeit |
| `ActivityTimeline` | Verlauf und Rückgängig |
| `ResourceLedger` | getragen/eingezahlt |
| `FloorLightPanel` | Licht pro Ebene |
| `RaidLifeCounter` | Raid-Leben mit Historie |
| `DependencyHint` | was blockiert und warum |
| `ReadyCheck` | Startfreigabe |

## 6. Interaktionsregeln

- Statusänderungen benötigen höchstens zwei Klicks.
- Abschluss einer Aufgabe öffnet nur relevante Ergebnisfelder.
- kritische Aktionen verwenden Bestätigung oder Undo.
- Farben werden immer zusätzlich durch Text/Symbol ergänzt.
- keine versteckten horizontalen Scrollbereiche auf Mobile.
- Teilnehmer sehen standardmässig nicht alle Captain-Details.
- komplexe Mechaniktexte erscheinen als „Warum?“ oder „Mechanik anzeigen“.

## 7. Animationen

Erlaubt:

- Phasenweg wird beim Freischalten sichtbar;
- Fortschrittszahlen zählen sanft;
- neue Mission gleitet ein;
- kritische Warnung pulsiert begrenzt;
- erledigte Aufgabe bestätigt kurz visuell.

Nicht erlaubt:

- dauernde Partikel über Inhalt;
- lange Seitenübergänge;
- Effekte, die Timer oder Warnungen verdecken;
- Animationen ohne Informationswert.

## 8. Responsive Zielgrössen

- 390 × 844: Smartphone;
- 768 × 1024: Tablet/zweiter Bildschirm;
- 1440 × 900: Captain Desktop;
- 1920 × 1080: grosse Raidübersicht/Stream.

## 9. Barrierefreiheit

- Tastaturbedienung;
- sichtbarer Fokus;
- ausreichende Kontraste;
- Status nicht nur über Farbe;
- reduzierte Bewegung respektieren;
- Buttons mindestens 44 × 44 px auf Touch;
- klare französische Begriffe ohne unnötige Abkürzungen.

## 10. Verbindliche Phase-3-Artefakte

- `SCREEN_INVENTORY.md` definiert alle Screens, Rollen, Zustände und Task-Abdeckungen.
- `WIREFRAMES.md` definiert die Low-Fidelity-Informationshierarchie und Kerninteraktionen.
- Raid-spezifische Primärscreens ergänzen den generischen `TASK-200`-Fallback; sie ersetzen ihn nicht.


## 11. Verbindliche Phase-4-Artefakte

Die visuelle Implementierung folgt ab v0.4.0 diesen Verträgen:

- `BRAND_DIRECTION.md`: öffentlicher Produktname `RAIDWEAVE`, Markencharakter, Wortmarke, Signet und Microcopy;
- `DESIGN_SYSTEM.md`: Core-, Semantic- und Raid-Theme-Ebene;
- `design-tokens.v0.4.json`: maschinenlesbare Tokenquelle;
- `COMPONENT_VISUAL_SPECS.md`: Komponentenmasse, Varianten und Querschnittszustände;
- `SANCTUAIRE_REFERENCE_SCREENS.md` und `GIGALODON_REFERENCE_SCREENS.md`: thematische Implementierungsbaseline;
- `reference/*.png`: visuelle Abnahmebilder;
- `reference/*.html`: statische, bearbeitbare Designquellen.

### Verbindliche Theme-Regel

Taskstatus, Risiken, Verbindung, Datenfrische und Bestätigung verwenden in beiden Raids dieselbe Semantik. Sanctuaire- und Gigalodon-Farben dürfen diese Zustände nur ergänzen, niemals ersetzen.

### Verbindliche Dichte-Regel

- Captain Desktop: hohe Informationsdichte mit fester Priorisierung und Ausnahme-Radar.
- Teilnehmer Mobile: genau eine dominante Mission, eine Folgeaktion und eine sichtbare Blockade.
- Atmosphäre darf Timer, Warnung, Abhängigkeit und Primäraktion nie überdecken.


## 12. Verbindlicher Visual-Authenticity-Vertrag v0.8.5

Wo die Phase-4-Artefakte und v0.8.5 in visueller Form, Typografie, Material, Komposition oder Referenzscreen abweichen, gilt v0.8.5. Semantik, Accessibility und Raidlogik bleiben aus Phase 4 erhalten.

Verbindliche neue Quellen:

- `VISUAL_AUTHENTICITY_AUDIT.md`;
- `VISUAL_ART_DIRECTION_V2.md`;
- `SCREEN_REDESIGN_SPECS.md`;
- `CODEX_VISUAL_IMPLEMENTATION_PLAN.md`;
- `design-tokens.v0.8.5.json`;
- `reference-authenticity/*.png`;
- `reference-authenticity/*.html`.

### Neue Hauptregel

Route, Übergabe, Verantwortung und Entscheidung haben Vorrang vor universellen Cards und Metrikreihen. Unterschiedliche Informationsarten müssen unterschiedliche Formen besitzen.

## 13. Verbindlicher Wow-Layer-Vertrag v0.8.5.1

Die vollständige Präsentations- und Implementierungsgrundlage steht in `WOW_LAYER_SPECIFICATION.md`.

### Architekturgrenze

- Wow-Funktionen sind deterministische Ableitungen aus Definition, Snapshot, Serverzeit, Actor und Events;
- sie erzeugen keine automatische Domainmutation;
- bestehende Commands, APIs, Realtime-, Berechtigungs- und Raiddefinitionsverträge bleiben unverändert;
- Replay darf bei Bedarf nur einen additiven read-only Eventcursor ergänzen.

### Visuelle Hauptregel

- Live Map verwendet `route`;
- aktive Arbeit verwendet `sheet` oder `plate`;
- Risiko und Engpass verwenden `note`;
- kritischer Pfad verwendet einen strukturellen Thread;
- Replay verwendet denselben räumlichen Einsatzfaden wie die Live Map;
- keine Rückkehr zu KPI-Karten oder generischen Analytics-Dashboards.

### Wahrheit und Prognose

Der kritische Pfad heisst `Chemin critique structurel`. Ohne belastbare Aufgabendauern werden keine exakte Restzeit, CPM-Werte oder Erfolgswahrscheinlichkeiten behauptet.

### Reihenfolge

Phase 9A ist spezifiziert. Phase 8.5B ist in v0.8.6 abgeschlossen; die technische Phase 9B bleibt ein eigener Scope.

## 14. Implementierte Visual-Authenticity-Architektur v0.8.6

### Foundations

- `platform/styles/authenticity.css` definiert die globale Tokenmigration, lokale Fontfaces, Grundmaterialien, Fokus und Reduced Motion;
- `platform/styles/raid-themes.css` setzt die Sanctuaire- und Gigalodon-Farb- und Materialvarianten;
- `platform/styles/components.css` enthält die responsive Screen- und Komponentenkomposition;
- `RaidweaveMark` und `RaidIcon` ersetzen generische Marken- und Iconprovisorien.

### Komponentenfamilien

- Layout: `RouteFrame`, `WorkbenchSheet`, `PinnedNote`, `PinnedNoteStack`, `StatusStamp`;
- Lobby: `BriefingTicket`, `FormationBoard`, `DepartureGate`;
- Participant: `MissionOrder`, `NextOrderSlip`;
- Sanctuaire: `GardenRoute`, `PuzzleWorkbench`, `CorridorRibbon`;
- Gigalodon: `DepthRoute`, `LightBay`, `CargoManifest`, `FinalClearance`.

### Vertragsgrenze

Die Komponenten lesen ausschliesslich bestehende Snapshots und lösen bestehende Commands aus. Französische Microcopy wird in der Präsentationsschicht lokalisiert. Es wurden keine neuen Domainzustände, Commands, APIs, Events, Berechtigungen oder persistierten Daten eingeführt.

### Responsive und Accessibility

- Mobile Kernansicht: 390 × 844;
- Tablet/Notbetrieb: 768 × 1024;
- Desktopabnahme: 1440 × 900;
- grosse Desktopprüfung: 1920 × 1080;
- kein horizontales Kernscrolling, sichtbarer Fokus, Dialog-Fokusfalle, WCAG-AA-Kontrast und informationsgleiche Reduced-Motion-Darstellung.
