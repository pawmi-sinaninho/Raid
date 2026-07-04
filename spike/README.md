# RAIDWEAVE Realtime Spike

Minimaler, ausführbarer Technik-Prototyp für Phase 5. Er ist absichtlich **kein Produktfrontend** und implementiert keine vollständige Raidlogik.

## Voraussetzungen

- Node.js 22.16 oder neuer;
- TypeScript 5.8 nur für einen erneuten Build; das kompilierte `dist/` wird im Übergabepaket mitgeliefert.

## Ausführen

```bash
npm run build
npm test
npm start
```

Standardadresse: `http://localhost:8787`  
Standarddatenbank: `./raidweave-spike.sqlite`

## Technischer Umfang

- Node.js HTTP-Server;
- TypeScript-Quellen;
- SQLite mit WAL und Transaktionen;
- Server-Sent Events als Push-Transport;
- getrennte Invite- und Recovery-Tokens, nur gehasht gespeichert;
- Captain-, Teilnehmer- und Zuschauerrechte;
- Session-, Participant-, Task-, Timer- und Eventmodell;
- revisionsbasierte Konflikte;
- atomare Zähler;
- exklusive Taskübernahme;
- Persistenz über Serverneustart;
- automatisierter 16-Client-Test.

## Wichtige Grenze

SQLite und SSE sind die lokal ausführbare Spike-Implementierung. Der Produktbau soll dieselben serverautoritativen Mutationsverträge auf PostgreSQL übertragen. Das Push-Protokoll darf später SSE, WebSocket oder ein gleichwertiger Realtime-Dienst sein, ohne die Domänenregeln zu ändern.
