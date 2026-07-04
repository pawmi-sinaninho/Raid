# Design System

**Systemname:** RAIDWEAVE Visual System  
**Version:** 1.0 / Projekt v0.4.0  
**Geltung:** öffentliche Ebene, Lobby, Live-Modus, Zusammenfassung; Desktop, Tablet und Mobile

## 1. Systemarchitektur

Das Designsystem besteht aus drei strikt getrennten Ebenen:

1. **Core:** Typografie, Raster, Abstände, Geometrie, Eingaben, Fokus, Oberflächen.
2. **Semantic:** Taskstatus, Risiken, Verbindung, Bestätigung, Quellenstatus und Datenfrische.
3. **Raid Theme:** Atmosphäre, Raidpfade, Akzentflächen, Material und thematische Illustration.

Raid-Themes dürfen semantische Farben niemals umdeuten. `BLOCKED` bleibt in beiden Raids orange; ein Sanctuaire-Akzent darf diesen Status nicht ersetzen.

## 2. Farbsystem

### 2.1 Core Dark

| Token | Wert | Zweck |
|---|---:|---|
| `color.canvas` | `#080B11` | globale Grundfläche |
| `color.surface.1` | `#101621` | Hauptpanels |
| `color.surface.2` | `#17202E` | Karten, Inputs |
| `color.surface.3` | `#202B3C` | Hover, aktive Unterfläche |
| `color.surface.elevated` | `#273347` | Drawer, Popover |
| `color.border.muted` | `#344056` | normale Trennung |
| `color.border.strong` | `#53627A` | Fokusnähe, starke Trennung |
| `color.text.primary` | `#F4F7FB` | Haupttext |
| `color.text.secondary` | `#C3CBD8` | Sekundärtext |
| `color.text.muted` | `#8E9AAF` | Metadaten |
| `color.text.inverse` | `#071018` | Text auf hellen Akzentflächen |
| `color.focus` | `#B7E4FF` | Fokusindikator, theme-unabhängig |

### 2.2 Semantische Farben

| Semantik | Farbe | zusätzliches Signal |
|---|---:|---|
| Erfolg / `COMPLETED` | `#49D17D` | Haken, volle Kontur |
| Info / `READY` | `#60A5FA` | offener Kreis, klare Kante |
| aktiv / `ACTIVE` | `#5AD7E8` | Dreieck/Play, begrenzter Impuls |
| beansprucht / `CLAIMED` | `#B69CFF` | Person-Knoten |
| wartet / `WAITING` | `#F6C85F` | Sanduhr, gestrichelte Kante |
| blockiert | `#FF985C` | Barriere, diagonale Markierung |
| fehlgeschlagen / kritisch | `#FF5D73` | X oder Ausrufezeichen, starke Kante |
| gesperrt / übersprungen | `#8E9AAF` | Schloss oder Minus, reduzierte Sättigung |

**Regel:** Kein Status wird nur durch Farbe transportiert. Jede Instanz besitzt Text, Icon und mindestens ein Formsignal.

### 2.3 Sanctuaire Theme

| Token | Wert |
|---|---:|
| `theme.sanctuaire.canvas` | `#07100E` |
| `theme.sanctuaire.surfaceTint` | `#12201A` |
| `theme.sanctuaire.primary` | `#B7E37E` |
| `theme.sanctuaire.primaryStrong` | `#8FC85F` |
| `theme.sanctuaire.secondary` | `#E8A0C7` |
| `theme.sanctuaire.glass` | `#86D9C4` |
| `theme.sanctuaire.royal` | `#7E4D83` |
| `theme.sanctuaire.line` | `#36584B` |
| `theme.sanctuaire.ornament` | `#D9C993` |

**Verwendung:** Primärfarbe für Raidpfad, Auswahl und Navigation; Pink/Glas nur für Rätseltypen und Datenübertragungen; Royal nur als dunkler Akzent, nicht als normaler Text.

### 2.4 Gigalodon Theme

| Token | Wert |
|---|---:|
| `theme.gigalodon.canvas` | `#06101A` |
| `theme.gigalodon.surfaceTint` | `#0D2130` |
| `theme.gigalodon.primary` | `#55DDE0` |
| `theme.gigalodon.primaryStrong` | `#26B8D0` |
| `theme.gigalodon.secondary` | `#5B8CFF` |
| `theme.gigalodon.lumen` | `#FFD166` |
| `theme.gigalodon.pressure` | `#B77BFF` |
| `theme.gigalodon.line` | `#214A61` |
| `theme.gigalodon.ornament` | `#9DEBFF` |

**Verwendung:** Cyan für Expedition und aktive Etage; Lumen-Amber ausschliesslich für Lichtzustände; Violett für Druck/Unique-Ressourcen, nicht für Taskstatus.

