# Component Visual Specifications

**Projektversion:** v0.4.0  
**Grundlage:** `DESIGN_SYSTEM.md`, `SCREEN_INVENTORY.md`, `WIREFRAMES.md`

## 1. Komponentenvertrag

Jede Komponente besitzt:

- klar definierte Informationspriorität;
- alle relevanten Status;
- Desktop-, Tablet- und Mobileverhalten;
- Tastatur- und Touchzustände;
- Lade-, Reconnect-, Konflikt- und Berechtigungsdarstellung;
- keine raidfachliche Logik, die nur in visueller Form existiert.

## 2. Gemeinsame Shell

### `AppShell`

1. globale Hintergrundfläche;
2. `RaidHeader`;
3. Hauptarbeitsbereich;
4. optionaler `CaptainRadar`;
5. `ActivityStrip`;
6. mobile `BottomNav`;
7. verbindungsbezogene Systemleiste.

- Desktop: volle Höhe; interne Arbeitsbereiche scrollen.
- Mobile: vertikaler Dokumentfluss, Bottom Navigation sticky.
- Mindestbreite Captain: 1200 px; darunter Tabletmodus.

### `RaidHeader`

| Element | Priorität |
|---|---:|
| Raidname / Phase | 1 |
| globaler Timer | 1 |
| Raid-Leben oder Hauptrisiko | 1 |
| Score | 2 |
| Teilnehmer / Verbindung | 2 |
| Utilities | 3 |

- Desktop 72 px; Mobile 56 px.
- Timer in `Cousine`, tabular.
- Unter 768 px wandert Score in die Raidübersicht; Timer bleibt.
- Warnfarbe färbt Rahmen und Icon, nie den ganzen Header.

## 3. Navigation

### `BottomNav`

- exakt vier Ziele: Mission, Raid, Team, Meldungen;
- 72 px inklusive Safe Area;
- aktives Ziel: Raid-Akzentlinie + gefülltes Icon + Text;
- Meldungsbadge maximal `99+`;
- bei Vollbildformularen bleibt eine klare Zurückaktion.

### `PhaseRail`

- Desktop für Screen- und Phasenorientierung;
- maximal vier sichtbare Stufen;
- kein Ersatz für die RaidMap.

## 4. Karten und Pfade

### `RaidMap`

- Sanctuaire: horizontaler Schloss-/Gartenweg.
- Gigalodon: vertikale Expedition nach unten.
- Pfadlinie 2 px; aktiv 3 px.
- gesperrte Verbindung gestrichelt.
- automatische Datenübertragung: dünne Sekundärlinie mit einmaliger Knotenanimation.
- kein Zoom im Piloten erforderlich.

### `PhaseNode`

**Anatomie:** Icon, Name, Fortschritt, Status, Team/Person, optional Risiko.

| Variante | Grösse |
|---|---:|
| compact | 96 × 56 px |
| standard | 160 × 88 px |
| hero | 220 × 112 px |

Completed bleibt lesbar. Locked zeigt die fehlende Voraussetzung. Active erhält 2-px-Akzentkante, aber keinen permanenten Vollflächen-Glow.

## 5. Aufgaben

### `TaskCard`

1. Statusrail;
2. Aufgabenname;
3. Ort / Mechanikkategorie;
4. Besitzer;
5. Abhängigkeit oder Ergebnis;
6. genau eine dominante Aktion;
7. sekundäres Overflow-Menü.

| Variante | Mindesthöhe |
|---|---:|
| compact | 72 px |
| standard | 112 px |
| mission Mobile | 220 px |

- Status: Rail + Icon + Text.
- `LIVE_REQUIRED` direkt am betroffenen Wert.
- Completed bleibt öffnbar und zeigt Bestätiger.
- French long labels dürfen nicht abgeschnitten werden.

### `MissionCard`

Reihenfolge:

1. `MAINTENANT`;
2. Aufgabenname;
3. Ort / Team;
4. benötigte Information;
5. Primäraktion;
6. Problem melden;
7. `ENSUITE`;
8. `EN ATTENTE DE`.

