# Spike Runbook

**Projektversion:** v0.5.0  
**Pfad:** `spike/`

## 1. Voraussetzungen

- Node.js 22.16 oder neuer;
- TypeScript 5.8 nur für einen erneuten Build.

Der Ordner `spike/dist/` ist bereits kompiliert. Für Tests ohne Quellcodeänderung genügt Node.js.

## 2. Vollständige Verifikation

```bash
cd spike
npm run verify
```

Erwartung:

```text
# pass 1
# fail 0
```

## 3. Zehn Wiederholungsläufe

```bash
cd spike
npm run reliability
```

Ergebnisdateien:

- `artifacts/realtime-metrics.json`;
- `artifacts/reliability-summary.json`;
- `artifacts/reliability-runs/run-01.json` bis `run-10.json`.

## 4. Server manuell starten

```bash
cd spike
npm start
```

Standard:

- URL: `http://localhost:8787`;
- Datenbank: `spike/raidweave-spike.sqlite`.

Andere Werte:

```bash
PORT=9000 RAIDWEAVE_DB=./data/test.sqlite npm start
```

## 5. Healthcheck

```bash
curl http://localhost:8787/health
```

Erwartete Antwort:

```json
{"ok":true,"service":"raidweave-realtime-spike"}
```

## 6. API-Ablauf

### Session erstellen

```bash
curl -s http://localhost:8787/sessions \
  -H 'content-type: application/json' \
  -d '{
    "name":"Demo",
    "captainDisplayName":"Captain",
    "durationMs":60000,
    "tasks":[
      {"key":"task-1","title":"Erste Aufgabe","exclusive":true}
    ]
  }'
```

Die Antwort enthält:

- `sessionId`;
- Captain-Identität und Recovery-Token;
- Captain-, Teilnehmer- und Zuschauer-Invite;
- initialen Snapshot.

### Anonym beitreten

```bash
curl -s http://localhost:8787/sessions/SESSION_ID/join \
  -H 'content-type: application/json' \
  -d '{"displayName":"Player 1","inviteToken":"PARTICIPANT_INVITE"}'
```

### Stream öffnen

```bash
curl -N 'http://localhost:8787/sessions/SESSION_ID/stream?participantId=PARTICIPANT_ID&recoveryToken=RECOVERY_TOKEN'
```

### Aufgabe übernehmen

```bash
curl -s http://localhost:8787/sessions/SESSION_ID/tasks/TASK_ID/claim \
  -H 'content-type: application/json' \
  -d '{
    "participantId":"PARTICIPANT_ID",
    "recoveryToken":"RECOVERY_TOKEN",
    "expectedRevision":0
  }'
```

## 7. Konfliktantwort

Bei veralteter Taskrevision:

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "...",
    "details": {
      "currentTask": {},
      "sessionRevision": 0
    }
  }
}
```

Der Client muss seine optimistische Änderung zurückrollen und den bestätigten Zustand übernehmen.

## 8. Datenbank zurücksetzen

Server stoppen und die konfigurierte SQLite-Datei löschen:

```bash
rm -f raidweave-spike.sqlite raidweave-spike.sqlite-shm raidweave-spike.sqlite-wal
```

## 9. Diagnosegrenze

Die Startseite ist nur eine technische Orientierung. Sie ist weder ein Phase-4-Referenzscreen noch eine Grundlage für das Produktfrontend.
