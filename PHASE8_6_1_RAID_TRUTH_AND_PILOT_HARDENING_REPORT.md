# Phase 8.6.1 – Raid Truth Reconciliation & Pilot Hardening Report

**Projekt:** RAIDWEAVE – DOFUS Raid Command Center  
**Version:** v0.8.6.1  
**Stand:** 28.06.2026  
**Ergebnis:** PASS

## 1. Gefundene Abweichungen

1. Gigalodon-Salz war als persönlicher Teilnehmerbestand modelliert, obwohl es eine gemeinsame Raidressource ist.
2. Lichtinitialisierung, Verfallsbeginn und die Kosten `1/3/6/10` waren nicht als vollständige, sichtbare Guide-Baseline implementiert.
3. Der Gigalodon-Finalzustand kannte kein explizites Ergebnis und trennte Ergebnis, Runden, Schaden und Scorebestandteile nicht vollständig.
4. Sanctuaire vermischte 60 und 80 Korridormonster, obwohl die aktuelle Guide-Baseline `10 × 6 = 60` lautet.
5. Quellenstatus verwendeten mehrere alte Semantiken und konnten Vertrauen mit Risiko vermischen.
6. Mehrere unbestätigte Regeln wirkten in Text oder Readiness zu absolut.
7. Etagenpositionsdaten waren unvollständig; für −4 und weitere Boss-/Fragment-/Übergabepunkte existiert in den Projektquellen keine eindeutige Koordinate.
8. Für Pilotabweichungen fehlte ein kleiner, protokollierter Melde- und Bestätigungsweg.

## 2. Konkret geänderte Dateien

### Domain, Server, API und Migration

- `platform/src/core/types.ts`
- `platform/src/core/raid-state.ts`
- `platform/src/core/gigalodon.ts`
- `platform/src/core/sanctuaire.ts`
- `platform/src/core/radar.ts`
- `platform/src/server/platform-store.ts`
- `platform/src/server/runtime.ts`
- `platform/src/server/db/migrations/0004_phase8_6_1_reconciliation.sql`
- `platform/app/api/sessions/[sessionId]/commands/route.ts`

### UI und Styles

- `platform/components/GigalodonCommandCenter.tsx`
- `platform/components/gigalodon/SharedSaltPool.tsx`
- `platform/components/gigalodon/LightBay.tsx`
- `platform/components/gigalodon/FinalClearance.tsx`
- `platform/components/SanctuaireCommandCenter.tsx`
- `platform/components/sanctuaire/CorridorRibbon.tsx`
- `platform/components/SessionApp.tsx`
- `platform/styles/components.css`

### Definitionen und Verträge

- `gigalodon.v0.2.json`
- `sanctuaire.v0.2.json`
- `raid-definition.schema.json`
- die synchronen Kopien unter `platform/contracts/`
- `tools/migrate-phase8-6-1-definitions.mjs`
- `platform/package.json` und `platform/package-lock.json`

### Tests, Simulationen und Artefakte

- `platform/tests/gigalodon-domain.test.ts`
- `platform/tests/gigalodon-store.test.ts`
- `platform/tests/platform-store.test.ts`
- `platform/tests/sanctuaire-domain.test.ts`
- `platform/scripts/gigalodon-simulation.ts`
- `platform/scripts/sanctuaire-simulation.ts`
- `platform/scripts/reliability.ts`
- `platform/e2e/platform.spec.ts`
- `platform/e2e/phase8-6-1.spec.ts`
- `platform/e2e/visual-authenticity.spec.ts`
- `platform/artifacts/test-summary.json`
- aktualisierte Simulations-, Reliability- und Abnahmescreenshot-Artefakte

### Dokumentation und Release

