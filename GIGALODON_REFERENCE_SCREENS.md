# Gigalodon Reference Screens

**Projektversion:** v0.4.0  
**Theme:** Tiefsee-Expeditionsinstrument  
**Referenzstatus:** visuelle Implementierungsbaseline, keine pixelgenaue Codevorgabe

## 1. Leitidee

Gigalodon wirkt wie ein präzises Expeditionsinstrument in grosser Tiefe. Die Informationsarchitektur folgt vertikal der Abwärtsbewegung durch die Etagen. Cyan markiert Expedition und Navigation, Amber ausschliesslich das Licht, Violett Druck und besondere Ressourcen. Risiko- und Taskstatusfarben bleiben theme-unabhängig.

## 2. Captain Desktop – Expedition

**Dateien**

- `reference/gigalodon_captain_1440x900.html`
- `reference/gigalodon_captain_1440x900.png`

### Sichtbare Pflichtinformationen

- globaler Timer;
- bestätigter Score plus Score at risk;
- Fragmente;
- Lichtlevel und Countdown aller Etagen;
- vertikaler Expeditionspfad;
- Unique-Ressourcenhalter;
- aktive Farmphase;
- Captain Radar;
- Aktivitätsleiste.

### Visuelle Priorität

1. Timer und Finalstart-Risiko;
2. kritisches Licht;
3. ungesicherte Unique-Ressource oder Score;
4. aktive Etage und fehlendes Fragment;
5. Verlauf.

### Theme-Anwendung

- aktive Expeditionslinie: `theme.gigalodon.primary`;
- Lichtinstrumente: `theme.gigalodon.lumen`;
- Tiefen-/Etagenlinien: `theme.gigalodon.line`;
- Unique-Ressourcen: `theme.gigalodon.pressure`;
- semantische Warnungen bleiben Gelb/Orange/Rot des Core-Systems.

## 3. Teilnehmer Mobile – Mission und Inventar

**Dateien**

- `reference/gigalodon_participant_390x844.html`
- `reference/gigalodon_participant_390x844.png`

### Inhalt

- Timer, aktuelle Etage und Lichtwarnung;
- aktuelle Kampfmission;
- Team und Ziel;
- Primäraktion `Démarrer le combat`;
- eigener Bestand;
- Score at risk und Aktualitätszeit;
- Folgeauftrag Rückweg/Einzahlung;
- Bottom Navigation.

### Abnahme

- Mission und Lichtstatus sind ohne Scrollen sichtbar.
- Inventarrisiko wird nicht mit globalem bestätigtem Score verwechselt.
- Unique-Ressource würde oberhalb normaler Ressourcen erscheinen.
- `Aucun changement` ist als schnelle Bestätigung erreichbar.
- keine Captain-Gesamtledgerdaten.

## 4. Komponentenbesonderheiten

### Licht

Licht wird doppelt codiert:

- Amber-Segmentzahl 0–4;
- numerischer Level;
- Countdown;
- semantische Risikokante bei Level 2–0.

Amber allein bedeutet **nicht** automatisch Warnung.

### Expedition

- Pfad läuft von oben nach unten.
- abgeschlossene Ebene bleibt als klare Wegmarke.
- aktive Ebene erhält einen Sonarring, aber keinen permanenten Vollflächen-Glow.
- gesperrte Rückweg-/Finalphase zeigt die konkrete Bedingung.

### Score at risk

- immer mit `non sécurisé` oder `at risk`;
- nie mit bestätigtem Score in einer einzigen unbeschrifteten Zahl addieren;
- bei Verlust zeigt Undo/Recovery keine falsche Wiederherstellung, sondern die bestätigte Spielbeobachtung.

## 5. Nicht übernehmen

- keine generische Cyberpunk-Neonwand;
- kein Radar- oder Sonarfilm hinter Text;
- keine winzigen Etagenwerte;
- keine reine Farbcodierung der Lichtlevel;
- keine fremden Boss- oder Itemillustrationen.

## 6. Vorrang der v0.8.5-Referenzen

Für den nächsten visuellen Umbau ersetzen `reference-authenticity/gigalodon_captain_1440x900.png` und `reference-authenticity/participant_mobile_390x844.png` die frühere Komposition als Implementierungsbaseline. Fachinformationen und Theme-Semantik bleiben erhalten.