Kein Carousel. Neue Mission erscheint in 220 ms, ohne Fokusverlust. Ohne Aufgabe werden Grund und nächster Auslöser gezeigt.

### `DependencyHint`

Icon + kurzer Satz. Nutzertext nennt Personen oder Aufgaben statt interner IDs. Ketten über zwei Ebenen werden zusammengefasst.

## 6. Zuweisung und Personen

### `TeamChip`

- 28 px hoch, max. 140 px;
- Teamfarbe nur dekorativ;
- vollständiger Name im Tooltip.

### `ParticipantAvatar`

- Initialen oder neutrale Eigen-Silhouette;
- keine Ankama-Klassenicons in Designquellen;
- Verbindung als Satellitenpunkt;
- Ready-State als Haken;
- Grössen 24, 32, 40 px.

### `AssignmentTray`

- Desktop: Drag-and-drop plus vollständig zugängliches Zuweisungsmenü.
- Mobile: Auswahlmenü; Drag-and-drop nie Pflicht.
- exklusive Aufgabe zeigt Konflikt sofort.

## 7. Timer und Kennzahlen

### `SharedTimer`

- `Cousine`, tabular;
- Formate `01:42:18`, unter einer Stunde `24:38`;
- Warnschwelle verändert Rahmen, Icon und Hilfetext;
- keine blinkenden Ziffern;
- Korrektur zeigt vorher/nachher und erzeugt Event.

### `MetricTile`

- Label 11–13 px;
- Wert 18–32 px;
- Trend nur wenn handlungsrelevant;
- keine dekorativen Mini-Charts in V1.

### `RaidLifeCounter`

- aktueller Wert dominant, Maximum sichtbar;
- letzte Ursache erreichbar;
- Verlust/Gewinn nur als kurzer Impuls;
- keine 20 einzelnen Herzicons auf Mobile.

## 8. Captain Radar

### `CaptainRadar`

Breite 320–360 px Desktop; eigene Liste Mobile.

Eintrag:

1. Risikostufe;
2. konkrete Aussage;
3. Auswirkung;
4. Alter;
5. Primäraktion;
6. optional quittieren.

Sortierung: Stufe → Zeitkritikalität → Dauer → Abhängigkeiten. Gleiche Ursache wird gruppiert. Leerzustand: `Aucune exception critique` plus letzte Synchronisationszeit.

### `RiskBadge`

- eckig, 24–28 px;
- Text `Critique`, `Élevé`, `Attention`;
- maximal zwei Badges pro P0-Karte.

## 9. Verlauf und Recovery

### `ActivityTimeline`

- Zeitspalte in `Cousine`;
- Actor, Aktion, Objekt;
- reversible Events mit `Annuler`;
- automatische Folgeereignisse eingerückt.

### `UndoPreview`

- Modal Desktop, Full-screen Sheet Mobile;
- zeigt Folgen vor Bestätigung;
- Button konkret: `Annuler 3 changements`.

### `ConnectionBanner`

| Zustand | Verhalten |
|---|---|
| online | keine permanente Leiste |
| reconnecting | gelbe Leiste, lokale Änderungen `En attente` |
| offline | rote Leiste, Entwürfe bleiben sichtbar |
| wieder verbunden | 3-s-Bestätigung |

### `ConflictResolver`

Serverwert und eigener Entwurf, jeweils mit Zeit und Actor. Aktionen: Serverwert behalten, Entwurf erneut anwenden, kopieren. Kein blindes Überschreiben.

## 10. Sanctuaire-Komponenten

### `PuzzleQuartet`

- 2×2 Desktop/Tablet, einspaltig Mobile;
- Team, Fortschritt, Resultat, Bestätigung;
- Transferziele als kleine verknüpfte Knoten.

### `GuardianCard`

Automatisch übertragene Daten sind mit Quelle markiert und von manueller Eingabe unterscheidbar.

### `CorridorDispatcher`

- Raumraster links, freie Spieler rechts;
- Zähler sticky;
- Zielwert `LIVE_REQUIRED` direkt am Ziel;
- Retry orange gestrichelt;
- Auto-Zuweisung sekundär.

