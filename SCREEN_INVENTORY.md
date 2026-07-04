# Screen Inventory

**Dokumentstatus:** Phase 3 – Low-Fidelity-Informationsarchitektur v0.3  
**Zielgrössen:** 390×844 Teilnehmer, 768×1024 Tablet/Zweitbildschirm, 1440×900 Captain, 1920×1080 Stream  
**Regel:** Das Inventar beschreibt Informations- und Interaktionsbedarf, noch keine visuelle Premium-Gestaltung.

## 1. Verbindliche Navigationsstruktur

- **Captain Desktop:** Raidkarte → Ausnahme/Radar → Task-Detail → Verlauf.
- **Teilnehmer Mobile:** Mission → Raid → Team → Meldungen.
- **Zuschauer:** read-only Raidübersicht.
- Jede schreibende Aktion erzeugt ein Event und verwendet die Revision der betroffenen Entität.

## 2. Screens

| ID | Screen | Rollen | Zielgrösse | Priorität | Hauptzweck | Primäraktion | Task-Abdeckung |
|---|---|---|---|---:|---|---|---|
| `PUB-001` | Landing / Produktversprechen | Alle | Responsive | P1 | Raid Command Center erklären und direkten Einstieg bieten. | Raid wählen | Kein Task; Einstieg vor Session |
| `PUB-010` | Raid auswählen | Captain | Responsive | P0 | Sanctuaire oder Gigalodon mit Teilnehmergrenzen und Dauer wählen. | Raid auswählen | S0-001; G0-001 |
| `PUB-020` | Session erstellen | Captain | Desktop/Mobile | P0 | Session in höchstens vier Eingaben erstellen. | Session erstellen | S0-001; G0-001 |
| `PUB-030` | Anonym beitreten | Teilnehmer, Editor, Zuschauer | 390+ | P0 | Ohne Konto in höchstens 10 Sekunden beitreten. | Beitreten | User Flow 2; Plattform P0 |
| `SES-010` | Captain-Lobby | Captain, Editor | 1440×900 | P0 | Teilnehmer, Teams, Rollen, Ready-Check und Links steuern. | Raid starten | S0-010, S0-020; G0-010, G0-020 |
| `SES-011` | Teilnehmer-Lobby | Teilnehmer | 390×844 | P0 | Team, Startrolle und Bereitschaft ohne Captain-Details zeigen. | Bereit | S0-010, S0-020; G0-010, G0-020 |
| `SES-020` | Einladen und Teilen | Captain | Responsive | P0 | Getrennte Captain-, Editor-, Teilnehmer- und Zuschauerlinks teilen. | Teilnehmerlink kopieren | S0-001; G0-001 |
| `LIVE-100` | Captain Command Center – gemeinsame Shell | Captain, Editor | 1440×900 | P0 | Fixe Kennzahlen, Raidkarte, Radar und Verlauf zusammenhalten. | Ausnahme bearbeiten | Alle Live-Tasks beider Raids |
| `LIVE-110` | Zuschaueransicht | Zuschauer | Responsive/1920 | P1 | Read-only Raidkarte und Kennzahlen ohne Bearbeitungsaktionen. | Keine | Alle Phasen read-only |
| `TASK-200` | Generische Aufgabendetails | Captain, Editor, Teilnehmer | Drawer/Full-screen Mobile | P0 | Status, Besitzer, Abhängigkeit, Eingaben, Mechanik und Ergebnis für jede TaskDefinition rendern. | Statusabhängig: übernehmen/starten/abschliessen | Jede Aufgabe in beiden JSON-Definitionen |
| `TASK-210` | Blockade melden | Teilnehmer, Editor, Captain | Modal/Bottom sheet | P0 | Hilfe, falsche Information, Niederlage, fehlender Spieler oder Technik melden. | Meldung senden | User Flow 6; alle ACTIVE-Tasks |
| `SAN-110` | Sanctuaire Captain Map | Captain, Editor | 1440×900 | P0 | Rätsel → Wächter → Korridor → zwei Finalbosse horizontal orchestrieren. | Blockade oder unbesetzte Aufgabe öffnen | S1–S4 vollständig |
| `SAN-120` | Rätsel-Arbeitsbereich | Captain, Editor, betroffene Teams | Desktop/Tablet | P0 | Vier parallele Rätsel und ihre Ergebnisfelder anzeigen. | Rätselergebnis bestätigen | S1-BEL-010..030; S1-EPH-010..040; S1-OUV-010..040; S1-CLO-010..050 |
| `SAN-130` | Wächter-Arbeitsbereich | Captain, Editor, Wächterteams | Desktop/Tablet | P0 | Vier Wächter mit automatisch übernommenen Rätseldaten steuern. | Kampfstatus aktualisieren | S2-VEI-010..030; S2-GAR-010..030; S2-DEF-010..030; S2-SEN-010..030 |
| `SAN-140` | Korridor-Dispatcher | Captain, Editor, Teilnehmer | Desktop + Mobile Mission | P0 | Konfigurierbare Solokämpfe ohne Doppelbelegung verteilen. | Nächsten Kampf zuweisen/übernehmen | S3-COR-010..040 |
| `SAN-150` | Finalboss Split View | Captain, Editor | 1440×900 | P0 | Reine und Princesse parallel oder nacheinander verfolgen. | Team-/Mechanikrisiko bearbeiten | S4-QUE-010..050; S4-PRI-010..050; S4-ALL-900 |
| `SAN-MOB-210` | Sanctuaire persönliche Mission | Teilnehmer | 390×844 | P0 | Jetzt, Danach, Warte auf und relevante Rätseldaten zeigen. | Aufgabe starten/Ergebnis melden | Alle zuweisbaren Sanctuaire-Tasks |
| `GIG-110` | Gigalodon Captain Expedition Map | Captain, Editor | 1440×900 | P0 | Vertikale Etagen, Licht, Fragmente, Score und Finalrisiko orchestrieren. | Höchstes Risiko bearbeiten | G1–GG plus Dauerprozesse |
| `GIG-120` | Etagen- und Lichtpanel | Captain, Editor, Lichtverantwortliche | Desktop/Tablet/Mobile compact | P0 | Pro Etage Level, Countdown, Salzverantwortung und Modifier zeigen. | Lichtstatus bestätigen/auffüllen | G-LIGHT-010..040; G2-010; G4-010 |
| `GIG-130` | Ressourcenledger | Captain, Editor, Teilnehmer | Desktop table / Mobile own card | P0 | Getragen versus eingezahlt, Unique-Halter und Score at risk zeigen. | Bestand aktualisieren/einzahlen | G-LEDGER-010..030; G2-030; G4-040; G6-030; GF-010..020 |
| `GIG-140` | Luminarium und Exécrabe Sequenz | Rätselteam, Captain, Editor | Tablet/Desktop/Mobile full-screen | P0 | 4×4-Matrix und vierstufige Erscheinungssequenz fehlerarm erfassen. | Zelle/Erscheinung bestätigen | G3-010..030; G4-020..050 |
| `GIG-150` | Fragment- und Farmsteuerung | Captain, Editor, Farmteams | Desktop/Tablet | P0 | Vier Fragmente, Chance, Farmgruppen, Licht und Score at risk bündeln. | Farmgruppe zuweisen oder Farming stoppen | G5-010..040; G4-070 |
| `GIG-160` | Final Readiness Check | Captain, Editor, alle read-only | Desktop/Mobile summary | P0 | Unique-Einzahlungen, aktive Kämpfe, Team und Restzeit vor Start prüfen. | Finalstart freigeben | GF-010..040; GG-010 |
| `GIG-170` | Gigalodon Final Tracker | Captain, Editor, Finalteam | Desktop + Mobile compact | P0 | Drei Runden, Schaden, Scorestufe und Verschluckwarnung verfolgen. | Schaden/Mechanik aktualisieren | GG-020..050 |
| `GIG-MOB-220` | Gigalodon persönliche Mission + Inventar | Teilnehmer | 390×844 | P0 | Aktuelle Aufgabe, Etagenlicht und eigenes Risiko in einer Ansicht. | Aufgabe oder Inventar aktualisieren | Alle zuweisbaren Gigalodon-Tasks und G-LEDGER-010 |
| `TEAM-300` | Teamübersicht | Captain, Editor, Teilnehmer | Responsive | P0 | Teammitglieder, Verbindung, aktuelle Aufgaben und Wartezustände zeigen. | Captain: neu zuweisen; Teilnehmer: Team sehen | Team-/Zuweisungsfunktionen beider Raids |
| `MSG-310` | Meldungen und Captain Radar | Captain, Editor; Teilnehmer eigene Meldungen | Right rail / Mobile list | P0 | Nur Ausnahmen, nicht alle Daten, priorisiert anzeigen. | Warnung öffnen | Alle warningRules beider JSON-Definitionen |
| `HIST-400` | Aktivitätsverlauf und Undo | Captain, Editor read; Captain undo | Desktop drawer / Mobile list | P1 | Person, Zeit, Änderung und abhängige Folgen nachvollziehen. | Ereignis rückgängig machen | User Flow 7; alle Schreibaktionen |
| `SUM-500` | Raidzusammenfassung | Alle Sessionrollen | Responsive | P1 | Score, Zeit, Verlauf, Engpässe und Beiträge nach Ende zeigen. | Session duplizieren | S4-ALL-900; GG-050 |
| `SET-600` | Sessioneinstellungen | Captain | Responsive | P1 | Sprache, Rechte, Linkrotation, Definitionsversion und Korrekturen verwalten. | Änderung speichern | Plattform P1; keine Raidmechanik |

