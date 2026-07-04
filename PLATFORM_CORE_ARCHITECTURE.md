# Platform Core Architecture

**Projektversion:** v0.6.0  
**Phase:** 6 – Plattformkern  
**Status:** implementiert und automatisiert geprüft

## 1. Ziel

Phase 6 überträgt die in Phase 5 bewiesenen Realtime-Verträge in ein produktnahes Next.js-/TypeScript-System. Der Browser sendet ausschliesslich Absichten. Der Server validiert Rolle, Scope, Revision und Statusübergang, schreibt Zustand und Event atomar und verteilt danach bestätigte Ereignisse.

## 2. Repositorygrenze

| Bereich | Rolle |
|---|---|
| `spike/` | unveränderte technische Referenz aus Phase 5 |
| `platform/` | produktnaher Plattformkern aus Phase 6 |
| Root-JSON-Verträge | kanonische Raiddefinitionen und Design-Tokens |
| `platform/contracts/` | automatisch synchronisierte Buildkopien |

Der Diagnose-Client des Spikes wurde nicht zum Produktfrontend weiterentwickelt.

## 3. Laufzeitarchitektur

```text
Browser
  ├─ POST Commands / Session / Join
  ├─ GET Snapshot?cursor=N
  └─ GET SSE Events?cursor=N
          │
Next.js App Router
  ├─ Zod Request Validation
  ├─ Recovery Authentication
  ├─ Role- und Editor-Scope-Prüfung
  └─ PlatformStore
          │
PostgreSQL Transaction
  ├─ Domainmutation
  ├─ Sessionrevision +1
  ├─ genau ein DomainEvent
  └─ genau ein Outbox-Eintrag
          │
Outbox Dispatcher
  ├─ FOR UPDATE SKIP LOCKED
  ├─ pg_notify('raidweave_events', payload)
  └─ published_at / Retry-Metadaten
          │
SSE-Endpunkt
  ├─ Eventcursor
  ├─ LISTEN/NOTIFY Wake-up
  └─ Polling-Fallback und Snapshot-Recovery
```

## 4. Persistenz

Migration `platform/src/server/db/migrations/0001_platform_core.sql` erstellt:

1. `raid_definitions`;
2. `raid_sessions`;
3. `invite_tokens`;
4. `participants`;
5. `teams`;
6. `task_instances`;
7. `domain_events`;
8. `event_outbox`;
9. `session_snapshots`.

### Invarianten

- laufende Sessions bleiben an `definition_id + definition_version` gebunden;
- `raid_sessions.revision` steigt monoton;
- `(session_id, session_revision)` ist im Eventlog eindeutig;
- jede bestätigte Domainmutation erzeugt genau ein Event und einen Outbox-Eintrag;
- Taskrevisionen schützen exklusive oder komplexe Änderungen;
- atomare Zähler benötigen keine erwartete Taskrevision;
- Invites und Recovery-Secrets werden nur als SHA-256-HMAC-Hash mit Server-Pepper gespeichert.

## 5. Definition Loader und Abhängigkeiten

- beide Root-Definitionen werden gegen JSON Schema Draft 2020-12 geprüft;
- IDs, Referenzen und azyklischer Taskgraph werden zusätzlich validiert;
- TaskInstances entstehen bei Sessionerstellung aus der unveränderlichen Definitionsversion;
- die vorhandenen `ALL`- und `ANY`-Abhängigkeiten werden deterministisch ausgewertet;
- Abschluss oder Überspringen einer Quelle kann abhängige Tasks im selben bestätigten Domainevent auf `READY` setzen;
- Raidregeln bleiben in Definitionen und werden nicht in UI-Komponenten dupliziert.

## 6. Identität und Rechte

### Einladungen

Eine Session erzeugt getrennte Geheimnisse für:

- `CAPTAIN`;
- `EDITOR`;
- `PARTICIPANT`;
- `SPECTATOR`.

Klartext wird nur in der Create-/Rotate-Antwort ausgegeben. Rotation widerruft bestehende aktive Links derselben Rolle. Ablaufdatum, Nutzungsgrenze und Widerruf sind im Datenmodell und Join-Pfad berücksichtigt.

### Wiederverbindung

- anonymer Join erzeugt `participantId + recoveryToken`;
- der Browser speichert diese Kombination lokal;
- der Server speichert nur den Hash;
- Recovery kann rotiert werden;
- Snapshot und Eventcursor stellen den bestätigten Stand wieder her.

### Editor-Scope

`EDITOR` ist die einzige delegierte technische Rolle. Einschränkungen werden im Invite-/Participant-Scope gespeichert. Team-beschränkte Editoren dürfen nur Teilnehmer und Tasks innerhalb ihrer erlaubten Teams verändern. Globale Captain-Aktionen bleiben Captain-only.

## 7. Command-Vertrag

Der zentrale Command-Endpunkt unterstützt im Plattformkern:

- Team erstellen;
- Teilnehmer einem Team zuweisen;
- Ready-State setzen;
- Session starten;
- Task übernehmen;
- Taskstatus ändern und Ergebnis speichern;
- Task zuweisen;
- Taskzähler atomar ändern;
- Invite rotieren;
- Recovery rotieren.

Fehler werden als strukturierte Domainfehler zurückgegeben. Revisionskonflikte verwenden HTTP `409` und enthalten den aktuellen bestätigten Zustand, soweit für die Korrektur nötig.

## 8. Realtime und Recovery

