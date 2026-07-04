# Product Specification

## 1. Vision

Das Raid Command Center soll einen komplizierten Raid für eine Gruppe so verständlich machen, dass jeder Teilnehmer in wenigen Sekunden erkennt:

- wo der Raid steht;
- was gerade blockiert ist;
- was er selbst jetzt tun soll;
- welche Information noch fehlt;
- wie viel Zeit und Risiko verbleibt.

Die Website soll sich nicht wie eine Excel-Liste anfühlen, sondern wie ein **Mission-Control-System für DOFUS-Raids**.

## 2. Zielgruppen

### Primär

- Raid-Captains und Gildenorganisatoren;
- Spieler, die einen Raid erstmals durchführen;
- Gruppen, die ihre Aufgaben über Discord verteilen;
- Gilden mit gemischtem Erfahrungsstand.

### Sekundär

- erfahrene Gruppen, die Zeiten und Score optimieren;
- Streamer und Communityleiter;
- Spieler, die nur per Einladungslink teilnehmen und kein weiteres Konto erstellen wollen.

## 3. Jobs to be done

### Captain

> Wenn ich einen Raid leite, möchte ich Aufgaben und Informationen zentral koordinieren, damit ich nicht gleichzeitig Guide, Timer, Protokoll und Dispatcher im Voicechat sein muss.

### Teilnehmer

> Wenn ich im Raid bin, möchte ich jederzeit sehen, was meine aktuelle Aufgabe ist und was ich dafür wissen muss, damit ich nicht ständig nachfragen oder zwischen mehreren Seiten wechseln muss.

### Gruppe

> Wenn mehrere Teilgruppen parallel arbeiten, möchten wir gemeinsame Zustände automatisch synchronisieren, damit keine Information verloren geht oder doppelte Arbeit entsteht.

## 4. Produktprinzipien

1. **Kein Konto erforderlich:** Teilnahme über sicheren Link oder kurzen Code.
2. **Eine klare nächste Aktion:** Jede Ansicht priorisiert das aktuell Relevante.
3. **Live statt Dokumentation:** Zustände, Timer und Abhängigkeiten ändern sich in Echtzeit.
4. **Raid-spezifisch:** Keine generische To-do-App mit DOFUS-Logo.
5. **Fehlertolerant:** Rückgängig, Verlauf, Wiederverbindung und klare Bestätigungen.
6. **Mobile zuerst für Teilnehmer:** Captain kann Desktop nutzen; Teilnehmer bedienen das Tool neben dem Spiel auf Smartphone, Tablet oder Zweitmonitor.
7. **Erklärung bei Bedarf:** Mechaniken werden kontextbezogen eingeblendet, nicht als Textwand.
8. **Rechtlich eigenständig:** eigenes Branding und eigene visuelle Assets; keine Behauptung einer Ankama-Zugehörigkeit.

## 5. Kernversprechen

### Vor dem Raid

- Session in unter einer Minute erstellen;
- Link teilen;
- Teilnehmer ohne Registrierung beitreten lassen;
- Rollen, Teams und Verantwortlichkeiten festlegen;
- Ready-Check durchführen.

### Während des Raids

- Gesamtfortschritt, Restzeit, Score und Risiken sehen;
- Aufgaben zuweisen, beanspruchen und abschliessen;
- abhängige Aufgaben automatisch freischalten;
- Resultate eines Rätsels in spätere Kampfmodule übernehmen;
- persönliche nächste Aktion anzeigen;
- kritische Zustände hervorheben;
- alle Änderungen in Echtzeit synchronisieren.

### Nach dem Raid

- Ergebnis und Verlauf zusammenfassen;
- Engpässe und verlorene Zeit sichtbar machen;
- Session duplizieren;
- teilbare Zusammenfassung erzeugen.

## 6. Einzigartige Produktmechaniken

### 6.1 Persönlicher Missionsmodus

Jeder Teilnehmer sieht eine kompakte Karte:

- **Jetzt:** aktuelle Aufgabe;
- **Danach:** voraussichtliche Folgeaufgabe;
- **Warte auf:** fehlende Voraussetzung oder Person;
- **Melden:** Ergebnis, Problem oder Abschluss.

### 6.2 Abhängigkeits-Engine

Aufgaben sind nicht nur offen oder erledigt. Sie können sein:

- gesperrt;
- bereit;
- beansprucht;
- aktiv;
- wartet auf Information;
- blockiert;
- abgeschlossen;
- fehlgeschlagen;
- übersprungen.

Ein Abschluss kann automatisch:

- Folgeaufgaben freischalten;
- Raidfortschritt erhöhen;
- Score aktualisieren;
- neue Warnungen erzeugen;
- benötigte Daten in ein Kampfmodul übertragen.