- `00_README.md`, `02_RAID_SOURCE_OF_TRUTH.md`, `06_DATA_AND_REALTIME_MODEL.md`, `07_ROADMAP.md`, `08_RESEARCH_AND_OPEN_QUESTIONS.md`
- `CURRENT_STATUS.md`, `DECISIONS.md`, `NEXT_STEP.md`, `CHANGELOG.md`, `CODEX_BACKLOG.md`, `LIVE_TEST_CHECKLIST.md`
- `GIGALODON_TASK_GRAPH.md`, `SANCTUAIRE_TASK_GRAPH.md`
- `GIGALODON_IMPLEMENTATION_ARCHITECTURE.md`, `SANCTUAIRE_IMPLEMENTATION_ARCHITECTURE.md`, `PLATFORM_CORE_ARCHITECTURE.md`
- `PHASE7_TEST_REPORT.md`, `PHASE8_TEST_REPORT.md`, `platform/README.md`
- `tools/build-release.mjs`
- `DOFUS_RCC_PROJECT_MASTER_v0.8.6.1.md`
- `DOFUS_Raid_Command_Center_Spec_v0.8.6.1.zip`

## 3. Datenmigration

Migration `0004_phase8_6_1_reconciliation.sql` erzeugt das idempotente Register `raid_data_migrations`. Nach dem Laden der Definitionen führt `migratePhase861Data()` jede bestehende Gigalodon- oder Sanctuaire-Session genau einmal auf Definition `0.2.1`.

Für Gigalodon werden alle nicht negativen alten persönlichen Salzwerte summiert und additiv in `raid_state.gigalodon.saltPool` übernommen. Ein bereits vorhandener gemeinsamer Betrag bleibt erhalten. Danach werden sämtliche `salt`-Felder rekursiv aus persönlichen Inventaren und Taskresultaten entfernt. Das Ledger erhält einen systemischen `MIGRATION`-Eintrag; alte Träger werden nur als Sammlerverantwortliche markiert, nicht als Eigentümer. Pro tatsächlich veränderter Session entstehen genau eine globale Revision, ein DomainEvent und ein Outbox-Eintrag. Eine zweite Salz-Wahrheit bleibt nicht bestehen.

Für Sanctuaire werden alte Evidenzflags kontrolliert in `corridorTargetSourceStatus` überführt. Entwicklungssessions sind verlustfrei migrierbar. Historische Actor-/Ursachendetails einzelner alter persönlicher Salzbuchungen existierten nicht und können deshalb nicht rückwirkend rekonstruiert werden; die Migration dokumentiert die Aggregation transparent als Systemursache.

## 4. Neue oder geänderte Commands und Zustände

- `ADJUST_GIGALODON_SALT`: Sammeln für alle schreibenden Raidrollen; negative Korrektur nur Captain/Editor; atomarer Pool und vollständiges Änderungsledger.
- `REFILL_GIGALODON_LIGHT`: berechnet kumulative Kosten serverseitig, belastet den Pool und aktualisiert Licht in derselben Mutation.
- `SET_GIGALODON_LIGHT`: bleibt Beobachtungscommand und kann Licht nicht still erhöhen.
- `UPDATE_GIGALODON_FINAL`: verlangt bei Abschluss `VICTORY` oder `DEFEAT`, speichert Schadensrunde und getrennte Scorewerte.
- `START_GIGALODON_FINAL`: nach einem Ergebnis dauerhaft gesperrt.
- `REPORT_INFORMATION_INCORRECT`: Teilnehmer, Editor oder Captain meldet referenzierte Information mit Notiz.
- `CONFIRM_PLAYER_CORRECTION`: nur Captain/Editor; Actor, Zeit und Notiz sind Pflicht; keine automatische Definitionsänderung.

Neue/vereinheitlichte Zustände sind `saltPool`, Lichtbaseline/Quellenstatus, `final.result`, `damageRounds`, `confirmedResourceScore`, `finalBonusScore`, `totalScore` sowie additive `informationReports`. Fachvertrauen verwendet `OFFICIAL_CONFIRMED`, `GUIDE_CONFIRMED`, `LIVE_CONFIRMED`, `LIVE_REQUIRED` und `PLAYER_CORRECTED`.

## 5. Testergebnisse