## 3. Typografie

### 3.1 Familien

| Rolle | Familie | Fallback |
|---|---|---|
| Marke / Display | `Comfortaa` 600–700 | `Cabin`, sans-serif |
| UI / Fliesstext | `Cabin` 400–700 | system-ui, sans-serif |
| Telemetrie / Timer | `Cousine` 400–700 | ui-monospace, monospace |

Die drei Schriften sind frei verfügbare Webfonts. Fontdateien werden nicht in den Spezifikationsartefakten verteilt; die Implementierung bindet sie über den gewählten Buildprozess selbst ein.

### 3.2 Skala

| Token | Desktop | Mobile | Verwendung |
|---|---:|---:|---|
| `type.display` | 40/44 | 30/34 | Landing, Endscreen |
| `type.raidTitle` | 24/30 | 20/26 | Raidname |
| `type.h1` | 28/34 | 24/30 | Screenüberschrift |
| `type.h2` | 20/26 | 18/24 | Panelüberschrift |
| `type.h3` | 16/22 | 16/22 | Kartenüberschrift |
| `type.body` | 15/22 | 15/22 | Standard |
| `type.small` | 13/18 | 13/18 | Metadaten |
| `type.micro` | 11/16 | 11/16 | Labels, nie kritischer Inhalt |
| `type.timerXL` | 32/36 | 24/28 | globaler Timer |
| `type.metric` | 18/22 | 17/21 | Score, Leben, Licht |

- kritische Zahlen verwenden `font-variant-numeric: tabular-nums`;
- Versalien nur für Micro-Labels und Marke;
- maximale Textbreite für Erklärungen: 68 Zeichen;
- keine `micro`-Grösse für Touchlabels, Warnungen oder Status.

## 4. Abstandssystem

4-px-Basisraster:

| Token | Wert |
|---|---:|
| `space.0` | 0 |
| `space.1` | 4 px |
| `space.2` | 8 px |
| `space.3` | 12 px |
| `space.4` | 16 px |
| `space.5` | 20 px |
| `space.6` | 24 px |
| `space.8` | 32 px |
| `space.10` | 40 px |
| `space.12` | 48 px |
| `space.16` | 64 px |

- Panelinnenabstand Desktop: 20 oder 24 px.
- Karteninnenabstand: 16 px.
- Mobile Hauptkarte: 18 px seitlich, 20 px vertikal.
- Zwischen zwei unabhängigen Handlungsgruppen: mindestens 24 px.
- Primär- und Gefahrenaktion dürfen nie direkt aneinanderliegen; mindestens 12 px Abstand.

## 5. Raster und responsive Regeln

### 5.1 Breakpoints

| Token | Bereich | Zweck |
|---|---|---|
| `bp.mobile` | 390–767 | Teilnehmer, kompakte Captain-Korrekturen |
| `bp.tablet` | 768–1199 | Zweitmonitor, Rätselboard |
| `bp.desktop` | 1200–1599 | Captain Standard |
| `bp.wide` | ab 1600 | Stream-/Übersichtsmodus |

### 5.2 Captain 1440

- 12 Spalten;
- Seitenabstand 24 px;
- Spaltenabstand 16 px;
- Header 72 px;
- Aktivitätsleiste 48 px;
- Hauptfläche: 9 Spalten;
- Radar: 3 Spalten, 320–360 px;
- bei Gigalodon darf links zusätzlich ein 176–208 px Instrumentenrail liegen; die Expeditionskarte bleibt flexibel.

### 5.3 Mobile 390

- einspaltig;
- Seitenabstand 16 px;
- Header 56 px;
- Bottom Navigation 72 px inklusive Safe Area;
- Hauptaktion mindestens 48 px hoch und möglichst vollbreit;
- keine horizontale Scrollfläche für Kernaktionen;
- Tabellen werden zu eigenen Karten, nicht zu gequetschten Spalten.

## 6. Geometrie

### Gemeinsame Formensprache

- Basisradius: 10 px.
- grosse Panels: 14 px.
- Pills nur für kleine Filter, Rollen und Status; keine komplette Oberfläche aus Pills.
- Cards besitzen eine **geschnittene Ecke** oben rechts oder unten links. Das verhindert Standard-SaaS-Optik.
- Linienbreite normal: 1 px; aktive oder kritische Kontur: 2 px.
- Interaktive Flächen mindestens 44 × 44 px, primäre Mobile-Aktion 48 px hoch.

### Theme-Modifikation

- Sanctuaire: weiche 14-px-Kurve plus kleine Blatt-/Glaskerbe.
- Gigalodon: 8-px-Radius plus 10-px-Druckschnitt und technische Kantenmarke.
- Formmodifikation ist dekorativ; Hitbox und Layout bleiben identisch.

