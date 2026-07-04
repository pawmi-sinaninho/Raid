# Technical Realtime Spike Plan

**Projektversion:** v0.5.0  
**Phase:** 5 – Technischer Realtime-Prototyp  
**Status:** ausgeführt  
**Stand:** 26.06.2026

## 1. Ziel

Der Spike beweist den kollaborativen Kern von RAIDWEAVE ohne vollständiges Produktfrontend und ohne raid-spezifische Fachimplementierung.

Zu beweisen sind:

1. anonyme Sessionteilnahme über getrennte Einladungsgeheimnisse;
2. 16 gleichzeitig verbundene Raidrollen;
3. serverautoritärer Zustand und Timer;
4. Taskstatusänderungen in Echtzeit;
5. genau ein Gewinner bei einer exklusiven gleichzeitigen Taskübernahme;
6. explizite Konfliktantwort bei veralteter Revision;
7. atomare schnelle Zähleränderungen;
8. Wiederverbindung mit derselben anonymen Identität;
9. Persistenz über Serverneustart;
10. genau ein Event und eine Sessionrevision pro bestätigter Domainmutation.

## 2. Bewusst kleinster Scope

### Implementiert

- `RaidSession`;
- `Participant`;
- `TaskInstance`;
- `SharedTimer`;
- unveränderliches `Event`-Protokoll;
- Rollen `CAPTAIN`, `PARTICIPANT`, `SPECTATOR`;
- getrennte Invite-Tokens;
- lokales Recovery-Token-Modell;
- HTTP-Command-API;
- Server-Sent Events für Server-Push;
- SQLite-Persistenz mit WAL und Transaktionen;
- automatisierter 16-Client-Test;
- Diagnose-Startseite.

### Nicht implementiert

- Editor-/Teamleiter-Scope;
- vollständige RaidDefinition-Engine;
- Sanctuaire- oder Gigalodon-Module;
- Produktdesign aus Phase 4;
- Undo und Snapshot-Restore;
- Linkrotation;
- öffentliche Accounts;
- produktives Hosting;
- Multi-Instanz-Fan-out;
- vollständiges Security-Hardening.

## 3. Testmatrix

| Test | Erwartung | Automatisierung |
|---|---|---|
| Session erstellen | Session, Captainidentität und drei Invite-Tokens entstehen | ja |
| 15 Teilnehmer beitreten | zusammen mit Captain exakt 16 Raidrollen | ja |
| Zuschauer beitreten | read-only, zählt nicht zur Raidrollengrenze | ja |
| Live-Stream | jeder Client erhält initialen Snapshot und Mutationen | ja |
| Taskstatus | `READY → CLAIMED → ACTIVE` wird synchron | ja |
| Claim Race | zwei Requests, genau `200` und `409` | ja |
| Resultatkonflikt | zwei Requests mit derselben Revision, genau `200` und `409` | ja |
| 50 schnelle Updates | 50/50 akzeptiert, Endzähler 50 | ja |
| Konvergenz | alle 16 Clients besitzen denselben kanonischen Endzustand | ja |
| Timer | Restzeit wird aus Serverzeit berechnet | ja |
| Rollen | Zuschauer-Mutation und Timerstart werden mit `403` abgelehnt | ja |
| Recovery | Streamabbruch und Reconnect behalten Identität und Zustand | ja |
| Neustart | Zustand und Eventlog bleiben in SQLite erhalten | ja |
| Audit-Invariante | `session.revision == eventCount` | ja |

## 4. Messgrössen

- Anzahl bestandener Wiederholungsläufe;
- akzeptierte schnelle Updates;
- Dauer des 50-Update-Bursts;
- Push-Latenz auf Loopback;
- Statusverteilung bei Race Conditions;
- finaler Zustand aller Clients;
- Eventanzahl gegenüber Sessionrevision;
- Zustand nach Reconnect und Serverneustart.

## 5. Gate

Phase 5 gilt als bestanden, wenn alle folgenden Bedingungen gleichzeitig erfüllt sind:

- zehn vollständige Läufe ohne Testfehler;
- 500 von 500 Burst-Mutationen bestätigt;
- in jedem Claim Race genau ein Gewinner;
- in jedem Revisionskonflikt explizite `409`-Antwort;
- keine dauerhafte Clientabweichung;
- Recovery und Neustartpersistenz in jedem Lauf erfolgreich;
- keine bestätigte Domainmutation ohne Event.
