# Realtime Test Report

**Projektversion:** v0.5.0  
**Testdatum:** 26.06.2026  
**Status:** PASS  
**Testart:** lokaler automatisierter Technik- und Belastungstest

## 1. Testumgebung

- Node.js `v22.16.0`;
- TypeScript `5.8.3`;
- SQLite über `node:sqlite`;
- ein Serverprozess;
- Loopback-Netzwerk;
- 16 gleichzeitig verbundene SSE-Clients pro Lauf;
- zehn vollständige Wiederholungsläufe.

Die Messwerte beweisen lokale Korrektheit und Konvergenz. Sie sind **keine** Aussage über Internetlatenz, Hostinglimits oder horizontale Skalierung.

## 2. Gesamtergebnis

| Gate | Ergebnis |
|---|---:|
| vollständige Läufe | 10/10 bestanden |
| simulierte Raidclients pro Lauf | 16 |
| schnelle Updates gesamt | 500 |
| akzeptierte schnelle Updates | 500/500 |
| Clientkonvergenz | 10/10 |
| Recovery | 10/10 |
| Neustartpersistenz | 10/10 |
| exklusive Claim-Races | stets genau `200` + `409` |
| Resultatkonflikte | stets genau `200` + `409` |
| Event-/Revisionsinvariante | 10/10 |
| Zuschauer-Schreibschutz | 10/10 |

## 3. Leistungswerte

### 50-Update-Burst

- Minimum: **245 ms**;
- Maximum: **346 ms**;
- Durchschnitt: **267 ms**;
- alle 50 Mutationen wurden in jedem Lauf bestätigt;
- Endzähler war in jedem Lauf exakt `50`.

### Push-Latenz auf Loopback

- Median der Lauf-P50-Werte: **3 ms**;
- schlechtester P95-Wert: **8 ms**;
- schlechtester Einzelwert: **26 ms**.

Diese Zahlen enthalten keine reale WAN-, Mobilfunk- oder Hostinglatenz.

## 4. Race Conditions

### Exklusive Taskübernahme

Zwei Teilnehmer sendeten gleichzeitig einen Claim mit derselben erwarteten Taskrevision.

Ergebnis in jedem Lauf:

- ein Request: `200 OK`;
- ein Request: `409 REVISION_CONFLICT`;
- genau ein `ownerParticipantId`;
- kein doppelter Owner.

### Komplexes Resultat

Zwei Teilnehmer sendeten gleichzeitig unterschiedliche Resultate auf Basis derselben Taskrevision.

Ergebnis in jedem Lauf:

- ein Resultat wurde bestätigt;
- das zweite erhielt `409 REVISION_CONFLICT`;
- die Konfliktantwort enthielt den aktuellen Taskzustand und die Sessionrevision;
- kein stilles Überschreiben.

## 5. Timer

Der Timer speichert `startedAt` serverseitig und berechnet `remainingMs` aus Serverzeit und Dauer.

Im automatisierten 250-ms-Beobachtungsfenster sank die Restzeit je Lauf kontrolliert um ungefähr 254–256 ms. Lokale Clientintervalle waren nicht zustandsbestimmend.

## 6. Recovery und Persistenz

Bestätigt wurden:

1. SSE-Verbindung schliessen;
2. Identität mit `participantId` und Recovery-Token wiederherstellen;
3. aktuellen Snapshot mit derselben Sessionrevision laden;
4. SSE erneut verbinden;
5. Server vollständig beenden;
6. neuen Serverprozess mit derselben Datenbank starten;
7. Session, Taskzustände, Zähler und Eventlog unverändert wiederherstellen.

## 7. Eventlog

Der finale Testzustand besass je Lauf:

- Sessionrevision `72`;
- Eventanzahl `72`;
- lückenlos ansteigende `sessionRevision`;
- Actor, Typ, Entity, Vorher-/Nachherzustand und Zeitstempel pro Domainmutation.

Transportmetadaten und reine Reads erzeugen bewusst kein Domainevent.

## 8. Festgestellte Grenzen

Nicht durch diesen Test bewiesen:

- PostgreSQL-spezifische Transaktions- und Lockingkonfiguration;
- Multi-Instanz-Broadcast;
- Managed-Realtime-Anbieter;
- WAN- und Mobilfunkverhalten;
- Browser-Hintergrunddrosselung über lange Zeit;
- Last mit vielen parallelen Sessions;
- Security-Penetrationstest;
- Undo mit abhängigen Folgeereignissen;
- vollständige RaidDefinition- und Dependency-Engine.

## 9. Schlussfolgerung

Das Phase-5-Gate ist bestanden. Die serverautoritative Command-/Push-Architektur ist für den Plattformkern geeignet. Phase 6 darf beginnen, muss aber PostgreSQL, Multi-Instanz-Fan-out und Security-Hardening produktionsnah ergänzen.