| Prüfung | Ergebnis |
|---|---|
| Typecheck | PASS |
| Unit-/Integrationstests | 6 Dateien, 33/33 PASS |
| Sanctuaire-Simulation | 49/49 Tasks, Korridor 60/60, Revision/Event 178/178, 16/16 Clients |
| Gigalodon-Simulation | 44/44 Tasks, Revision/Event 155/155, 12/12 Clients, gemeinsamer Salzpool |
| separater Finalpfad | `VICTORY` und `DEFEAT`, Startsperre und Raidabschluss PASS |
| Reliability | 10/10 Läufe, 160 Clients gesamt, 500/500 Burst-Updates PASS |
| Produktionsbuild | PASS |
| bestehende Browser-E2E | 7/7 relevante Szenarien PASS, 1 projektspezifischer Skip |
| Phase-8.6.1-E2E | 4/4 relevante Szenarien PASS, 4 projektspezifische Skips |
| Visual-Authenticity-E2E | 7/7 relevante Szenarien PASS, 5 projektspezifische Skips |
| Accessibility | 2/2 PASS; keine ernsten/kritischen Axe-Verstösse; Fokus und Reduced Motion PASS |
| npm-Audit | 0 bekannte Schwachstellen |

Die Browserprüfungen decken 390 × 844 und 1440 × 900 ohne horizontales Kernscrolling ab; die visuelle Regression zusätzlich 768 × 1024 und 1920 × 1080. Snapshot, Eventcursor, Rollen, Invite- und Recoveryregeln bleiben in der Regression erhalten.

## 6. Weiterhin offene Live-Fragen

- Finalstart bei noch laufenden anderen Kämpfen;
- 18 gegenüber 20 relevanten Monstergruppen;
- Verlustverhalten von Unique-Bossressourcen;
- exakte Fragmentgrenzen;
- Verhalten bei Timerablauf;
- Disconnect in bestimmten In-Game-Situationen;
- Captainwechsel und externe Teilnehmerrechte;
- eigene RAIDWEAVE-Live-Bestätigung der Licht- und Korridor-Guide-Baselines;
- nicht eindeutig dokumentierte Kartenpositionen, insbesondere auf −4/−6 sowie einzelne Boss-, Fragment- und Übergabepunkte.

Diese Punkte erscheinen als konkrete Soft Warnings oder offene Positionen. Der Captain kann bewusst fortfahren; es erfolgt keine automatische irreversible Mutation.

## 7. Bekannte Restrisiken

- PGlite beweist PostgreSQL-Semantik lokal, ersetzt aber keinen externen PostgreSQL-/Mehrinstanzen-, WAN-, Backup-, Restore- oder Failovertest.
- Die fachlichen Guide-Baselines sind noch nicht im aktuellen DOFUS-Client durch RAIDWEAVE selbst reproduziert.
- Die Migration kann frühere Einzelbuchungsursachen alter persönlicher Salzwerte nicht rekonstruieren, weil diese Daten nie gespeichert wurden; der Gesamtbestand bleibt erhalten.
- Unbekannte Kartenpositionen bleiben absichtlich unvollständig, bis eindeutige Evidenz vorliegt.

## 8. Bestätigung der Scopegrenze

Phase 9B wurde nicht implementiert. Es wurden keine Live Raid Map, Smart Next Action, Risk Engine, Critical-Path-Funktion, Replay Summary, Sounds oder neue Wow-Motion ergänzt. Phase 9A bleibt unverändert. Next.js-/TypeScript-Grundarchitektur, HTTP-Command-/SSE-Trennung, Event-Outbox, globale und Taskrevisionen, anonyme Tokens, Rollenmodell, Definition-/Session-Trennung, generischer Task-Renderer und `Field-built Raid Desk` bleiben erhalten.

## 9. Abschlussartefakte

`DOFUS_RCC_PROJECT_MASTER_v0.8.6.1.md` enthält sämtliche 200 Textquellen vollständig und manifestiert zusätzlich 26 Binärdateien. `DOFUS_Raid_Command_Center_Spec_v0.8.6.1.zip` enthält das vollständige Projektarchiv einschliesslich Master und Bericht. Der Builder hat alle Dateien nach erneutem Entpacken per SHA-256 geprüft. `node_modules`, `.next`, Playwright-Traces/-HTML-Berichte, temporäre Testresultate und TypeScript-Buildcache sind ausgeschlossen.
