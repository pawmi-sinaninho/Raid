# Live Test Checklist

**Zweck:** Alle unsicheren oder widersprüchlichen Raidregeln im aktuellen DOFUS-3-Client beweisbar verifizieren.  
**Stand:** v0.8.6.1, Phase 8.6.1.  
**Regel:** Kein eigener RAIDWEAVE-Live-Test gilt durch Erinnerung oder Hörensagen als bestanden. Guide-Baselines dürfen im Produkt verwendet werden, bleiben aber sichtbar von eigener Live-Bestätigung getrennt.

## 1. Testprotokoll pro Beobachtung

```yaml
testId:
raid:
gameVersion:
server:
dateTime:
participants:
captain:
precondition:
steps:
expected:
observed:
result: PASS | FAIL | INCONCLUSIVE
evidence:
  screenshot:
  videoTimestamp:
observers:
productImpact:
followUp:
```

## 2. Vertrauensstatus

| Status | Bedeutung |
|---|---|
| `OFFICIAL_CONFIRMED` | durch eine offizielle Quelle belegt |
| `GUIDE_CONFIRMED` | guidebasiert belegt, aber nicht zwingend durch RAIDWEAVE live bestätigt |
| `LIVE_CONFIRMED` | mit eigenem, dokumentiertem RAIDWEAVE-Live-Test bestätigt |
| `LIVE_REQUIRED` | für belastbare Bestätigung ist ein Live-Test offen; erzeugt allein kein hartes Gate |
| `PLAYER_CORRECTED` | durch Captain oder Editor bestätigte Pilotkorrektur mit Actor, Zeitpunkt und Notiz |

Der Vertrauensstatus ist keine Risikostufe. `LIVE_REQUIRED` darf ohne weitere bestätigte Fachregel keine irreversible Mutation oder automatische Sperre auslösen.

---

# 3. Gemeinsame Raidtests

## COM-001 – Teilnehmergrenzen

- Sanctuaire mit 7, 8, 16 und 17 Charakteren prüfen;
- Gigalodon mit 7, 8, 12 und 13 Charakteren prüfen;
- genaue Fehlermeldung dokumentieren.

## COM-002 – Externe Teilnehmer

Prüfen:

- Spieler ohne Gildenzugehörigkeit;
- Spieler aus anderer Gilde;
- welche Einladungsinformationen sie sehen;
- ob sie alle Raidfortschritte sehen.

## COM-003 – Captainwechsel

- Captain vor Start übertragen;
- Captain während Live-Raid übertragen;
- ursprünglicher Captain disconnectet;
- Rechte und UI prüfen.

## COM-004 – Disconnect und Reconnect

Für einen Teilnehmer:

1. ausserhalb eines Kampfs;
2. in Kampfvorbereitung;
3. während Kampf;
4. direkt nach Abschluss einer globalen Aufgabe.

Dokumentieren:

- bleibt er Raidmitglied;
- wo erscheint er wieder;
- verliert er Ressourcen;
- sieht er synchronen Fortschritt.

## COM-005 – Gemeinsamer Fortschritt

Eine Teilgruppe erledigt Aufgabe, andere Teilnehmer beobachten:

- Aktualisierungszeit;
- notwendige Kartenwechsel;
- Systemmeldung;
- Score-/Zugangsanzeige.

## COM-006 – Raidzeitende

- Zeitende ausserhalb Kampf;
- Zeitende während normalem Kampf;
- Zeitende während Finalkampf;
- tatsächliches Raidende und Belohnungszustand.

## COM-007 – In-Game-Informationsinventar

Von jeder Phase Screenshots:

- Raidkopfzeile;
- Timer;
- Score;
- Ziele;
- Teilnehmer;
- globale Meldungen;
- Karten-/Zugangsstatus.

Ziel: Nur Informationen ergänzen, die im Spiel fehlen oder schlecht verteilt sind.

---

