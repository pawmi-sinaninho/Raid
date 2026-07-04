# Phase 9A Validation Report

**Projektversion:** v0.8.5.1  
**Phase:** 9A – Wow Layer Specification  
**Status:** bestanden für den Spezifikationsscope  
**Produktcode:** unverändert gegenüber v0.8.5 / funktional v0.8.0

## 1. Geprüfte Grundlagen

- `01_PRODUCT_SPEC.md`;
- `04_FEATURE_MATRIX.md`;
- `05_UI_ARCHITECTURE.md`;
- `06_DATA_AND_REALTIME_MODEL.md`;
- beide Task-Graphs;
- beide JSON-Raiddefinitionen und das Schema;
- `platform/src/core/types.ts`;
- `platform/src/core/dependency-engine.ts`, `platform/src/core/mission.ts`, `platform/src/core/radar.ts`, `platform/src/core/sanctuaire.ts`, `platform/src/core/gigalodon.ts`;
- Snapshot-, Event-, Revision- und SSE-Verträge;
- Phase-8.5-Art-Direction, Screen- und Komponentenverträge;
- bestehende Implementierungs- und Testberichte.

## 2. Abdeckungsprüfung

| Anforderung | Ergebnis |
|---|---|
| Live Raid Map Sanctuaire | vollständig spezifiziert |
| Live Raid Map Gigalodon | vollständig spezifiziert |
| Smart Next Action | Kandidaten, Scoring, Rechte, Erklärung und Empty State spezifiziert |
| Risk Engine | gemeinsame und raid-spezifische Regeln, Vertrauen und Dedupe spezifiziert |
| kritischer Pfad | struktureller Algorithmus ohne erfundene Dauern spezifiziert |
| Engpässe | Typen, Rang, Darstellung und Microcopy spezifiziert |
| Replay Summary | Vollständigkeit, Kapitel, Kennzahlen, Highlights und Partial State spezifiziert |
| Sounds | Opt-in, Rollenfilter, Dedupe, Cooldown und Accessibility spezifiziert |
| Animationen | Informationswert, Dauer, Verbote und Reduced Motion spezifiziert |
| Visual Art Direction 8.5 | Material-, Route-, Note- und Card-Grenzen integriert |
| Desktop/Tablet/Mobile | alle Zielgrössen und Rollenverhalten spezifiziert |
| Zustände/Microcopy | Loading, Reconnect, Offline, stale, partial, ended und französische Texte spezifiziert |
| technische Übergabe | Dateigrenzen, Integrationspunkte, Tests, Performance und Stop-Regeln spezifiziert |

## 3. Vertragsintegrität

Geprüft und unverändert:

- SHA-Inhalte der drei JSON-Verträge;
- `platform/src/core/*`;
- `platform/src/server/*`;
- API-Routen;
- Datenbankmigrationen;
- Commands und Eventtypen;
- Rollen und Berechtigungen.

Der optionale Replay-Endpunkt ist als spätere additive read-only Erweiterung spezifiziert. Bestehende Endpunkte und Payloads werden nicht verändert.

## 4. Kritische Designentscheidung

Mangels belastbarer Aufgabendauern wird kein zeitbasierter CPM oder eine scheinpräzise Restzeit prognostiziert. Der Begriff lautet verbindlich `Chemin critique structurel`. Die Berechnung basiert auf verpflichtenden Abhängigkeiten, aktuellen Blockaden, Zuständigkeit, Bestätigungen und der Anzahl nachgelagerter Pflichtknoten.

## 5. Replay-Grenze

Der aktuelle Snapshot liefert maximal 200 Events. Die heutigen vollständigen Simulationen liegen darunter, das Produktmodell kann diese Grenze jedoch überschreiten. Die Spezifikation verlangt deshalb entweder lückenlose vorhandene Events oder eine additive read-only Pagination. Ohne Vollständigkeit muss `Résumé partiel` erscheinen und ungesicherte Kennzahlen müssen entfallen.

## 6. Visuelle Konsistenz

Der Wow Layer verwendet:

- Route statt Node-Dashboard;
- Workbench/Plate statt universeller Card;
- Decision Note statt KPI-Alarmkachel;
- Stamp für Quellenstatus;
- ReplayThread statt Analytics-Dashboard.

Die v0.8.5-Regel von maximal drei direkt benachbarten identischen Cards bleibt erhalten.

## 7. Versionsprüfung

`v0.8.5.1` ist eine dokumentationsbezogene Zwischenversion. Sie liegt nach v0.8.5, nimmt die für Phase 8.5B reservierte Zielversion v0.8.6 nicht vorweg und enthält keinen Produktcode-Umbau.

## 8. Offene Implementierungsgates

- Phase 8.5B als v0.8.6 regressionssicher abschliessen;
- danach Phase 9B implementieren;
- Replay-Pagination technisch prüfen;
- vollständige Accessibility- und Visual-Regression ergänzen;
- echter DOFUS-Live-Test bleibt separates Fachgate.

## 9. Ergebnis

Phase 9A ist für den Spezifikationsscope vollständig. Es wurden keine bestehenden Fach-, API-, Realtime-, Raiddefinitions- oder Berechtigungsverträge geändert.