## 7. Oberfläche, Tiefe und Textur

### Schatten

| Token | Wert |
|---|---|
| `shadow.1` | `0 8px 24px rgba(0,0,0,.24)` |
| `shadow.2` | `0 16px 48px rgba(0,0,0,.34)` |
| `shadow.focus` | `0 0 0 3px rgba(183,228,255,.30)` |
| `shadow.critical` | `0 0 0 1px rgba(255,93,115,.55), 0 12px 32px rgba(255,93,115,.10)` |

### Texturen

- Noise: 1–2 % Deckkraft.
- Linien-/Kartenmuster: maximal 6 %.
- Glow: nur an aktiven Raidpfaden, Lichtinstrumenten oder einer neuen Mission; nie hinter längeren Texten.
- Keine Glassmorphism-Flächen über kritischen Daten.

## 8. Iconografie

### Basis

- 24-px-Raster, optische Fläche 20 px.
- 1.75-px-Strich, runde Linienenden.
- Utility-Icons dürfen auf einer offenen linearen Iconbasis implementiert werden.
- Raidstatus-, Weave- und Mechanikicons werden als eigene SVGs erstellt.

### Verbindliche Statusicons

| Status | Iconmetapher |
|---|---|
| `LOCKED` | Schloss |
| `READY` | offener Knoten |
| `CLAIMED` | Knoten + Person |
| `ACTIVE` | Richtungspfeil/Play |
| `WAITING` | Sanduhr |
| `BLOCKED` | Barriere |
| `FAILED` | gebrochener Knoten |
| `COMPLETED` | Haken im Knoten |
| `SKIPPED` | Minus im Knoten |

## 9. Taskstatus-Darstellung

| Status | Kontur | Hintergrund | Bewegung | Primäraktion |
|---|---|---|---|---|
| `LOCKED` | muted, gestrichelt | surface.1 | keine | Abhängigkeit zeigen |
| `READY` | info 1 px | info 6 % | keine | Übernehmen |
| `CLAIMED` | violet 1 px | violet 7 % | keine | Starten |
| `ACTIVE` | cyan 2 px | cyan 7 % | einmaliger Impuls | Abschliessen / Ergebnis |
| `WAITING` | warning, gestrichelt | warning 6 % | 6-s-Ruheimpuls, max. 3× | Fortsetzen / Abhängigkeit |
| `BLOCKED` | orange 2 px | diagonale 4-%-Markierung | keine | Blockade bearbeiten |
| `FAILED` | danger 2 px | danger 8 % | einmaliges Shake nur bei eigenem Fehler | Retry / Details |
| `COMPLETED` | success 1 px | success 6 % | kurzer Check | Öffnen |
| `SKIPPED` | muted | transparent | keine | Grund anzeigen |

## 10. Risiko und Captain Radar

Risiko ist nicht identisch mit Taskstatus.

| Stufe | Farbe | Symbol | Radarposition |
|---|---|---|---|
| `NORMAL` | success | Punkt/Haken | standardmässig ausgeblendet |
| `ATTENTION` | warning | Dreieck | nach kritischen Einträgen |
| `HIGH` | orange | Doppeldreieck | oben |
| `CRITICAL` | danger | Oktagon/Ausrufezeichen | immer zuerst |

- Sortierung: Stufe → Zeitkritikalität → Dauer → Abhängigkeiten.
- Ein Radar-Eintrag enthält immer: Ursache, Auswirkung, Alter, klare Aktion.
- Pulsieren nur bei neuem `CRITICAL`, maximal drei Zyklen.

## 11. Verbindungs-, Konflikt- und Vertrauenszustände

| Zustand | Darstellung |
|---|---|
| Online | kleiner Punkt + `Synchronisé` |
| Reconnecting | gelbe, nicht modale Leiste; lokale Änderungen als `En attente` |
| Offline | rote Leiste; keine Aktion als gespeichert darstellen |
| Konflikt | Split-Vergleich `Valeur serveur` / `Votre saisie`; Fokus bleibt im betroffenen Feld |
| Veraltet | Uhricon + Zeit seit Bestätigung; ab Warnschwelle semantischer Status |
| `LIVE_REQUIRED` | eckiges Label `NON CONFIRMÉ EN JEU`; nicht wie eine Warnstufe färben |
| zweitbestätigt | zwei überlappende Knoten + Namen |
| System bestätigt | kleines Systemsignet + Zeit |
| Definition aktualisiert | neutrale Info; laufende Session bleibt sichtbar auf ihrer Version |

## 12. Eingaben und Aktionen