# 4. Sanctuaire – priorisierte Tests

## SAN-P0-001 – Korridor-Baseline 60 live verifizieren

**Guide-Baseline:** 10 Räume × 6 Monster = 60, Status `GUIDE_CONFIRMED`; eigener RAIDWEAVE-Live-Test offen.

1. Übersicht/Zielanzeige vor Korridor fotografieren.
2. Anzahl Räume zählen.
3. Monster pro Raum zählen.
4. nach jedem Sieg Gesamtfortschritt beobachten.
5. Türöffnung und Scoreauslösung dokumentieren.

Ergebnis muss enthalten:

```yaml
rooms:
monstersPerRoom:
targetDisplayed:
targetActuallyRequired:
scoreAwarded:
```

## SAN-P0-002 – Raid-Leben

Prüfen:

- Startwert;
- Fehler bei Papierblume;
- Fehler bei Gartenvalidierung;
- falsches Zielmonster;
- verlorener Kampf mit 1, 2, 3 und 4 Spielern, soweit ethisch und zeitlich vertretbar;
- Lebensgewinn nach erfolgreichem Rätsel;
- Verhalten bei bereits 20 Leben.

## SAN-P0-003 – Rätselparallelität

Vier Teams starten gleichzeitig.

Dokumentieren:

- kann jedes Rätsel ohne Reihenfolge begonnen werden;
- welche Unteraufgaben blockieren sich;
- wann Wächter genau aufwachen;
- ob ein Teamwechsel nötig ist.

## SAN-P0-004 – Papierboote

Prüfen:

- genau sechs Boote;
- Verteilung 3+3;
- Startseite `[21,17]`;
- Reihenfolge der Züge;
- Auswirkungen von Fehlschüssen oder falscher Bedienung;
- Resetverhalten;
- globale Abschlussmeldung.

## SAN-P0-005 – Schach

Prüfen:

- exakte vier Zieltypen;
- genau vier Kampfteilnehmer zwingend;
- Rundenlimit;
- Lebensverlust bei Scheitern;
- Figur-Spieler-Zuordnung;
- ob Koordinaten oder Brettorientierung missverständlich sind.

## SAN-P0-006 – Monochrome

Prüfen:

- alle acht Objektpositionen;
- zwei Objekte je Podest;
- Reihenfolge I–IV;
- falscher Klick;
- vier mögliche Farben;
- wo die Farbe später sichtbar bleibt.

## SAN-P0-007 – Clos

Prüfen:

- vier Gärten;
- drei fehlende Statuen je Garten;
- falscher Zellklick versus falsche Validierung;
- Schlussstatue;
- Farbanzeige;
- Zielmonster-Mapping;
- falsches Zielmonster;
- maximale Kampfgrösse.

## SAN-P0-008 – Rätseldaten in Wächterkämpfen

Für jeden Wächter:

- benötigtes Rätselergebnis;
- exakter Fehlzustand;
- Raid-Lebensverlust;
- ob Mechanik nach Fehlversuch identisch bleibt.

## SAN-P0-009 – Guardian-Parallelität

- vier Wächter gleichzeitig starten;
- prüfen, ob ein Boss „in Kampf“ für andere blockiert;
- globale Fortschrittsmeldungen;
- Zugang Korridor nach letztem Sieg.

## SAN-P1-010 – Korridorverteilung

- mehrere Teilnehmer starten gleichzeitig Solokämpfe;
- vollständige Heilung;
- keine Begleiter;
- Niederlage und erneuter Versuch;
- Türöffnung nach letztem Kampf.

## SAN-P1-011 – Finalbosse parallel

- beide Kämpfe gleichzeitig starten;
- maximale Teamgrösse;
- Score nach erstem Boss;
- Raidstatus, solange zweiter läuft;
- Zeitablauf während eines oder beider Kämpfe;
- Raidende nach zweitem Sieg.

## SAN-P1-012 – Reine Écarlate