## 3. Zustandsanforderungen pro Screen

### PUB-001 – Landing / Produktversprechen

- **Daten:** Unterstützte Raiddefinitionen, Sprache
- **Pflichtzustände:** Default, Definition nicht verfügbar
- **Abdeckung:** Kein Task; Einstieg vor Session

### PUB-010 – Raid auswählen

- **Daten:** RaidDefinition-Metadaten
- **Pflichtzustände:** Default, deaktivierte Version, Updatehinweis
- **Abdeckung:** S0-001; G0-001

### PUB-020 – Session erstellen

- **Daten:** Name, Sprache, optional Startzeit, Raid-ID
- **Pflichtzustände:** Validierung, Erstellen, Fehler
- **Abdeckung:** S0-001; G0-001

### PUB-030 – Anonym beitreten

- **Daten:** Invite-Secret, Anzeigename, optionale Klasse
- **Pflichtzustände:** Gültiger Link, abgelaufen, voll, Recovery gefunden
- **Abdeckung:** User Flow 2; Plattform P0

### SES-010 – Captain-Lobby

- **Daten:** Participants, Teams, ReadyState, Invite-Links
- **Pflichtzustände:** Zu wenige Teilnehmer, Rollenlücke, alle bereit, Verbindungsfehler
- **Abdeckung:** S0-010, S0-020; G0-010, G0-020

