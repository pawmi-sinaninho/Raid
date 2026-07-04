# Sanctuaire Reference Screens

**Projektversion:** v0.4.0  
**Theme:** verwunschene Garten-Kommandozentrale  
**Referenzstatus:** visuelle Implementierungsbaseline, keine pixelgenaue Codevorgabe

## 1. Leitidee

Sanctuaire wirkt wie eine nächtliche, königliche Gartenkarte unter Glas. Die Oberfläche verwendet botanische Achsen, matte Messingdetails und organische Weglinien. Die Arbeitsfläche bleibt dunkel und ruhig; aktive Resultate und Datenübertragungen leuchten in blassem Grün, Glas-Aqua oder Rosa.

## 2. Captain Desktop – Rätselphase

**Dateien**

- `reference/sanctuaire_captain_1440x900.html`
- `reference/sanctuaire_captain_1440x900.png`

### Sichtbare Pflichtinformationen

- globaler Timer, Score, Raid-Leben, Onlinezustand;
- horizontaler Raidpfad Rätsel → Wächter → Korridor → Finale;
- vier parallele Rätselkarten;
- Team, Fortschritt, Bestätigung und Resultat;
- Captain Radar mit falscher Validierung, Wartezustand und Offline-Spieler;
- Aktivitätsleiste mit Undo.

### Visuelle Priorität

1. aktuelle Raidphase und Timer;
2. blockierende/fehlerhafte Ausnahme;
3. vier Rätselzustände;
4. automatische Resultatweitergabe;
5. Verlauf.

### Theme-Anwendung

- aktive Gartenwege: `theme.sanctuaire.primary`;
- bestätigte Rätseldaten: `theme.sanctuaire.glass`;
- königliche Finalreferenzen: `theme.sanctuaire.royal`;
- semantische Fehler bleiben `color.semantic.danger`;
- Hintergrundmuster maximal 6 %.

## 3. Teilnehmer Mobile – persönliche Mission

**Dateien**

- `reference/sanctuaire_participant_390x844.html`
- `reference/sanctuaire_participant_390x844.png`

### Inhalt

- Timer und Raid-Leben im kompakten Header;
- Mission `Quatre socles à relever`;
- Ort und Team;
- Primäraktion `Commencer`;
- Ergebnis-/Problemaktion;
- `Ensuite` und `En attente de`;
- Bottom Navigation mit Mission als aktivem Ziel.

### Abnahme

- Hauptaktion liegt ohne Scrollen im ersten Viewport.
- keine Captain-internen Details;
- keine horizontale Scrollfläche;
- mindestens 44 × 44 px Touchziele;
- neue Mission kann ohne Layoutsprung erscheinen.

## 4. Komponentenbesonderheiten

### Puzzlequartett

- vier Karten bilden optisch einen Gartenkreuzweg;
- Completed verliert keine Resultatinformation;
- Waiting zeigt konkrete Person oder Information;
- unbestätigtes Resultat besitzt offenen Knoten statt Haken.

### Datenübertragung

Zwischen bestätigter Rätselkarte und abhängiger Wächterphase erscheint eine feine Linie mit Quell- und Zielknoten. Die Linie wird nur beim bestätigten Transfer einmal animiert.

### Raid-Leben

Der Wert wird als einzelner klarer Zähler gezeigt. Die letzte Veränderung ist direkt erreichbar; keine 20-Herz-Dekoration.

## 5. Nicht übernehmen

- keine Ankama-Karten, Monster oder Itemgrafiken;
- keine aus bestehenden Guides kopierten Rätselsymbole;
- kein Pergament als dominanter Texthintergrund;
- keine Blumenornamente um Buttons;
- kein Pastellkontrast unter WCAG AA.

## 6. Vorrang der v0.8.5-Referenz

Für den nächsten visuellen Umbau ersetzt `reference-authenticity/sanctuaire_captain_1440x900.png` die frühere Captain-Komposition als Implementierungsbaseline. Die bestehende Teilnehmerreferenz bleibt fachliche Grundlage; ihre Card-Struktur wird durch die gemeinsame v0.8.5-Mobile-Referenz ersetzt.