Nur Zustände prüfen, die das Dashboard tracken soll:

- Châtiment-Timer;
- Zahl der Gefangenen;
- Phase-1-Schwelle;
- Phase-2-Start;
- Spawn und Verwundbarkeit von Pommeau/Lame;
- dauerhafte Verwundbarkeit nach beiden Kills.

## SAN-P1-013 – Princesse Maudite

Prüfen:

- Nahdistanz-Invulnerabilität;
- Statuen ab Runde 2;
- Waffenbefreiung;
- Floraison-Zähler;
- Phase-2-Start;
- violette Glyphe;
- einmaliger Zauber;
- zwei Anwendungen bis Verwundbarkeit.

## SAN-P2-014 – Manuskript

- alle fünf Positionen;
- erforderliches Doppelklicken;
- Fortschritt pro Seite;
- fünfte Seite erst nach Wächterzugang.

---

# 5. Gigalodon – priorisierte Tests

## GIG-P0-001 – Lichttimer

**Guide-Baseline:** erste Etage startet auf 4, jede neu freigeschaltete tiefere Etage auf 1; Verfall beginnt bei Freischaltung und wird alle 120 Sekunden erwartet. Status `GUIDE_CONFIRMED`, nicht live bestätigt.

Pro Etage:

1. Level 4 mit Zeitstempel erfassen.
2. ohne Eingriff bis 3, 2, 1, 0 beobachten.
3. Abweichung vom 120-Sekunden-Takt messen.
4. Browser-/Ladezeiten notieren.
5. Verhalten während Kampfvorbereitung und laufendem Kampf prüfen.

## GIG-P0-002 – Salzkosten

**Guide-Baseline:** inkrementell `0→1 = 1`, `1→2 = 3`, `2→3 = 6`, `3→4 = 10`; kumulative Auffüllungen addieren diese Schritte. Status `GUIDE_CONFIRMED`, nicht live bestätigt.

Für mehrere Ausgangslevel testen:

- 0→1;
- 0→2;
- 0→3;
- 0→4;
- 1→4;
- 2→4;
- 3→4.

Ziel: Guide-Baseline live bestätigen oder als `PLAYER_CORRECTED` mit Evidenz korrigieren.

## GIG-P0-003 – Gekoppelte Luminomachines

- erste Maschine auffüllen;
- zweite Maschine prüfen;
- Zeitstempel und Level vergleichen.

## GIG-P0-004 – `Idées noires`

Je Level 0–4:

- Monster-HP;
- Macht-/Schadensanzeige;
- BP;
- Aggressionsradius auf 0;
- Gültigkeit für Mureine und Exécrabe;
- Nichtgültigkeit für Willorque/Gigalodon.

## GIG-P0-005 – Ressourcenverlust

Mit bewusst kleinem Testinventar:

- normalen Kampf verlieren;
- Teleportziel;
- welche Ressourcen verschwinden;
- Veränderung des gemeinsamen Salzpools;
- allgemeine Schätze;
- Verhalten bei Unique-Ressource nur testen, wenn ohne irreversiblen Pilotverlust möglich.

## GIG-P0-006 – Etage--1-Gruppenzahl

- alle Gruppen auf Karte zählen;
- Zielanzeige prüfen;
- 18 versus 20 klären;
- Respawnverhalten.

## GIG-P0-007 – Fragment 1

- Alterations vor und nach Kämpfen vergleichen;
- globale Vergabe an nicht teilnehmende Spieler prüfen;
- Anzeige und Benachrichtigung dokumentieren.

## GIG-P0-008 – Mureine-Ausgänge

Nach Sieg:

- Unique-Ressourcenhalter;
- Fragment 2 für alle;
- Gutschrift im gemeinsamen Salzpool und Verantwortlichenmarkierung;
- Zugangsfreischaltung;
- Boss-Respawn/erneuter Start unmöglich.

