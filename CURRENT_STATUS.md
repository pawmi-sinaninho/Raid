# Current Status

**Stand:** 28.06.2026  
**Projektversion:** v0.8.6.1  
**Phase:** Phase 8.6.1 – Raid Truth Reconciliation & Pilot Hardening abgeschlossen

## Ergebnis

Die vor Phase 9B bekannten fachlichen Abweichungen sind innerhalb der bestehenden Next.js-/TypeScript-, HTTP-/SSE-, Event-/Revision- und Rollenarchitektur korrigiert.

- Gigalodon-Salz ist ausschliesslich eine serverautoritative gemeinsame Raidressource mit atomarem Ledger; persönliche Inventare akzeptieren kein Salz mehr.
- Die erste Etage startet mit Licht 4, neu freigeschaltete Etagen −2 bis −5 mit Licht 1. Intervall 120 Sekunden und Schritte 1/3/6/10 sind sichtbar `GUIDE_CONFIRMED`, aber noch nicht RAIDWEAVE-live-bestätigt.
- Lichtauffüllungen verbrauchen die kumulierten Schrittpreise aus dem gemeinsamen Pool.
- `VICTORY` und `DEFEAT` schliessen beide den einzigen Gigalodon-Finalversuch ab. Ergebnis, Runden, Gesamtschaden, Ressourcenscore, Bonus und Gesamtscore bleiben getrennt.
- Sanctuaire verwendet als konfigurierbare Guide-Baseline 10 Räume × 6 Monster = 60; ein eigener Live-Test bleibt offen.
- Kartenpositionen sind vollständig gegen die Projektquellen abgeglichen. Nicht belegte Werte für Etage −4, −6 und Final-/Übergabepunkte bleiben ausdrücklich `null`/offen.
- Fachliche Unsicherheiten erscheinen als Soft Warnings. `LIVE_REQUIRED` blockiert nicht unsichtbar.
- `Information incorrecte` speichert additive Meldungen. Nur Captain oder Editor kann mit Actor, Zeit und Notiz `PLAYER_CORRECTED` bestätigen; die Raiddefinition ändert sich nie automatisch.

## Datenmigration

Migration `0004_phase8_6_1_reconciliation.sql` registriert additive Sessiondatenmigrationen. `migratePhase861Data()` aggregiert alte persönliche Salzwerte einmalig in den gemeinsamen Pool, entfernt alle persönlichen Salzfelder und aktualisiert bestehende Sessions kontrolliert auf Definition `0.2.1`. Die Migration erzeugt pro tatsächlich geänderter Session genau eine Revision und ein Event.

## Abnahme

- Typecheck und Produktionsbuild: PASS;
- 6 Testdateien / 33 Unit- und Integrationstests: PASS;
- Sanctuaire-Simulation: 49/49 Tasks, 60/60 Korridor, 178/178 Revisionen/Events, 16/16 Clients;
- Gigalodon-Simulation: 44/44 Tasks, gemeinsamer Salzpool, fünf Lichtetagen, VICTORY und separater DEFEAT-Lauf, konvergierte Clients;
- neue Phase-8.6.1-E2E: 4/4 relevante Viewport-Szenarien PASS;
- bestehende Browser-E2E: 7/7 relevante Szenarien PASS;
- Visual-Authenticity-E2E: 7/7 relevante Szenarien PASS;
- Accessibility: 2/2 PASS, keine ernsten oder kritischen Axe-Verstösse;
- Reliability: 10/10 Läufe und 500/500 Burst-Updates PASS;
- npm-Audit: 0 bekannte Schwachstellen.

## Technische Grenze

Phase 9B wurde nicht implementiert. Es gibt keine neue Live Raid Map, Smart Next Action, Risk Engine, Critical-Path-, Replay-, Sound- oder Wow-Motion-Logik. Phase 9A bleibt unverändert.

## Nächster technischer Scope

Phase 9B bleibt der nächste getrennte Coding-Scope. Vor einem Pilot sind die in `LIVE_TEST_CHECKLIST.md` markierten echten DOFUS-Live-Beobachtungen weiterhin erforderlich, aber nicht als unsichtbare Softwaregates.