### Buttons

| Variante | Verwendung |
|---|---|
| Primary | genau eine dominante Aktion pro Arbeitsbereich |
| Secondary | alternative sichere Aktion |
| Ghost | Navigation, Details |
| Danger | irreversible oder verlustbehaftete Aktion |
| Quiet icon | sekundäre Utility-Aktion, immer mit Tooltip/Label |

- Primärbutton verwendet Raid-Akzent, aber semantische Danger-Aktion bleibt rot.
- Disabled zeigt zusätzlich Grund in unmittelbarer Nähe.
- Ladezustand ersetzt Label nicht vollständig; Verb bleibt lesbar.

### Inputs

- Höhe 44 px Desktop, 48 px Mobile.
- Label immer ausserhalb des Felds.
- Fehler direkt unter dem Feld, nicht nur Toast.
- kritische Auswahl zeigt vor Bestätigung eine kompakte Wirkungsvorschau.
- Zähler besitzen grosse Plus-/Minus-Hitboxes und direkte Zahleneingabe als Fallback.

## 13. Motion

| Token | Dauer | Verwendung |
|---|---:|---|
| `motion.instant` | 80 ms | Press/Focus |
| `motion.fast` | 140 ms | Hover, Auswahl |
| `motion.base` | 220 ms | Drawer, neue Mission |
| `motion.slow` | 360 ms | Pfadfreischaltung |
| `motion.criticalPulse` | 900 ms | begrenzte kritische Aufmerksamkeit |

Easing:

- `standard`: `cubic-bezier(.2,.8,.2,1)`
- `enter`: `cubic-bezier(.16,1,.3,1)`
- `exit`: `cubic-bezier(.4,0,1,1)`

`prefers-reduced-motion`:

- keine Positionsanimation;
- kein Pulsieren;
- Zustandswechsel über sofortige Kontur-/Iconänderung;
- Timer zählt weiter ohne animierte Ziffern.

## 14. Accessibility

- Normaltext mindestens WCAG 2.2 AA 4.5:1.
- grosse Schrift mindestens 3:1.
- UI-Komponenten und Fokus mindestens 3:1 zum angrenzenden Hintergrund.
- Fokus ist 2 px plus 2-px-Offset und niemals nur Glow.
- Touchziele mindestens 44 × 44 px.
- Timer und kritische Zahlen erhalten zugängliche Textlabels.
- Statusänderungen werden über `aria-live="polite"` gemeldet; kritische Zeitwarnungen nicht minütlich wiederholen.
- Bottom Sheets fangen Fokus ein und geben ihn korrekt zurück.
- Tabellen besitzen Kartenalternative auf Mobile.
- Sprachwechsel verändert keine gespeicherten Fachwerte.

## 15. Content-Dichte

- Captain Desktop: hoch, aber gruppiert; keine mehr als drei visuellen Hierarchiestufen pro Panel.
- Teilnehmer Mobile: eine Hauptmission, eine Folgeaktion, eine Blockade; Rest progressiv.
- Maximal fünf Radar-Einträge gleichzeitig sichtbar; danach gruppieren.
- Maximal drei Akzentfarben gleichzeitig innerhalb eines Panels.
- Animation, Glow und Textur werden in kritischen Phasen automatisch reduziert.

## 16. Implementierungsvertrag

- Verbindliche maschinenlesbare Tokens: `design-tokens.v0.4.json`.
- Komponentenverhalten: `COMPONENT_VISUAL_SPECS.md`.
- Screenreferenzen: `SANCTUAIRE_REFERENCE_SCREENS.md` und `GIGALODON_REFERENCE_SCREENS.md`.
- Die PNG-Referenzen sind visuelle Abnahmebilder, nicht pixelgenaue Frontendvorgaben.
- Änderungen an semantischen Tokens erfordern neue Designsystemversion und visuelle Regressionstests.


## 17. Visual System v0.8.5 – Vorrangregel

`design-tokens.v0.8.5.json` ersetzt `design-tokens.v0.4.json` dort, wo Schlüssel zu Typografie, Material, Kantenprofil, Schatten, Glow oder Kompositionsgrenzen abweichen.

Unverändert bleiben:

- semantische Bedeutung aller Task- und Risikozustände;
- Fokus-, Kontrast-, Touch- und Reduced-Motion-Anforderungen;
- Dark-first;
- Theme-unabhängige Statussemantik.

Ersetzt werden insbesondere:

- Comfortaa/Cabin/Cousine als Zieltypografie;
- universelle Kartenradien und Kartenschatten;
- allgemeine Glow-Nutzung;
- Metrikreihen als primäre Screenhierarchie;
- gleichförmige Card-Grids als Standardkomposition.
