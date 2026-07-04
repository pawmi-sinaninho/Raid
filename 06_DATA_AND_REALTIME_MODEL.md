# Data and Realtime Model

## 1. Grundsatz

Die Website ist ein kollaboratives Zustandsmodell. Die Raiddefinition beschreibt, **was möglich ist**. Die Session speichert, **was in diesem Durchgang passiert**.

## 2. Kernentitäten

### RaidDefinition

- `id`
- `slug`
- `name`
- `gameVersion`
- `definitionVersion`
- `validFrom`
- `maxParticipants`
- `timeLimitSeconds`
- `scoreRules`
- `phaseDefinitions`
- `taskDefinitions`
- `dependencyDefinitions`
- `warningRules`
- `sourceReferences`

### RaidSession

- `id`
- `raidDefinitionVersion`
- `name`
- `language`
- `status`
- `createdAt`
- `startedAt`
- `endedAt`
- `captainParticipantId`
- `timerState`
- `score`
- `raidSpecificState`
- `revision`

### Participant

- `id`
- `displayName`
- `classId` optional
- `role`
- `teamId`
- `connectionState`
- `readyState`
- `currentTaskId`
- `lastSeenAt`
- `anonymousRecoveryHash`

### Team

- `id`
- `name`
- `leaderParticipantId`
- `participantIds`
- `assignedTaskIds`

### TaskInstance

- `id`
- `definitionId`
- `status`
- `assignedTeamId`
- `assignedParticipantIds`
- `startedAt`
- `completedAt`
- `resultData`
- `blockedReason`
- `revision`

### SharedTimer

- `id`
- `type`
- `startedAt`
- `durationSeconds`
- `pausedAt`
- `adjustmentSeconds`
- `status`

### Event

- `id`
- `sessionId`
- `actorParticipantId`
- `type`
- `entityId`
- `before`
- `after`
- `createdAt`
- `reversible`
- `causedByEventId`

## 3. Raid-spezifischer Zustand

### SanctuaireState

- `raidLife`
- `raidLifeHistory`
- `puzzleStates`
- `guardianStates`
- `corridorTarget`
- `corridorCompleted`
- `corridorAssignments`
- `princessState`
- `queenState`

### GigalodonState

- `floorStates`
- `lightStates`
- `saltPool` mit globalem Betrag und unveränderlicher Änderungshistorie
- `participantInventories`
- `depositedResources`
- `bossUniqueDrops`
- `accessStates`
- `keyFragmentStates`
- `gigalodonStartReadiness`
- `estimatedScore`
- `confirmedScore`
- `final.result`, `damageRounds`, `totalDamage`, `confirmedResourceScore`, `finalBonusScore`, `totalScore`

### InformationReport

- referenzierte Regel oder Anzeige;
- Teilnehmernotiz, Actor und Serverzeit;
- optionale Bestätigung `PLAYER_CORRECTED` mit Captain-/Editor-Actor, Zeitpunkt und Notiz;
- additive Speicherung im Raid-State/Eventlog ohne automatische Definitionsänderung.

## 4. Aufgabenstatusmaschine

```text
LOCKED
  ↓ Voraussetzung erfüllt
READY
  ↓ übernehmen
CLAIMED
  ↓ starten
ACTIVE
  ├─→ WAITING
  ├─→ BLOCKED
  ├─→ FAILED
  └─→ COMPLETED
```

Zusätzlich:

- `SKIPPED`;
- Rückkehr aus `WAITING` oder `BLOCKED` nach `ACTIVE`;
- Reset nur mit Berechtigung und Ereignisprotokoll.

## 5. Abhängigkeiten

Mögliche Regeln:

- alle vorherigen Aufgaben abgeschlossen;
- mindestens eine von mehreren Aufgaben abgeschlossen;
- bestimmtes Resultat vorhanden;
- Mindestanzahl Teilnehmer;
- Team bereit;
- Ressource eingezahlt;
- Timer noch über Schwelle;
- manuelle Captain-Freigabe.

## 6. Echtzeitregeln

- Serverzustand ist autoritativ.
- Clients senden Absichten, nicht ungeprüfte Komplettzustände.
- Änderungen verwenden Versionsnummern.
- Zähler werden atomar aktualisiert.
- Timer basieren auf Serverzeit, nicht auf lokalen Intervallen.
- jeder bestätigte Schreibvorgang erzeugt ein Event.
- Benutzeroberfläche darf optimistisch aktualisieren, muss bei Konflikt zurückrollen.