### 6.3 Captain-Radar

Eine verdichtete Ansicht zeigt:

- Teams ohne aktuelle Aufgabe;
- Aufgaben ohne Verantwortlichen;
- überfällige Aufgaben;
- blockierende Informationen;
- Spieler in Risiko- oder Wartezustand;
- kritischen Pfad bis zum Raidabschluss.

### 6.4 Raid-spezifische Intelligenz

**Sanctuaire des Jardins éternels**

- Rätselresultate werden in passende Wächterkarten übernommen;
- Raid-Leben wird mit Ursache protokolliert;
- Korridormonster werden auf Teilnehmer verteilt;
- zwei Finalbossteams werden getrennt verfolgt.

**Gouffre du Gigalodon**

- Lichttimer pro Ebene;
- Salzbedarf und Zuständigkeit;
- getragene gegenüber eingezahlten Ressourcen;
- Schlüsselfragmente und Zugangszustände;
- Score- und Zeitrisiko;
- Startfreigabe für den Gigalodon.

### 6.5 Recovery by design

- anonyme Teilnehmer erhalten ein lokales Wiederverbindungs-Token;
- Zustand bleibt nach Refresh erhalten;
- Captain kann versehentliche Änderungen zurücknehmen;
- Session besitzt Snapshots;
- Änderungen werden mit Person und Zeitpunkt protokolliert.

## 7. Scope der V1

### Enthalten

- Raid erstellen und per Link teilen;
- anonyme Teilnahme;
- Captain-, Editor-, Teilnehmer- und Zuschauerrechte;
- Echtzeitstatus;
- Aufgaben, Teams, Timer, Notizen und Warnungen;
- vollständiger Live-Ablauf für beide aktuellen Raids;
- mobile und Desktop-Ansichten;
- Session speichern, fortsetzen, duplizieren und beenden;
- Aktivitätsverlauf;
- drei Sprachen als Architektur: Französisch zuerst, Englisch und Deutsch vorbereiten.

### Nicht in V1

- automatisches Auslesen des Spielclients;
- Botting, Makros oder Eingriffe in DOFUS;
- vollständiger Account- und Gildenmanager;
- öffentlicher Raid-Marktplatz;
- automatischer Build-Simulator;
- natives Desktop-Overlay;
- Bezahlmodell.

## 8. Qualitätsziele

| Ziel | Abnahmekriterium |
|---|---|
| Einstieg | Teilnehmer kann in höchstens 10 Sekunden per Link beitreten |
| Verständlichkeit | neue Person erkennt ihre Aufgabe ohne Erklärung |
| Echtzeit | Änderungen erscheinen unter normalen Bedingungen in unter 1 Sekunde |
| Stabilität | Refresh oder kurzer Verbindungsabbruch verliert keinen bestätigten Zustand |
| Kapazität | mindestens 16 gleichzeitige Teilnehmer pro Session |
| Mobile | vollständige Bedienung ab 390 px Breite |
| Desktop | Captain-Ansicht für 1440 px optimiert |
| Sicherheit | Invite-Link allein gewährt nur die dafür definierte Rolle |
| Fehlerkontrolle | kritische Aktionen sind rückgängig oder bestätigt |
| Performance | initiale Kernansicht lädt auf üblicher Verbindung in unter 2 Sekunden |

## 9. Erfolgsmessung nach Pilot

- Anteil der Teilnehmer, die ohne Hilfe beitreten;
- Anzahl Captain-Rückfragen während des Raids;
- Zahl der vergessenen oder doppelt ausgeführten Aufgaben;
- Zeit bis zur ersten sinnvollen Aufgabenverteilung;
- aktive Nutzung der persönlichen Missionsansicht;
- Wiederverwendung oder Duplizierung einer Session;
- qualitative Frage: „Würdet ihr den nächsten Raid wieder damit durchführen?“

## 10. Hauptrisiken

| Risiko | Gegenmassnahme |
|---|---|
| Raidmechaniken ändern sich durch Patches | versionierte Raiddefinitionen und Änderungslog |
| bestehende Guides decken Teilfunktionen ab | Fokus auf Live-Orchestrierung statt Guidekopie |
| Teilnehmer wollen kein Konto | anonyme Links als Kernfunktion |
| zu viele Funktionen überfordern | progressive Offenlegung und rollenabhängige UI |
| Captain wird Flaschenhals | Self-claim, Teamleiter und delegierte Editoren |
| unklare Ankama-Rechte | eigenes Branding, keine Clientmanipulation, rechtliche Prüfung vor Veröffentlichung |
| falsche Fachinformationen | Quellenstatus und In-Game-Verifikation pro Mechanik |
