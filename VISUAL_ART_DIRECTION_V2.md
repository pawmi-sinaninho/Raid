# Visual Art Direction v2

**Projektversion:** v0.8.5  
**Arbeitsname:** `Field-built Raid Desk`  
**Leitsatz:** *Route before cards. Decisions before metrics. Material before glow.*

## 1. Kernidee

RAIDWEAVE wird als **Einsatztisch für einen laufenden Raid** gestaltet. Die Oberfläche kombiniert:

- eine kartografische Route;
- ein handwerklich gebautes Expeditionsinstrument;
- ein knappes Einsatzbriefing;
- zuverlässige digitale Telemetrie.

Die UI darf hochwertig und präzise sein, soll aber nicht wie ein perfekt symmetrisches Designsystem-Demo wirken. Kontrollierte Unregelmässigkeit entsteht aus Inhalt und Material, nicht aus zufälligem Chaos.

## 2. Drei visuelle Ebenen

### 2.1 Route

Die Route ist das primäre Ordnungsprinzip:

- Sanctuaire: horizontaler Garten- und Schlossweg mit sichtbaren Übertragungen;
- Gigalodon: vertikale Tiefenroute mit Licht und Rückweg;
- Lobby: Formation und Abmarschbereitschaft;
- Mobile: aktueller Ort plus nächster Übergabepunkt.

### 2.2 Workbench

Aktive Arbeit erscheint als Werkfläche, nicht als Standardcard:

- Rätsel als Gartenbeete beziehungsweise Arbeitsblätter;
- Licht als Etageninstrument;
- Ressourcen als Transportmanifest;
- Finalcheck als Freigabeband;
- Teilnehmermission als Einsatzbefehl.

### 2.3 Notes

Ausnahmen, Unsicherheiten und Entscheidungen erscheinen als menschlich lesbare Notizen:

- Captain-Radar-Einträge als angeheftete Einsatznotizen;
- `LIVE_REQUIRED` als Quellenstempel;
- Folgeaufgabe als separater Zettel oder Slip;
- keine humoristischen oder künstlich lockeren Meldungen.

## 3. Kontrollierte Unregelmässigkeit

Erlaubt:

- einzelne Panels mit unterschiedlichen Kantenlogiken;
- leicht versetzte Notizen innerhalb eines stabilen Rasters;
- unterschiedliche Höhen gemäss Informationsgewicht;
- überlappende Route und Materialebene;
- gezielte, maximale Rotation von ±1.5° nur für Notizen oder Poster;
- asymmetrische Spaltenverhältnisse;
- bewusst leere Fläche zur Orientierung.

Nicht erlaubt:

- zufällige Rotation jedes Elements;
- ungleichmässige Hitboxes;
- unvorhersehbare Navigationspositionen;
- dekorative Überlappung kritischer Werte;
- absichtlich „schmutzige“ Lesbarkeit;
- zufällige Abstände ausserhalb der definierten Rhythmik.

## 4. Typografie

### Neue Zielkombination

| Rolle | Schrift | Verwendung |
|---|---|---|
| Marke und Display | `Gillius ADF No2` | Wortmarke, Screen- und Modulüberschriften |
| UI und längere Texte | `Andika` | Labels, Erklärungen, Buttons, Formulare |
| Telemetrie | `Go Mono` | Timer, Score, Codes, Alter, Etagenwerte |
| punktueller redaktioneller Akzent | `EB Garamond SC` | maximal ein Wort oder eine kurze Kennzeichnung auf Landing/Endscreen |

### Regeln

- Comfortaa wird aus der Produktoberfläche entfernt.
- Displayüberschriften dürfen enger und charakteristischer gesetzt werden.
- Micro-Labels bleiben monospace und sachlich.
- Versalien nur für Telemetrie, Statusstempel und kurze Orientierung.
- Raidnamen und Aufgaben erhalten normale Gross-/Kleinschreibung.
- maximale Zahl gleichzeitig sichtbarer Schriftfamilien pro Screen: drei.

## 5. Form- und Materiallogik

### Gemeinsame Basismaterialien

- `canvas`: tiefe, fast schwarze Arbeitsfläche;
- `sheet`: matte Arbeitsblätter ohne Glassmorphism;
- `plate`: robustere Instrumentenfläche;
- `note`: angeheftete Ausnahme- oder Übergabenotiz;
- `strap`: schmale, horizontale Freigabe- oder Kennzahlenleiste;
- `route`: Linie, Knoten und Übergabepfeil;
- `stamp`: Quellen-, Risiko- oder Bestätigungsstatus.

### Sanctuaire

