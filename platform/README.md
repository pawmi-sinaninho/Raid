# RAIDWEAVE Platform

**Projektversion:** v0.8.6.1  
**Scope:** Plattformkern plus vollständige Sanctuaire- und Gigalodon-Implementierung

Das Verzeichnis `platform/` ist das produktnahe Next.js-/TypeScript-Repository. Der Phase-5-Spike unter `spike/` bleibt unverändert als technische Referenz.

## Enthalten

### Plattformkern

- Next.js App Router mit TypeScript;
- PostgreSQL-Migrationen und lokaler PGlite-Testmodus;
- Definition Loader für beide versionierten Raiddefinitionen;
- transaktionale Commands, Session- und Taskrevisionen;
- Domain-Eventlog, Event-Outbox und SSE-Reconnect-Cursor;
- anonyme, nur gehasht gespeicherte Invite- und Recovery-Tokens;
- Captain-, Editor-, Teilnehmer- und Zuschauerrechte;
- Team-beschränkte Editor-Scopes;
- Lobby, Teams, Ready-Check, persönliche Mission und Captain Radar;
- generischer Task-Renderer für jede TaskDefinition.

### Sanctuaire

- vier parallele Rätselmodule;
- serverseitige Resultatvalidierung;
- Selbst-, Zweitpersonen-, Captain- und Systembestätigung;
- definition-getriebene Datenübertragung an Wächter;
- abgeleitete Zielwerte aus versionierten Lookup-Tabellen;
- Raid-Leben mit Ursachen- und Korrekturhistorie;
- vier Wächterkarten;
- konfigurierbarer Korridor-Dispatcher mit Guide-Baseline 60 und sichtbarem `GUIDE_CONFIRMED`/nicht-live-bestätigt-Status;
- getrennte Finalbossteams und gemeinsame Abschlussbedingung;
- Sanctuaire-spezifische Radarwarnungen;
- responsive Desktop- und Mobile-Produktoberfläche.

### Gigalodon

- vertikaler Etagen- und Zugangsfortschritt;
- fünf zeitgestempelte Lichtzustände mit Baseline und Countdown;
- Guide-Baseline für Startlevel, 120-Sekunden-Verfall und inkrementelle Kosten `1/3/6/10`;
- gemeinsamer atomarer Salzpool mit Änderungshistorie und Verantwortlichen;
- Teilnehmerinventare ohne Salz und Score at risk;
- transaktionale Einzahlungen und bestätigter Score;
- Verlusthistorie, Unique-Halter und Pincen-Träger;
- Mureine-, Luminarium-, Exécrabe- und Willorque-Module;
- Fragmente und Finalstartcheck;
- drei Schadensrunden, `VICTORY`/`DEFEAT` und versionierte Bonusschwellen;
- Soft Warnings sowie `Information incorrecte`/`PLAYER_CORRECTED`;
- responsive Captain- und Teilnehmeroberfläche.

## Voraussetzungen

- Node.js 22 oder neuer;
- npm;
- für Produktion PostgreSQL und `DATABASE_URL`.

## Lokal starten

```bash
npm ci
npm run dev
```

Ohne `DATABASE_URL` startet die Anwendung standardmässig mit einem flüchtigen PGlite-Testdatenspeicher.

Persistenter lokaler Testmodus:

```bash
RAIDWEAVE_DB_MODE=pglite \
RAIDWEAVE_PGLITE_PATH=./.data/raidweave \
RAIDWEAVE_TOKEN_PEPPER='lokales-geheimnis' \
npm run dev
```

Produktiver PostgreSQL-Modus:

```bash
RAIDWEAVE_DB_MODE=postgres \
DATABASE_URL='postgresql://user:password@host:5432/raidweave' \
RAIDWEAVE_TOKEN_PEPPER='mindestens-32-zufaellige-zeichen' \
npm run build
npm start
```

## Tests

```bash
npm run typecheck
npm test
npm run test:sanctuaire
npm run test:gigalodon
npm run test:reliability
npm run build
npm run test:e2e
npm run test:e2e:phase8-6-1
```

Gesamtablauf:

```bash
npm run test:all
```

Ergebnisartefakte:

- `artifacts/test-summary.json`;
- `artifacts/sanctuaire-simulation.json`;
- `artifacts/gigalodon-simulation.json`;
- `artifacts/platform-reliability.json`;
- `artifacts/npm-audit.json`;
- `artifacts/phase7-screens/`;
- `artifacts/phase8-screens/`.

## Datenverträge synchronisieren

```bash
npm run sync:contracts
```

Kopiert werden:

- `raid-definition.schema.json`;
- `sanctuaire.v0.2.json`;
- `gigalodon.v0.2.json`;
- `design-tokens.v0.4.json`.

Die Root-Dateien bleiben die versionierten Quellen; die Kopien sind Buildinputs.

## Technische Grenzen

- PGlite ist ausschliesslich lokaler PostgreSQL-Testmotor.
- Externer PostgreSQL-, Zwei-Instanzen-, WAN-, Backup- und Failovertest bleiben vor Pilot erforderlich.
- Korridorziel 60 ist `GUIDE_CONFIRMED`, nicht RAIDWEAVE-live bestätigt und bleibt konfigurierbar.
- Die Implementierung liest oder steuert den DOFUS-Client nicht.
- Abhängiges Undo/Snapshot-Restore ist weiterhin offen.
- Licht-Guide-Baselines, Gruppenziel, Unique-Verlust und Finalstart bei laufenden Kämpfen bleiben bis zum Live-Test sichtbar gekennzeichnet; `LIVE_REQUIRED` blockiert nicht allein.
- Phase 9B, Smart Next Action, Risk Engine, Live Raid Map, Critical Path, Replay, Sound und neue Wow-Motion sind nicht implementiert.
