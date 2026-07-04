# Raid Source of Truth

**Status:** fachliche Basis v0.8.6.1  
**Regel:** Fachregeln verwenden genau einen der Status `OFFICIAL_CONFIRMED`, `GUIDE_CONFIRMED`, `LIVE_CONFIRMED`, `LIVE_REQUIRED` oder `PLAYER_CORRECTED`. Der Status beschreibt Vertrauen, nicht Risiko.

## 1. Vertrauensmodell

| Status | Bedeutung |
|---|---|
| `OFFICIAL_CONFIRMED` | offizielle Quelle belegt die Regel |
| `GUIDE_CONFIRMED` | Guidequelle belegt die Regel; eigener RAIDWEAVE-Live-Test kann noch fehlen |
| `LIVE_CONFIRMED` | RAIDWEAVE hat die Regel im aktuellen Client mit Evidenz live bestätigt |
| `LIVE_REQUIRED` | Live-Verifikation offen; darf allein kein unsichtbares hartes Gate sein |
| `PLAYER_CORRECTED` | Captain oder Editor bestätigt eine Pilotkorrektur mit Actor, Zeitpunkt und Notiz |

Eine Guide-Angabe darf als versionierte Baseline verwendet werden, muss in der Oberfläche erkennbar bleiben. Eine Teilnehmermeldung ändert weder Definition noch Vertrauensstatus automatisch.

## 2. Gemeinsame Grundlagen

- Beide Raids wurden mit Update 3.6 veröffentlicht.
- Ein Raid wird über Gildenrechte erstellt und kostet Gildenkamas.
- Externe Spieler können grundsätzlich teilnehmen.
- Fortschritt wird innerhalb der Raidgruppe gemeinschaftlich wirksam.
- Beide Raids verlangen parallele Aufgabenteilung.
- Die Produktlogik setzt nicht voraus, dass alle Teilnehmer denselben Bildschirm oder dieselbe Aufgabe sehen.
- Captainwechsel, externe Teilnehmerrechte, Timerablauf und Disconnect-Sonderfälle bleiben Live-Testfragen und werden als Warnungen, nicht als erfundene Sperren modelliert.

## 3. Sanctuaire des Jardins éternels

### Eckdaten

| Merkmal | Wert |
|---|---:|
| Mindestteilnehmer | 8 |
| Höchstteilnehmer | 16 |
| Zeitlimit | 2 Stunden |
| Erstellungskosten | 480 Gildenkamas |
| maximaler Score | 50'000 |
| Raid-Leben | 20 |

### Scorestruktur

| Aufgabe | Punkte |
|---|---:|
| vier Rätsel | je 2'000 |
| vier Wächter | je 5'000 |
| alle Korridormonster | 2'000 |
| Princesse Maudite | 10'000 |
| Reine Écarlate | 10'000 |

### Korridor-Baseline

Die kanonische Guide-Baseline lautet `10 Räume × 6 Monster = 60 Korridormonster`. Der Standardwert ist 60 und bleibt definitions- und sessionspezifisch konfigurierbar. Quellenstatus: `GUIDE_CONFIRMED`; noch nicht durch einen eigenen RAIDWEAVE-Live-Test bestätigt. Die frühere 60/80-Vermischung ist keine zweite Wahrheit mehr.

### Raid-Leben und Phasen

- Fehler in einem Rätsel: `-1`;
- verlorener Kampf: `-1 pro Charakter im Kampf`;
- erfolgreiches Rätsel: `+1`, maximal bis 20;
- Phasen: vier Rätsel, vier Wächter, Korridor, zwei Finalbosse;
- beide Finalbosse werden getrennt geführt; ihr Abschluss beendet gemeinsam den Raid.

## 4. Gouffre du Gigalodon

### Eckdaten

| Merkmal | Wert |
|---|---:|
| Mindestteilnehmer | 8 |
| Höchstteilnehmer | 12 |
| Zeitlimit | 1 Stunde |
| Erstellungskosten | 360 Gildenkamas |
| Score | unbegrenzt; Belohnungsleiste bis 60'000 |
| Handel im Raid | deaktiviert |
| Zwischenbosse | einzigartig, kein Respawn nach Sieg |