## 7. Link- und Berechtigungsmodell

Eine Session besitzt getrennte Einladungsgeheimnisse:

- Captain;
- Editor;
- Teilnehmer;
- Zuschauer.

Die Geheimnisse werden nicht im Klartext in der Datenbank gespeichert. Ein kompromittierter Teilnehmerlink darf keine Captainrechte gewähren.

## 8. Anonyme Wiederverbindung

- beim Beitritt wird ein zufälliges Recovery-Token erzeugt;
- Browser speichert es lokal;
- Server speichert nur einen Hash;
- Token ist an Session und Teilnehmer gebunden;
- Captain kann Verbindung zurücksetzen;
- keine E-Mail erforderlich.

## 9. Snapshots und Undo

- periodische Session-Snapshots;
- Eventlog für einzelne Änderungen;
- Undo prüft, ob abhängige Folgeereignisse betroffen sind;
- bei komplexen Fällen wird ein konsistenter Snapshot wiederhergestellt;
- nie stillschweigend Daten löschen.

## 10. Technische Architektur nach Phase 5

- Next.js + TypeScript für Produktfrontend und Anwendung;
- PostgreSQL als produktive Persistenz;
- HTTP-Commands für validierte Clientabsichten;
- Server-Sent Events für bestätigten Server-Push;
- globale Sessionrevision plus separate Taskrevisionen;
- atomare Datenbankoperationen für Claims und Zähler;
- Eventlog im selben transaktionalen Commit wie die Mutation;
- gehashte Invite- und Recovery-Tokens;
- PWA-Fähigkeit vorbereiten.

Der Phase-5-Spike verwendet SQLite mit WAL als lokalen transaktionalen Testersatz. SQLite ist nicht für den Produktbetrieb vorgesehen. Der konkrete Hosting- und Managed-Realtime-Anbieter bleibt austauschbar, solange langlebige Push-Verbindungen, Multi-Instanz-Fan-out und transaktionale Eventpublikation unterstützt werden.

## 11. Maschinenlesbare Implementierungsverträge

- `raid-definition.schema.json` ist der gemeinsame Strukturvertrag.
- `sanctuaire.v0.2.json` und `gigalodon.v0.2.json` beschreiben mögliche Regeln, Aufgaben, Abhängigkeiten, Warnungen und Datenübertragungen.
- Laufende Sessiondaten gehören nicht in die Definition und bleiben an deren unveränderliche Versionsnummer gebunden.
- `LIVE_REQUIRED`-Regeln dürfen bis zur Verifikation nur konfigurierbar oder manuell bestätigt verwendet werden.

## 12. Implementierter Plattformkern v0.6.0

Der produktnahe Plattformkern unter `platform/` konkretisiert das Modell wie folgt:

- `raid_definitions` speichert die unveränderliche JSON-Definition pro Version;
- `raid_sessions` bindet jeden Durchgang an genau diese Version;
- `invite_tokens` und `participants.recovery_hash` speichern ausschliesslich gehashte Geheimnisse;
- `participants.role_scope` und `invite_tokens.scope` begrenzen Editoren auf Teams oder Aufgabenbereiche;
- `task_instances` besitzt globale Zuordnung, Owner, Ergebnisdaten und eigene Revision;
- `domain_events` besitzt einen eindeutigen Cursor pro Sessionrevision;
- `event_outbox` wird im selben Commit geschrieben und mit `SKIP LOCKED` verarbeitet;
- `session_snapshots` bildet die Grundlage für Cursor-Recovery und späteres konsistentes Undo.

### Command- und Eventregel

Eine bestätigte Clientabsicht erzeugt genau eine neue Sessionrevision und genau ein DomainEvent. Direkt daraus folgende generische Taskfreischaltungen werden in derselben Transaktion ausgeführt und im `after`-Zustand dieses Events dokumentiert.

### Push- und Recovery-Regel

PostgreSQL bleibt die Quelle der Wahrheit. `LISTEN/NOTIFY` weckt SSE-Verbindungen auf, transportiert aber nicht den einzigen Zustand. Clients können jederzeit Snapshot plus Events ab Cursor nachladen.

### Test- und Produktionsmodus

- PGlite: lokaler PostgreSQL-kompatibler Testmotor;
- PostgreSQL über `pg`: produktiver Datenbankpfad.

Ein externer Multi-Instanz-Deploymenttest bleibt vor dem Pilot erforderlich.



## 13. Implementierter Sanctuaire-Zustand v0.7.0