### `FinalBossSplit`

Zwei gleichwertige Spalten; gemeinsame Abschlussbedingung darunter. Ein aktiver Boss verdrängt den anderen nie.

## 11. Gigalodon-Komponenten

### `FloorLightPanel`

- fünf Segmente plus numerischer Wert;
- Countdown immer sichtbar;
- Amber = Licht, semantische Warnfarbe = Risiko;
- veraltet mit Zeitstempel und gestricheltem Rahmen;
- Auffüllen zeigt altes/neues Level.

### `ResourceLedger`

Desktop: Person, Etage, Ressourcen, Unique, Score at risk, Aktualität, Aktion.  
Mobile: nur eigener Bestand; grosse `Keine Änderung`- und `Aktualisieren`-Aktion; Unique immer oben.

### `LuminariumGrid`

- 4×4, Zelle mindestens 52 px;
- Zustand zusätzlich durch Symbol;
- Lösung und ausgeführte Schritte getrennt;
- Konflikt sperrt nur die betroffene Zelle.

### `ExecrabeSequence`

Vier feste Schwellen, vier grosse Symbolbuttons, verwendete Erscheinung sichtbar aber deaktiviert, separate Zweitbestätigung.

### `FinalReadiness`

Checks nach blockiert, unbestätigt und bereit gruppieren. Eine unbestätigte Regel ist kein bewiesenes rotes Gate. Finalstartbutton sticky; Restzeit neben Titel.

### `GigalodonFinalTracker`

Runde 1–3, Gesamtschaden, projizierte Scorestufe und eigene Verschluckwarnfläche. Im Kampf grosse Schnellaktionen statt kleiner Stepper.

## 12. Formulare und Overlays

### `BottomSheet`

- Mobile für Meldung, Inventar, kleine Bestätigung;
- max. 90 % Viewporthöhe;
- Primäraktion sticky;
- Fokus korrekt gefangen und zurückgegeben.

### `Drawer`

- Desktop Taskdetail 420–520 px;
- öffnet rechts;
- Radar wird ersetzt, nicht verdeckt;
- Ursprungstask bleibt markiert.

### `Modal`

Nur für irreversible Entscheidung, Undo mit Folgen, Linkrotation und Sessionende. Nicht für normale Taskabschlüsse.

## 13. Lade- und Leerzustände

- Skeleton übernimmt reale Geometrie.
- bestätigte Daten bleiben bei Teilreload.
- Empty State nennt den nächsten Auslöser.
- Fehler bietet konkrete Wiederholung.
- keine Illustration in kritischem Live-Fehlerzustand.

## 14. Visuelle Abnahme

Eine Komponente gilt als fertig, wenn:

1. alle dokumentierten Taskstatus darstellbar sind;
2. Fokus, Hover, Pressed, Disabled und Loading spezifiziert sind;
3. 390 px ohne horizontales Kernscrolling funktioniert;
4. Farbe nicht einziges Signal ist;
5. Reconnecting und Konflikt nicht als Erfolg erscheinen;
6. französische lange Labels funktionieren;
7. Raidtheme austauschbar ist, ohne Semantik oder Layout zu verändern;
8. sie gegen die Referenzscreens geprüft wurde.


## 15. Visual Authenticity Components v0.8.5

Neue Präsentationsprimitive:

- `RouteFrame`;
- `WorkbenchSheet`;
- `PinnedNote`;
- `StatusStamp`;
- `BriefingTicket`;
- `FormationBoard`;
- `DepartureGate`;
- `GardenRoute`;
- `PuzzleWorkbench`;
- `CorridorRibbon`;
- `DepthRoute`;
- `LightBay`;
- `CargoManifest`;
- `FinalClearance`;
- `MissionOrder`;
- `NextOrderSlip`.

`Panel`, `Card` und `MetricTile` bleiben als technische Primitive erlaubt, dürfen aber nicht mehr die sichtbare Hauptsprache aller Informationsarten bilden. Kein Kernscreen darf mehr als drei direkt benachbarte gleichartig gerahmte Cards enthalten.
