# Spike Architecture Decision

**ADR:** ADR-005-001  
**Status:** akzeptiert  
**Stand:** 26.06.2026  
**Projektversion:** v0.5.0

## Kontext

RAIDWEAVE benötigt für Sessions mit bis zu 16 Raidteilnehmern einen serverautoritativen kollaborativen Zustand. Gleichzeitige Claims, Resultate, Zähler, Timer und anonyme Wiederverbindung dürfen nicht durch Clientzustand oder blindes Last-write-wins entschieden werden.

Der bisher bevorzugte Stack war Next.js, TypeScript und PostgreSQL. Der Realtime-Anbieter war bewusst offen.

## Entscheidung

### Produktarchitektur

1. **Frontend:** Next.js mit TypeScript.
2. **Serverlogik:** TypeScript-Domainservice mit ausschliesslich serverseitiger Intent-Validierung.
3. **Persistenz:** PostgreSQL als produktive Datenbank.
4. **Realtime-Vertrag:** HTTP-Commands für Clientabsichten und Server-Push für bestätigte Snapshots/Ereignisse.
5. **V1-Push-Transport:** Server-Sent Events sind ausreichend und werden als Standardweg festgelegt.
6. **Konfliktmodell:** globale Sessionrevision plus separate Taskrevisionen.
7. **Atomare Operationen:** Zähler und exklusive Claims werden in einer Datenbanktransaktion entschieden.
8. **Audit:** jede bestätigte Domainmutation erzeugt genau ein Event und genau eine neue Sessionrevision.
9. **Anonyme Identität:** Recovery- und Invite-Tokens werden nur gehasht persistiert.

### Spike-Implementierung

- Node.js 22;
- TypeScript;
- eingebauter HTTP-Server;
- Server-Sent Events;
- SQLite mit WAL als lokaler, transaktionaler Testersatz;
- keine externen Runtime-Abhängigkeiten.

## Begründung

SSE plus HTTP-Commands deckt den tatsächlichen Kommunikationsbedarf ab:

- Clients senden einzelne Absichten über normale Requests;
- der Server entscheidet und persistiert;
- alle Clients erhalten den bestätigten Zustand als Push;
- Browser unterstützen SSE ohne zusätzliche Clientbibliothek;
- Reconnect ist im Protokoll einfach;
- bidirektionale WebSockets sind für den aktuellen V1-Scope nicht zwingend.

Der Spike hat mit 16 Clients, Race Conditions, 50 schnellen Mutationen und Recovery zuverlässig konvergiert. Damit ist die Architekturannahme bestätigt.

## Konsequenzen

### Positiv

- einfache, prüfbare Mutationsgrenzen;
- klare Trennung zwischen Domainentscheidung und Transport;
- Konflikte sind explizit;
- Eventlog und Revisionen ermöglichen spätere Undo-/Replay-Funktionen;
- Realtime-Transport kann ausgetauscht werden, ohne Domainregeln zu ändern.

### Verpflichtend für Phase 6

- SQLite durch PostgreSQL ersetzen;
- Event-Outbox beziehungsweise transaktional gekoppelten Broadcast einführen;
- Multi-Instanz-Fan-out über PostgreSQL `LISTEN/NOTIFY`, Redis oder einen gleichwertigen Managed-Service lösen;
- SSE-Verbindungen in einem Runtime-Modell hosten, das langlebige Verbindungen unterstützt;
- Rate Limits, Tokenrotation, CSRF-/Origin-Prüfung und Secret-Lebenszyklen ergänzen;
- Editor-Scope und Teamrechte implementieren;
- Definition Loader und Dependency Engine anbinden.

### Nicht entschieden

Der konkrete Hosting- und Managed-Realtime-Anbieter bleibt eine Deploymententscheidung. Diese Offenheit ändert weder den gewählten Stack noch den geprüften Command-/Push-Vertrag.

## Verworfene Alternativen

| Alternative | Grund |
|---|---|
| Client ist autoritativ | Konflikte und Manipulation wären nicht sicher kontrollierbar |
| kompletten Sessionzustand vom Client überschreiben | erhöht Risiko für stillen Datenverlust |
| blindes Last-write-wins | widerspricht den definierten Konfliktfällen |
| WebSocket als zwingende Voraussetzung | für V1 unnötige Komplexität; SSE erfüllt den Bedarf |
| SQLite produktiv verwenden | ungeeignet für geplante Multi-Instanz- und Hostingarchitektur |
| Realtime-Anbieter vorab festlegen | wurde im Spike nicht anbieterspezifisch getestet |