Phase 7 persistiert raid-spezifischen Zustand in `raid_sessions.raid_state` und initialisiert ihn aus dem versionierten `stateModel` der Raiddefinition. Der Plattformkern bleibt für Authentifizierung, Revisionen, Eventlog, Outbox und SSE zuständig.

### Resultate und Bestätigung

- Entwurf, Einreichung und Bestätigung sind getrennte Commands.
- Pflichtfelder, Typen, Enum- und Mengenregeln werden serverseitig aus der TaskDefinition validiert.
- `SECOND_PERSON` verlangt eine andere Person; `CAPTAIN` wird rollenbasiert erzwungen.
- Nur bestätigte Resultate lösen Transfers, Automationen und Dependencies aus.

### Definition-getriebene Folgeaktionen

- `dataTransfers` kopieren bestätigte Resultate in abhängige TaskInstances.
- Lookup-Tabellen erzeugen abgeleitete Wächterwerte wie Zielelement, Monster und Karte.
- System-Gates werden automatisch abgeschlossen, sobald ihre Definition erfüllt ist.
- Alle direkten Folgeänderungen bleiben Bestandteil derselben Revision und desselben Domainevents.

### Sanctuaire-Spezialzustände

- Raid-Leben `0..20` mit unveränderlicher Ursachen- und Korrekturhistorie;
- konfigurierbares Korridorziel mit separatem In-Game-Evidenzstatus;
- Korridorfortschritt und Teilnehmerzuweisungen;
- getrennte Zustände beider Finalbosse;
- Sessionende erst nach gemeinsamer Abschlussbedingung.


## 14. Implementierter Gigalodon-Zustand v0.8.6.1

Phase 8 verwendet denselben persistierten `raid_sessions.raid_state` und dieselben transaktionalen Eventverträge wie Sanctuaire.

### Licht und Etagen

- Etage −1 startet auf der Guide-Baseline 4; neu freigeschaltete tiefere Etagen starten auf 1;
- pro Etage zeitgestempelte Beobachtung mit Baseline, Verantwortlichem und nächstem erwarteten Verfall;
- konfigurierbares 120-Sekunden-Intervall mit `GUIDE_CONFIRMED` und sichtbarer fehlender Live-Bestätigung;
- inkrementelle Salzkosten `1/3/6/10`, mehrstufig kumuliert und gleich gekennzeichnet;
- Etage--1-Gruppenziel und dessen Evidenz getrennt;
- Zugänge und Fragmente definitionsgetrieben.

### Inventar und Score

- persönliches getragenes Inventar mit Standort, Risiko und Aktualität;
- kein Salz im persönlichen Inventar;
- serverautoritatives `saltPool` mit atomaren Änderungen, Actor, Zeit, Ursache, Vorher-/Nachher-Wert und Verantwortlichen;
- `projectedUnbankedScore` ausschliesslich aus getragenen Ressourcen;
- `confirmedScore` ausschliesslich aus transaktionalen Einzahlungen;
- separate Deposit- und Loss-Historien;
- Unique-Halter und Pincen-Träger;
- Unique-Verlust nur mit eigenem Evidenzstatus.

### Finale

- Finalbereitschaft trennt blockierende, unbestätigte und erfüllte Bedingungen; `LIVE_REQUIRED` allein blockiert nicht;
- `FINAL_PREP` und `FINAL_ACTIVE` als explizite Sessionzustände;
- drei Schadensrunden und versionierte Bonusschwellen;
- Ergebnis `VICTORY` oder `DEFEAT` beendet den einzigen Finalversuch;
- Schadensrunden, Gesamtschaden, bestätigter Ressourcenscore, Finalbonus und Gesamtscore bleiben getrennt;
- Sessionende nach beiden Ergebnissen möglich.

## 15. Quellen- und Migrationsmodell v0.8.6.1

Fachvertrauen verwendet `OFFICIAL_CONFIRMED`, `GUIDE_CONFIRMED`, `LIVE_CONFIRMED`, `LIVE_REQUIRED` und `PLAYER_CORRECTED`. Migration `0004_phase8_6_1_reconciliation.sql` registriert die einmalige Datenmigration: vorhandenes persönliches Entwicklungssalz wird summiert in den gemeinsamen Pool überführt und anschliessend vollständig aus persönlichen Inventaren/Resultaten entfernt. Pro migrierter Session entstehen genau eine Revision, ein DomainEvent und ein Outbox-Eintrag.