Der Finalkampf muss vor Ablauf des Raidtimers gestartet werden; das genaue Verhalten bei Timerablauf bleibt live zu verifizieren.

### Gemeinsamer Salzpool

Salz ist eine gemeinsame Raidressource und kein persönlicher Besitz. Persönliche Inventare enthalten kein Salz. Sammeln erhöht und Lichtauffüllen vermindert den serverautoritativen Pool atomar. Jede Änderung protokolliert Actor, Serverzeit, Ursache, Vorher-/Nachher-Wert und optional verantwortliche Sammler oder Auffüller. Salz erzeugt keine Scorepunkte.

### Licht-Guide-Baseline

- erste Raid-Etage: Lichtstufe 4;
- jede neu freigeschaltete tiefere Etage: Lichtstufe 1;
- erwarteter Verfall beginnt mit der Freischaltung;
- Baseline-Intervall: 120 Sekunden;
- inkrementelle Salzkosten: `0→1 = 1`, `1→2 = 3`, `2→3 = 6`, `3→4 = 10`;
- mehrstufige Auffüllungen verbrauchen die Summe der betroffenen Schritte.

Diese Werte sind versioniert und konfigurierbar. Quellenstatus: `GUIDE_CONFIRMED`, sichtbar als noch nicht durch RAIDWEAVE live bestätigt.

### Ressourcen und Punkte

| Ressource | Punkte |
|---|---:|
| Sel des profondeurs, gemeinsam | 0 |
| Quartz | 2 |
| Opale | 4 |
| Amazonite | 6 |
| Aventurine | 10 |
| Lapiz | 15 |
| Jais | 20 |
| Onyx | 30 |
| Unité de Mureine | 1'000 |
| Rancune d'Exécrabe | 5'000 |
| Noirceur de Willorque | 10'000 |

Scorefähige Ressourcen bleiben bis zur Einzahlung persönlicher Risikobestand. Unique-Verlustverhalten ist `LIVE_REQUIRED` und keine automatische irreversible Mutation.

### Finalergebnis

Der Finalversuch endet explizit mit `VICTORY` oder `DEFEAT`. Nach einem Ergebnis ist kein zweiter Versuch zulässig; der Raid kann nach beiden Ergebnissen abgeschlossen werden. Persistiert und angezeigt werden getrennt: Ergebnis, Gesamtschaden, Schadensrunden, bestätigter Ressourcenscore, Finalbonus und Gesamtscore.

### Soft Warnings

Folgende Punkte bleiben sichtbar unbestätigt und blockieren nicht allein automatisch:

- Finalstart bei noch laufenden Kämpfen;
- 18 gegenüber 20 relevanten Monstergruppen;
- Verlustverhalten von Unique-Bossressourcen;
- exakte Fragmentgrenzen;
- Verhalten bei Timerablauf;
- Disconnect-Sonderfälle;
- Captainwechsel und externe Teilnehmerrechte.

Der Captain kann nach konkreter Warnung bewusst fortfahren. Die Warnung behauptet keine Gewissheit.

### Kartenpositionen

Nur eindeutig in den Projektquellen dokumentierte Koordinaten werden gespeichert. Fehlende Angaben für Teile von Etage −2, die gesamte Etage −4, Boss-, Fragment-, Übergabe- oder Zugangspunkte bleiben `null`/offen; es wird kein Kartenwert geschätzt. Modell und UI unterstützen unbekannte Positionen ausdrücklich.

## 5. Pilotkorrekturen

Teilnehmer dürfen über `Information incorrecte` eine Regel oder Anzeige referenzieren und eine kurze Notiz mit Actor und Zeitpunkt melden. Nur Captain oder Editor darf die Meldung mit Notiz als `PLAYER_CORRECTED` bestätigen. Eine Bestätigung bleibt additiv im Eventlog und ändert die Raiddefinition nicht automatisch.

## 6. Fachliche Konfigurierbarkeit

Raiddefinitionen enthalten Raid-ID, Spielversion, Gültigkeit, Phasen, Aufgaben, Abhängigkeiten, Score-, Timer- und Warnregeln, Quellenstatus und Änderungsnotiz. Definition und Session bleiben getrennt. Jede bestätigte Mutation erzeugt genau eine neue globale Sessionrevision und genau ein DomainEvent.