- SSE ist der Push-Transport;
- Events besitzen den globalen Sessioncursor;
- der Client lädt zuerst einen Snapshot und danach Events ab Cursor;
- Streamabbruch löst einen neuen Cursor-Request aus;
- `LISTEN/NOTIFY` weckt verbundene Instanzen auf;
- periodisches Polling bleibt Fallback;
- Outbox-Worker claimen Einträge mit `FOR UPDATE SKIP LOCKED` exklusiv.

## 9. Produktoberfläche

### Lobby

- Teilnehmerliste und Rollen;
- Teams;
- Ready-Check;
- Mindestteilnehmer und Ersatzeditor;
- Sessionstart;
- Participant-Linkrotation für Captains.

### Teilnehmer

- persönliche Mission mit `MAINTENANT`, Folgeaufgabe und Blockade;
- generische statusabhängige Taskaktionen;
- mobile Bottom Navigation mit vier Zielen.

### Captain

- generischer Taskgraph-Ausschnitt;
- unbesetzte, blockierte und veraltete Zustände im Radar;
- Team- und Aktivitätsansicht;
- Taskdrawer aus Definitionsfeldern und UI-Hinweisen.

### Design

Die Oberfläche verwendet die Phase-4-Core-, Semantic- und Raid-Theme-Tokens. Sanctuaire und Gigalodon wechseln Atmosphäre und Akzent, ohne Statussemantik zu verändern.

## 10. Sicherheitsbaseline

Implementiert:

- gehashte Geheimnisse;
- Same-Origin-Prüfung für schreibende Browserrequests;
- serverseitige Rollen- und Scope-Prüfung;
- Zod-Validierung;
- parametrisierte SQL-Abfragen;
- keine direkten Client-Datenbankzugriffe;
- Zuschauer ohne Schreibrechte;
- npm-Audit ohne bekannte Schwachstellen zum Abschlusszeitpunkt.

Noch vor öffentlichem Betrieb erforderlich:

- produktive Rate Limits;
- CSP und finale Security-Header;
- Secret-Management und Rotation auf Hostingebene;
- externer Penetrationstest;
- Monitoring, Backup und Restore-Test;
- Abuse- und Session-Retention-Regeln.

## 11. Betriebsmodi

| Modus | Datenbank | Zweck |
|---|---|---|
| Test/lokal | PGlite | Unit-, Integrations-, Reliability- und lokale Entwicklungstests |
| Produktion | PostgreSQL über `pg` Pool | produktive Persistenz und Multi-Instanz-Betrieb |

PGlite führt PostgreSQL-SQL lokal aus, ersetzt aber keinen Netzwerk-, Failover- oder Managed-Service-Test.

## 12. Abgrenzung zu Phase 7/8

Nicht Bestandteil des Plattformkerns:

- vollständige Sanctuaire-Spezialmodule;
- vollständige Gigalodon-Spezialmodule;
- raid-spezifische Automationen über die bereits generische Dependency-Auswertung hinaus;
- Undo abhängiger Ereignisketten;
- Wow-Layer, Prognosen und Replay Summary.

## 13. Präsentationsergänzung v0.8.6

Phase 8.5B ergänzt den Plattformkern um eine neue Visual-Authenticity-Schicht, ohne die in diesem Dokument beschriebenen Laufzeitverträge zu verändern.

| Ebene | v0.8.6-Ergänzung |
|---|---|
| App und Komponenten | neue Public-, Lobby-, Participant- und Captain-Kompositionen |
| Styles | Token-, Font-, Material-, Raid-Theme- und Responsive-Schichten |
| Assets | lokale Fonts mit Lizenzen und eigene SVG-Iconbasis |
| Präsentationslokalisierung | französische Status-, Rollen-, Missions- und Radartexte |
| Browserprüfung | bestehende E2E plus Visual-Authenticity-, A11y- und Screenshot-Abnahme |

Unverändert sind `platform/src/core/`, `platform/src/server/`, API-Routen, Datenbankmigrationen, kanonische JSON-Verträge, Commands, Events, Revisionen, Outbox und SSE. Phase 9B wurde nicht vorweggenommen.

## 14. Fachliche Härtung v0.8.6.1

Phase 8.6.1 ändert bewusst die Gigalodon- und Sanctuaire-Fachschicht, ohne die Plattformarchitektur umzubauen:

- `raid_state.gigalodon.saltPool` ist die einzige Salz-Wahrheit; persönliche Inventare enthalten kein Salz;
- Migration `0004_phase8_6_1_reconciliation.sql` und die registrierte Datenmigration überführen Entwicklungsdaten einmalig;
- neue Commands: `ADJUST_GIGALODON_SALT`, `REFILL_GIGALODON_LIGHT`, `REPORT_INFORMATION_INCORRECT`, `CONFIRM_PLAYER_CORRECTION`;
- Finalabschluss führt `VICTORY`/`DEFEAT` explizit;
- Quellenvertrauen wird konsistent klassifiziert; `LIVE_REQUIRED` ist kein implizites Gate;
- alle bestätigten Änderungen behalten exakt eine Sessionrevision, ein DomainEvent und einen Outbox-Eintrag;
- HTTP-Command-/SSE-Trennung, globale und Taskrevisionen, Token-, Rollen-, Definition-/Session- und generische Renderer-Verträge bleiben erhalten.

Phase 9B sowie Map, Smart Next Action, Risk Engine, Critical Path, Replay, Sound und neue Wow-Motion sind nicht implementiert.