### SES-011 – Teilnehmer-Lobby

- **Daten:** Eigene Rolle, Team, Startmission, ReadyState
- **Pflichtzustände:** Noch unzugewiesen, zugewiesen, bereit, Session startet
- **Abdeckung:** S0-010, S0-020; G0-010, G0-020

### SES-020 – Einladen und Teilen

- **Daten:** Invite-Secrets, Kurzcode
- **Pflichtzustände:** Kopiert, Link rotiert, Fehler
- **Abdeckung:** S0-001; G0-001

### LIVE-100 – Captain Command Center – gemeinsame Shell

- **Daten:** Timer, Score, Teilnehmer, Verbindung, Warnungen, Phasen
- **Pflichtzustände:** Live, reconnecting, stale, konfliktbehaftet, beendet
- **Abdeckung:** Alle Live-Tasks beider Raids

### LIVE-110 – Zuschaueransicht

- **Daten:** Öffentlicher Sessionzustand
- **Pflichtzustände:** Live, beendet, Link ungültig
- **Abdeckung:** Alle Phasen read-only

### TASK-200 – Generische Aufgabendetails

- **Daten:** TaskDefinition + TaskInstance + ResultData
- **Pflichtzustände:** LOCKED, READY, CLAIMED, ACTIVE, WAITING, BLOCKED, FAILED, COMPLETED, Konflikt
- **Abdeckung:** Jede Aufgabe in beiden JSON-Definitionen

### TASK-210 – Blockade melden

- **Daten:** TaskId, Typ, Notiz, Auswirkung
- **Pflichtzustände:** Entwurf, gesendet, gelöst
- **Abdeckung:** User Flow 6; alle ACTIVE-Tasks

### SAN-110 – Sanctuaire Captain Map

- **Daten:** Alle Sanctuaire-Phasen, Raid-Leben, Score, Timer
- **Pflichtzustände:** Lobby, Rätsel, Wächter, Korridor, Finale, Ende
- **Abdeckung:** S1–S4 vollständig

### SAN-120 – Rätsel-Arbeitsbereich

- **Daten:** Boote, Schach, Podeste/Blumen/Farbe, Gärten/Statue
- **Pflichtzustände:** Unzugewiesen, aktiv, wartet, unbestätigt, abgeschlossen
- **Abdeckung:** S1-BEL-010..030; S1-EPH-010..040; S1-OUV-010..040; S1-CLO-010..050

