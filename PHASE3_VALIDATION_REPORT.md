# Phase 3 Validation Report

**Stand:** 26.06.2026  
**Ergebnis:** PASS  
**Prüfumfang:** JSON-Schema, beide Raiddefinitionen, Task-Graph-Abdeckung, Referenzen, Dependency-DAG, Screen- und Wireframe-Mindestabdeckung.

## 1. Maschinelle Validierung

- `raid-definition.schema.json` ist ein gültiges JSON Schema Draft 2020-12.
- Beide Raiddefinitionen validieren ohne Schemafehler.
- Alle Task-, Dependency-, Score-, Warning-, Automation-, Transfer-, Quellen- und Open-Question-IDs sind innerhalb ihrer Kategorie eindeutig.
- Jede Aufgabe verweist auf eine vorhandene Phase.
- Jede Dependency verweist ausschliesslich auf vorhandene Aufgaben.
- Beide Abhängigkeitsgraphen sind azyklisch.
- Alle im Quell-Task-Graph konkret nummerierten Aufgaben sind in der jeweiligen JSON-Definition enthalten.

## 2. Mengen und Abdeckung

| Definition | Quellaufgaben | JSON-Aufgaben | Phasen | Dependencies | Score-Regeln | Warnungen | Automationen | Datenübertragungen | Lookup-Tabellen | Offene Fragen |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Sanctuaire | 48 | 49 | 16 | 47 | 4 | 5 | 4 | 6 | 6 | 4 |
| Gigalodon | 44 | 44 | 12 | 43 | 13 | 9 | 7 | 8 | 6 | 8 |

Sanctuaire enthält zusätzlich die aus dem optionalen Abschnitt abgeleitete Aufgabe `S-OPT-MAN-010` für Manuskriptseiten. Gigalodon enthält exakt alle 44 konkret nummerierten Quellaufgaben.

## 3. Konsistenzentscheidungen

| Befund | Auflösung |
|---|---|
| Roadmap nannte Wireframes früher Phase 2 und visuelles Design Phase 3. | Roadmap an den tatsächlichen Projektablauf angepasst: Phase 3 = Datenmodell/Wireframes, Phase 4 = visuelles Design. |
| Raiddefinition und Sessionzustand waren konzeptionell beschrieben, aber nicht formal getrennt. | Schema enthält nur versionierte Definition; Laufzeitdaten bleiben in `RaidSession`. |
| Editor und Teamleiter konnten als zwei Rollen verstanden werden. | Eine technische Rolle `EDITOR`; Teamleiter über Bereichs-/Team-Scope. |
| Unbestätigte Regeln könnten versehentlich hart implementiert werden. | `LIVE_REQUIRED`, Open Questions und sichtbare UI-Unsicherheit sind verbindlich. |
| Gigalodon-Score ist unbegrenzt, Belohnungsleiste endet bei 60’000. | `scoreConfiguration.maximum = null`, `rewardTrackMaximum = 60000`. |
| Sanctuaire-Korridor nennt 60 und 80. | `corridorTarget` konfigurierbar; Default 60, Konflikt explizit. |
| Etage -1 nennt 18 Gruppen, Übersicht 20 im Raid. | `groupTarget` konfigurierbar; Default 18. |

## 4. Verbleibende fachliche Lücken

Diese Lücken wurden nicht erfunden oder still geschlossen:

1. Sanctuaire-Korridorziel 60/80.
2. Gigalodon-Lichtintervall und Salzkostensemantik.
3. Gigalodon-Start bei aktivem Parallelkampf.
4. Unique-Ressourcenverlust bei Niederlage.
5. Fragmentchance an 7’000 und 10’000.
6. Timerende nach Patch 3.6.4.3.
7. Bereits im Client sichtbare globale Informationen.

Alle Punkte besitzen eine Konfigurations- oder manuelle Bestätigungsstrategie und blockieren daher die Designphase nicht. Sie blockieren jedoch die fachlich endgültige produktive Freigabe, bis sie live bestätigt oder bewusst als konfigurierbare Unsicherheit akzeptiert sind.

## 5. UI-Abdeckung

- Jede Aufgabe ist über `TASK-200` generisch darstellbar.
- Jeder P0-Fachbereich besitzt zusätzlich einen raid-spezifischen Primärscreen.
- Captain, Editor, Teilnehmer und Zuschauer besitzen getrennte Informationsdichten.
- Loading, Reconnect, Konflikt, veraltete Daten, fehlende Berechtigung und Sessionende sind im Screen-Inventar berücksichtigt.
- Die Wireframes decken Beitritt, Lobby, persönliche Mission, Rätsel, Wächter, Korridor, Licht, Ledger, Fragmente, Finalfreigabe, Undo und Zusammenfassung ab.

## 6. Prüfsummen

- `sanctuaire.v0.2.json`: `14f13b098e2c2cd6361a291e185915aa37f1ff8dcd53fe1077beb2aabe3a5bd7`
- `gigalodon.v0.2.json`: `404d98221fd9153cfc0b8c6e04b5c8efce47f98aad5196d3ba8a21ebe0d56377`

## 7. Nicht geprüft

- tatsächliches Verhalten im DOFUS-Client;
- Realtime-Latenz und 16-Client-Konvergenz;
- Datenbank- und API-Implementierung;
- visuelle Qualität oder Klickprototyp;
- Barrierefreiheit in gerendertem Code.
