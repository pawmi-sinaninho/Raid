# Next Step

**Projektversion:** v0.8.6.1  
**Status:** Phase 8.6.1 abgeschlossen; Phase 9B bleibt der nächste getrennte technische Scope

## Genau der nächste Arbeitsschritt

**Phase 9B: Wow Layer Implementation gemäss `WOW_LAYER_SPECIFICATION.md`.**

Phase 8.6.1 hat ausschliesslich fachliche Wahrheit, Pilot-Hardening, Migration, UI und Tests korrigiert. Keine Wow-Layer-Funktion wurde vorweggenommen.

## Verbindliche Eingaben

1. `DOFUS_RCC_PROJECT_MASTER_v0.8.6.1.md`;
2. `PHASE8_6_1_RAID_TRUTH_AND_PILOT_HARDENING_REPORT.md`;
3. `WOW_LAYER_SPECIFICATION.md` und `PHASE9A_VALIDATION_REPORT.md`;
4. Definitionen `0.2.1` und die implementierte v0.8.6.1-Domain-/UI-Architektur;
5. bestehende Unit-, Simulations-, Reliability-, Browser-, Phase-8.6.1-, Visual- und A11y-Tests.

## Unveränderliche Grenzen

- keine zweite Wahrheit neben Definition, Sessionzustand und Eventlog;
- keine automatische Änderung einer Raiddefinition durch Pilotmeldungen;
- `LIVE_REQUIRED` bleibt sichtbar und erzeugt kein unbestätigtes hartes Gate;
- gemeinsamer Salzpool darf nie wieder als persönlicher Bestand modelliert werden;
- Phase-8.6.1-Migration, Event-Outbox, globale Revision und Rollenmodell bleiben erhalten;
- Reduced Motion und WCAG-AA bleiben Pflicht.

## Parallel offene externe Validierung

- DOFUS-Live-Verifikation der Guide-Baselines und Soft Warnings;
- externer PostgreSQL-/Mehrinstanzen-Test;
- WAN-/Mobilfunk-, Backup-, Restore- und Failover-Test.