### SAN-130 – Wächter-Arbeitsbereich

- **Daten:** Zieltyp, sichere Objekte, Défenseur-Tracker, Farbe/Element
- **Pflichtzustände:** Gesperrt, bereit ohne Team, aktiv, fehlgeschlagen, abgeschlossen
- **Abdeckung:** S2-VEI-010..030; S2-GAR-010..030; S2-DEF-010..030; S2-SEN-010..030

### SAN-140 – Korridor-Dispatcher

- **Daten:** Ziel, Räume, Kämpfe, Besitzer, Restzeitprognose
- **Pflichtzustände:** Ziel unbestätigt, aktiv, Retry, vollständig
- **Abdeckung:** S3-COR-010..040

### SAN-150 – Finalboss Split View

- **Daten:** Beide Teams, Phasen, Tracker, Versuche
- **Pflichtzustände:** Beide bereit, einer aktiv, beide aktiv, einer fertig, beide fertig
- **Abdeckung:** S4-QUE-010..050; S4-PRI-010..050; S4-ALL-900

### SAN-MOB-210 – Sanctuaire persönliche Mission

- **Daten:** CurrentTask, NextTask, DependencyHint, RaidLife
- **Pflichtzustände:** Keine Aufgabe, bereit, aktiv, wartet, blockiert, neue Mission
- **Abdeckung:** Alle zuweisbaren Sanctuaire-Tasks

### GIG-110 – Gigalodon Captain Expedition Map

- **Daten:** Etagen, Zugänge, Licht, Ledger, Fragmente, Timer
- **Pflichtzustände:** Expedition, Farm, Rückweg, Finalprep, Finale, Ende
- **Abdeckung:** G1–GG plus Dauerprozesse

### GIG-120 – Etagen- und Lichtpanel

- **Daten:** LightStates, nextDecayAt, salt, activeFloor
- **Pflichtzustände:** Level 4–0, veraltet, unbestätigt, korrigiert
- **Abdeckung:** G-LIGHT-010..040; G2-010; G4-010

### GIG-130 – Ressourcenledger

- **Daten:** ParticipantInventories, Deposits, ConfirmedScore
- **Pflichtzustände:** Aktuell, veraltet, Verlust, Unique at risk, eingezahlt
- **Abdeckung:** G-LEDGER-010..030; G2-030; G4-040; G6-030; GF-010..020

### GIG-140 – Luminarium und Exécrabe Sequenz

- **Daten:** Luminarium cells/solution; Exécrabe thresholds/sequence
- **Pflichtzustände:** Unvollständig, zweitbestätigt, Konflikt, Reset, abgeschlossen
- **Abdeckung:** G3-010..030; G4-020..050

### GIG-150 – Fragment- und Farmsteuerung

- **Daten:** Fragments, dropChance, assignments, timer, risk
- **Pflichtzustände:** 1–3 fehlen, alle vorhanden, Zeitkritisch
- **Abdeckung:** G5-010..040; G4-070

### GIG-160 – Final Readiness Check

- **Daten:** FinalReadiness, timer, holders, activeFights
- **Pflichtzustände:** Blockiert, mögliche unbestätigte Blockade, bereit, gestartet
- **Abdeckung:** GF-010..040; GG-010

### GIG-170 – Gigalodon Final Tracker

- **Daten:** Round, totalDamage, bonusScore, swallowedParticipant
- **Pflichtzustände:** Runde 1–3, Verschluckwarnung, abgeschlossen
- **Abdeckung:** GG-020..050

### GIG-MOB-220 – Gigalodon persönliche Mission + Inventar

- **Daten:** CurrentTask, own inventory, floor light, next action
- **Pflichtzustände:** Mission, Warnung, Einzahlungspflicht, keine Aufgabe
- **Abdeckung:** Alle zuweisbaren Gigalodon-Tasks und G-LEDGER-010

### TEAM-300 – Teamübersicht

- **Daten:** Teams, Participants, CurrentTask
- **Pflichtzustände:** Online, reconnecting, offline, ohne Aufgabe
- **Abdeckung:** Team-/Zuweisungsfunktionen beider Raids

### MSG-310 – Meldungen und Captain Radar

- **Daten:** WarningInstances, Blockers, stale data
- **Pflichtzustände:** Keine Warnung, neue Warnung, quittiert, gelöst
- **Abdeckung:** Alle warningRules beider JSON-Definitionen