- dunkles Moos, oxidiertes Messing, Rosenlack, blasses Gartenglas;
- organische Kurven nur in Illustrationen und Routen;
- Module wirken wie Gartenabschnitte, Beschilderungen und Arbeitsblätter;
- keine Blumenrahmen und keine Fantasy-Ornamente um jede Fläche.

### Gigalodon

- tiefblauer Lack, geätztes Metall, Cyan-Markierungen, Amber-Lichtglas;
- Instrumente gehören sichtbar zu einer Etage;
- Tiefenroute und Rückweg dominieren die Komposition;
- keine flächige Cyberpunk-Neonästhetik.

## 6. Icon- und Illustrationslogik

### Icon-System

- eigene SVG-Bibliothek auf 24-px-Raster;
- variable 1.5–2-px-Strichstärke;
- Statusicons behalten eindeutige Semantik;
- Endpunkte und Verbindungen dürfen leicht handgezeichnet wirken, ohne unscharf zu werden;
- keine Emoji, keine fremden DOFUS-Assets, keine generische Icon-Mischung.

### Erforderliche eigene Motive

Gemeinsam:

- Weave-Knoten;
- Übergabepfeil;
- unbestätigter Quellenstempel;
- Rollenmarker;
- Route offen/gesperrt/aktiv/abgeschlossen.

Sanctuaire:

- Blattknoten;
- Gartenachse;
- Glas-/Statutenmarker;
- Wächtertor;
- geteilte Finalkrone.

Gigalodon:

- Tiefenmarke;
- Lumen-Segment;
- Druckring;
- Transportkiste;
- Unique-Fracht;
- Rückwegmarke.

## 7. Farbe

Semantische Farben bleiben unverändert in ihrer Bedeutung. Die neue Art Direction reduziert jedoch ihren Flächenanteil.

- Akzentfarben markieren Route, Auswahl und aktive Instrumente.
- Semantische Farben markieren Zustand und Risiko.
- Vollflächige Statushintergründe sind selten.
- Glow ist auf Lichtinstrumente und einmalige aktive Wegmarken begrenzt.
- maximal zwei Theme-Akzente plus eine semantische Warnfarbe in einem Arbeitsbereich.

## 8. Microcopy

### Prinzip

Microcopy nennt zuerst die operative Realität, danach die Aktion. Sie klingt wie eine erfahrene Raidleitung, nicht wie Marketing oder Backenddiagnostik.

| Bisherige Tendenz | Neue Form |
|---|---|
| `Préparer le command center` | `Préparer le raid` |
| `Exceptions` | `Ce qui demande une décision` |
| `Aucune exception critique` | `Rien ne bloque la prochaine étape` |
| `Task unassigned` | `Aucune équipe ne porte cette étape` |
| `Start session` | `Donner le signal de départ` |
| `Inventory stale` | `Yuna n’a pas confirmé son inventaire depuis 6 min` |
| `Score at risk` | `3 260 points sont encore portés` |
| `Ready check incomplete` | `3 joueurs n’ont pas répondu` |

### Verboten

- generische Erfolgsfloskeln;
- „Oops“;
- unnötige Ausrufezeichen;
- Backendbegriffe;
- falsche Sicherheit bei unbestätigten Spielregeln;
- künstlich epische Lore in kritischen Aktionen.

## 9. Motion und Sound

- Route öffnet sich einmalig in 240–360 ms.
- Neue Captain-Notiz erscheint ohne Bouncen.
- Missionwechsel nutzt kurzen harten Schnitt plus 140-ms-Einblendung.
- Light-Decays dürfen segmentweise wechseln, nicht dauerhaft pulsieren.
- kritischer Ton nur bei neuer, direkt handlungsrelevanter Warnung.
- kein Sound für gewöhnliche Taskabschlüsse.
- `prefers-reduced-motion` und globale Soundabschaltung bleiben verpflichtend.

## 10. Authentizitäts-Heuristik

Vor Freigabe jedes Screens werden fünf Fragen beantwortet:

1. Könnte derselbe Screen mit anderen Texten als Projektmanagement-App verkauft werden?
2. Ist mindestens eine raid-spezifische räumliche Beziehung ohne Text verständlich?
3. Haben unterschiedliche Informationsarten unterschiedliche Formen?
4. Ist die wichtigste Entscheidung in drei Sekunden sichtbar?
5. Wirkt die Komposition absichtlich gesetzt statt gleichmässig verteilt?

Ein Screen scheitert, wenn Frage 1 mit Ja oder eine der Fragen 2 bis 5 mit Nein beantwortet wird.