## GIG-P0-009 – Luminarium

- 4×4 bestätigt;
- Toggle-Regel;
- Solverergebnis;
- Abschlusszustand;
- gleichzeitige Klicks zweier Spieler;
- Reset oder Fehlerzustände.

## GIG-P0-010 – Exécrabe-Sequenz

- Schwellen exakt 80/60/40/20k;
- vier verschiedene Formen;
- Reihenfolge im Chat/Buff sichtbar;
- doppelte Form ausgeschlossen;
- Sequenz bleibt nach Kampfsieg relevant.

## GIG-P0-011 – Exécrabe-Rätselstrafe

- falsche Statue;
- `-1'000 Score`;
- Score unter 0 möglich;
- Sequenzreset;
- richtiger Abschluss;
- Zugang Etage -5.

## GIG-P0-012 – Unique-Drops und Pince

- Rancune-Halter;
- Pincen-Halter;
- kein Handel;
- nur Halter kann Abkürzung öffnen;
- Status bei Disconnect des Halters;
- Abkürzungsroute.

## GIG-P0-013 – Fragmentdropchance

Scorezustände, soweit praktikabel:

- <5'000;
- 5'000;
- 7'000;
- 10'000;
- >10'000.

Prüfen:

- sichtbarer Dropchancenhinweis;
- Grenzwertinklusion;
- gemeinschaftlicher Fragmenterhalt.

## GIG-P0-014 – Willorque

- kein Etagenlicht;
- dunkle Aggressionskarte;
- 10 Lampenfische;
- initial vier an;
- Light Count;
- 43'400-Schwelle;
- Unique-Ressource nach Sieg.

## GIG-P0-015 – Gigalodon bei laufendem Kampf starten

**Höchste Priorität für Finalcheck.**

1. kleiner Nebenkampf läuft;
2. Captain versucht Finalstart;
3. Fehlermeldung oder Start dokumentieren;
4. nach Kampfende erneut versuchen.

## GIG-P0-016 – Timerablauf und Patch 3.6.4.3

Patch 3.6.4.3 erwähnt einen Fehler, bei dem der Gigalodon-Raid am Timerende nicht korrekt enden konnte.

Prüfen:

- aktuelles Verhalten nach Patch;
- Session-/Raidende;
- Spielerteleport;
- Score;
- Belohnungsanspruch.

## GIG-P0-017 – Finalstart vor Ablauf

- Finalkampf wenige Sekunden vor 0 starten;
- globaler Timer erreicht 0 während Vorbereitung;
- während Runde 1;
- Kampf darf normal weitergehen;
- Score/Ende dokumentieren.

## GIG-P1-018 – Vorbereitungszeit Finalkampf

- bestätigte drei Minuten;
- Verhalten bei nicht bereiten Spielern;
- kann Captain abbrechen;
- Einfluss auf globalen Timer.

## GIG-P1-019 – Gigalodon-Schadensscore

Schadensschwellen stichprobenartig bestätigen:

- 10k;
- 100k;
- 300k;
- 1 Mio. oder höchstmöglicher Testwert.

Prüfen, ob Zwischenwerte abrunden auf letzte Schwelle.

## GIG-P1-020 – Verschluckmechanik

- Kontaktfeld;
- schwarzes Feld;
- Feld leer;
- Feld besetzt;
- Wechsel des verschluckten Ziels;
- Zustand `Recraché`.

## GIG-P1-021 – Einzahlungslogik

- Teilinventar versus „alle Schätze“;
- gemeinsamer Salzpool bleibt ausserhalb des persönlichen Einzahlungsinventars;
- bestätigter Score sofort;
- mehrfach einzahlen;
- andere Spieler sehen Score live.

---

# 6. Produkttests während eines echten Raids

## UX-001 – Beitritt ohne Konto

Messung:

- Zeit Link → Session;
- Fehlversuche;
- Rückfragen;
- Wiederverbindung nach Refresh.