### HIST-400 – Aktivitätsverlauf und Undo

- **Daten:** Events, revisions, dependency impact
- **Pflichtzustände:** Reversibel, Folgeereignisse vorhanden, nicht reversibel
- **Abdeckung:** User Flow 7; alle Schreibaktionen

### SUM-500 – Raidzusammenfassung

- **Daten:** Frozen summary, timeline, team contributions
- **Pflichtzustände:** Sieg, Fehlschlag, Captain-Abbruch
- **Abdeckung:** S4-ALL-900; GG-050

### SET-600 – Sessioneinstellungen

- **Daten:** Session settings, invite secrets, definition version
- **Pflichtzustände:** Normal, Konflikt, Link rotiert
- **Abdeckung:** Plattform P1; keine Raidmechanik

## 4. Querschnittszustände, die jeder Live-Screen beherrschen muss

| Zustand | Darstellung und Verhalten |
|---|---|
| Laden | Skeleton nur für noch unbekannte Bereiche; bestätigte Daten bleiben sichtbar. |
| Reconnecting | Gelbe Verbindungsleiste; lokale Eingaben nicht stillschweigend als bestätigt anzeigen. |
| Konflikt | Betroffenes Feld mit Serverwert und eigenem Entwurf zeigen; Nutzer entscheidet oder lädt neu. |
| Veraltet | Zeit seit letzter Bestätigung sichtbar; bei kritischen Daten Warnung erzeugen. |
| Keine Berechtigung | Aktion ausblenden oder deaktivieren und Rolle nennen. |
| Definition aktualisiert | Laufende Session bleibt auf ihrer Definitionsversion; kein stiller Wechsel. |
| Session beendet | Schreibaktionen sperren; Zusammenfassung und Verlauf verfügbar. |

## 5. Abdeckungsmatrix der Task-Graphs

| Fachbereich | Primärscreen | Mobile-Primärscreen | Detail/Fallback |
|---|---|---|---|
| Sanctuaire Lobby | `SES-010` | `SES-011` | `TASK-200` |
| Sanctuaire Rätsel | `SAN-120` | `SAN-MOB-210` | `TASK-200` |
| Sanctuaire Wächter | `SAN-130` | `SAN-MOB-210` | `TASK-200` |
| Sanctuaire Korridor | `SAN-140` | `SAN-MOB-210` | `TASK-200` |
| Sanctuaire Finale | `SAN-150` | `SAN-MOB-210` | `TASK-200` |
| Gigalodon Lobby | `SES-010` | `SES-011` | `TASK-200` |
| Gigalodon Licht | `GIG-120` | `GIG-MOB-220` | `TASK-200` |
| Gigalodon Ledger | `GIG-130` | `GIG-MOB-220` | `TASK-200` |
| Gigalodon Etagen/Bosse | `GIG-110` | `GIG-MOB-220` | `TASK-200` |
| Luminarium/Exécrabe | `GIG-140` | `GIG-MOB-220` | `TASK-200` |
| Fragmentfarm | `GIG-150` | `GIG-MOB-220` | `TASK-200` |
| Finalfreigabe | `GIG-160` | `GIG-MOB-220` | `TASK-200` |
| Gigalodon Finale | `GIG-170` | `GIG-MOB-220` | `TASK-200` |

## 6. Abnahmekriterien

1. Jede TaskDefinition besitzt mindestens einen generischen Renderpfad über `TASK-200`.
2. Jeder P0-Fachbereich besitzt zusätzlich einen raid-spezifischen Primärscreen.
3. Teilnehmer sehen standardmässig nur eigene Mission, relevante Teamdaten und notwendige Raidkennzahlen.
4. Captain erkennt unbesetzte, blockierte, veraltete und zeitkritische Zustände ohne Durchsuchen der Taskliste.
5. Kein Screen setzt eine `LIVE_REQUIRED`-Regel als bewiesene Wahrheit voraus.
6. Alle Touchaktionen sind für mindestens 44×44 px vorgesehen; Farbe ist nie einziges Statussignal.

## Visual-Authenticity-Priorität v0.8.5

Die folgenden fünf Screens bilden den verbindlichen ersten Codex-Umbau-Scope:

1. Landingpage;
2. Session-Lobby;
3. Sanctuaire Captain Desktop;
4. Gigalodon Captain Desktop;
5. Teilnehmer Mission Mobile.

Referenz und Abnahme: `SCREEN_REDESIGN_SPECS.md` und `reference-authenticity/`.