Ziel: Median unter 10 Sekunden.

## UX-002 – Persönliche Mission

Nach Aufgabenverteilung fragt ein Beobachter jeden Teilnehmer:

> „Was musst du jetzt tun?“

Pass, wenn der Teilnehmer ohne Voice-Erklärung innerhalb von 10 Sekunden korrekt antwortet.

## UX-003 – Captain Radar

Während Raid absichtlich erzeugen:

- eine unbesetzte Aufgabe;
- eine blockierte Aufgabe;
- eine veraltete Inventarbestätigung;
- ein kritisches Lichtlevel.

Pass, wenn Captain alle vier ohne Durchsuchen erkennt.

## UX-004 – Datenweitergabe

Sanctuaire:

- Monochrome-Farbe eintragen;
- Wächterteam muss sie automatisch sehen.

Gigalodon:

- Pincen-Träger bestätigen;
- alle sehen eindeutig, wer die Abkürzung öffnen muss.

## UX-005 – Voice-Reduktion

Vor und nach Nutzung schätzen/messen:

- Anzahl wiederholter Statusfragen;
- „Wer macht was?“;
- „Welche Farbe/Sequenz war es?“;
- „Wer trägt die Ressource?“;
- „Wie viel Zeit bleibt?“.

## UX-006 – Fehlbedienung und Undo

- Aufgabe versehentlich abschliessen;
- Resultat korrigieren;
- Lebens-/Scoreänderung rückgängig;
- alle Clients bleiben konsistent.

## UX-007 – 16-Client-Realtime-Test

- 16 Browserinstanzen;
- 50 schnelle Statusänderungen;
- gleichzeitige Taskübernahmen;
- Timer;
- Reconnect;
- Konflikte.

Pass:

- kein stiller Datenverlust;
- kein doppelter exklusiver Owner;
- alle Clients konvergieren auf denselben Zustand.

---

# 7. Priorisierte Reihenfolge für den ersten echten Testabend

1. `SAN-P0-001` Korridorziel;
2. `GIG-P0-015` Finalstart bei laufendem Kampf;
3. `GIG-P0-001/002` Lichttimer und Salzkosten;
4. `COM-004` Reconnect;
5. `SAN-P0-002` Raid-Leben;
6. `GIG-P0-005` Ressourcenverlust;
7. `GIG-P0-006` Gruppenzahl;
8. `GIG-P0-016/017` Timerende;
9. `UX-002/003/004` Kernnutzen;
10. übrige Mechanikdetails.

## 8. Abschlusskriterium der Fachphase

Die Fachphase ist abgeschlossen, wenn:

- jede `LIVE_REQUIRED`-Regel entweder bestätigt oder bewusst als konfigurierbare Unsicherheit behandelt ist;
- kein kritischer Pfad auf einer ungeprüften Zahl beruht;
- Task-Graphs mit aktuellem Spielverhalten übereinstimmen;
- Pilotgruppe den Ablauf einmal vollständig durchspielen konnte;
- alle Abweichungen versioniert dokumentiert wurden.
## UX-008 – Information incorrecte

- Teilnehmer meldet eine konkret referenzierte Regel/Anzeige mit kurzer Notiz;
- Actor und Serverzeit erscheinen im Protokoll;
- Meldung verändert die Raiddefinition nicht;
- Teilnehmer kann nicht selbst `PLAYER_CORRECTED` bestätigen;
- Captain oder Editor bestätigt mit eigener Notiz;
- Korrektur bleibt nach Reconnect sichtbar.

## UX-009 – Unbekannte Kartenpositionen

- offene Position auf Etage −2, −4 oder −6 anzeigen;
- kein geschätzter Kartenwert erscheint;
- bekannte Luminomachinen-, Salz-, Zugangs-, Käfig- und Autopilotpositionen gegen den aktuellen Client prüfen;
- Abweichung über `Information incorrecte` melden.
