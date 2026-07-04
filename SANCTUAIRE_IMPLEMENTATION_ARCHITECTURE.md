# Sanctuaire Implementation Architecture

**Projektversion:** v0.8.6.1  
**Phase:** 7 – Sanctuaire-Implementierung  
**Status:** implementiert und automatisiert geprüft  
**Stand:** 28.06.2026

## 1. Ziel und Grenze

Phase 7 ergänzt den bestehenden Plattformkern um die vollständige operative Fachlogik für `Sanctuaire des Jardins éternels`. Authentifizierung, Rollen, Realtime, Revisionen, Eventlog, Outbox, Recovery und generischer Task-Renderer wurden nicht neu gebaut.

Die kanonische Fachquelle bleibt `sanctuaire.v0.2.json`. Nicht live bestätigte Spielregeln bleiben als `LIVE_REQUIRED` sichtbar und erzeugen kein unsichtbares hartes Gate.

## 2. Implementierte Schichten

```text
sanctuaire.v0.2.json
  ├─ Task-, Dependency-, Automation- und Transfervertrag
  ├─ Resultatfelder und Bestätigungsrichtlinien
  ├─ State-Model inklusive Raid-Leben und Korridorziel
  └─ Lookup-Tabellen für abgeleitete Wächterdaten
           │
Definition Loader / Raid-State Initializer
           │
PlatformStore Domain Commands
  ├─ Resultat speichern / einreichen / bestätigen
  ├─ Raid-Leben ändern
  ├─ Korridorziel und Zuweisungen verwalten
  ├─ Korridorfortschritt atomar ändern
  └─ Automationen, Transfers und Gates anwenden
           │
PostgreSQL/PGlite Transaction
  ├─ Session-/Taskzustand
  ├─ genau eine Sessionrevision
  ├─ genau ein DomainEvent
  └─ genau ein Outbox-Eintrag
           │
SSE / Snapshot / Eventcursor
           │
Sanctuaire Command Center
  ├─ PuzzleQuartet
  ├─ RaidLifeCounter
  ├─ GuardianCards
  ├─ CorridorDispatcher
  └─ FinalBossSplit
```

## 3. Persistenter Raid-Zustand

Migration `platform/src/server/db/migrations/0002_sanctuaire.sql` ergänzt `raid_sessions.raid_state JSONB`. Der Zustand wird bei Sessionerstellung aus dem `stateModel` der unveränderlichen Raiddefinition initialisiert.

Der Sanctuaire-Zweig enthält mindestens:

- `raidLife` und `raidLifeHistory`;
- `puzzleStates` und `guardianStates`;
- `corridorTarget`;
- `corridorTargetConfirmed`;
- `corridorCompleted`;
- `corridorAssignments`;
- `princessState` und `queenState`.

Neue Migrationen werden nicht mehr einzeln fest verdrahtet. Die Datenbankschicht wendet alle sortierten Dateien nach dem Muster `NNNN_*.sql` an.

## 4. Resultat- und Bestätigungsworkflow

### Commands

| Command | Zweck |
|---|---|
| `SAVE_TASK_RESULT` | Entwurf speichern, ohne Abschluss oder Transfer |
| `SUBMIT_TASK_RESULT` | Resultat serverseitig validieren und gemäss Richtlinie abschliessen oder auf Bestätigung setzen |
| `CONFIRM_TASK_RESULT` | offene Zweit- oder Captainbestätigung ausführen |
| `TRANSITION_TASK` | generischer Statusfallback; Bestätigungsregeln bleiben serverseitig erzwungen |

### Richtlinien

- `SELF`: gültige Einreichung wird sofort bestätigt und abgeschlossen.
- `SECOND_PERSON`: Einreichung wechselt auf `WAITING`; eine andere Person muss bestätigen.
- `CAPTAIN`: Einreichung wechselt auf `WAITING`; nur der Captain darf bestätigen.
- `SYSTEM`: Abschluss erfolgt ausschliesslich durch die Regel-Engine.

Die Bestätigungsmetadaten liegen zusammen mit dem Resultat in `result_data._confirmation`. Eine Person kann ihre eigene `SECOND_PERSON`-Einreichung nicht bestätigen. Datenübertragungen laufen erst nach bestätigtem Abschluss.

## 5. Serverseitige Feldvalidierung

`platform/src/core/sanctuaire.ts` validiert Definitionseingaben vor dem Abschluss:

- Pflichtfelder;
- Typen;
- Enum-Werte;
- Minimum und Maximum;
- eindeutige Bootspositionen;
- exakt vier Einträge der Blumen-/Objektsequenz.

Die Benutzeroberfläche rendert dieselben Definitionsfelder, ist aber nicht die Sicherheits- oder Fachlogikgrenze.

## 6. Definition-getriebene Datenübertragung

`applyPostMutationRules` liest `definition.dataTransfers` und überträgt bestätigte Werte auf abhängige TaskInstances. Die UI enthält keine eigene Kopie dieser Regeln.

Implementierte Transfers:

1. Monochrome-Farbe → Clos-Finale und Sentinelle;
2. Statuentyp → Clos-Finale und Veilleur;
3. vier sichere Objekte → Gardien;
4. alle Rätsel abgeschlossen → Wächter-Gate;
5. alle Wächter abgeschlossen → Korridor-Gate;
6. Korridorziel erreicht → Finale-Gate.

Abgeleitete Wächterwerte werden aus versionierten Lookup-Tabellen berechnet:

- Monochrome-Farbe → Sentinelle-Zielelement;
- Clos-Statuentyp und Farbe → Zielmonster und Karte.

Automationen, Dependency-Freischaltungen, System-Gates und Transfers laufen in derselben Transaktion wie die auslösende bestätigte Absicht. Dadurch bleibt die Invariante `eine Absicht = eine Revision = ein Event` erhalten.

## 7. Raid-Leben

`ADJUST_RAID_LIFE` ist für Captain und Editor verfügbar und verlangt:

- ganzzahlige Änderung;
- konkrete Ursache;
- optional verknüpfte TaskInstance;
- optionalen Verweis auf den korrigierten Historieneintrag.

Der Wert wird serverseitig auf `0..20` begrenzt. Jeder Eintrag speichert:

- vorher/nachher;
- effektive Änderung;
- Ursache;
- Actor;
- Zeit;
- Taskbezug;
- Korrekturbezug.

Die Historie wird nicht still überschrieben. Eine Korrektur ist eine neue protokollierte Änderung.

## 8. Korridor

### Konfigurierbares Ziel

`SET_CORRIDOR_TARGET` ist Captain-only. Zielwerte von 1 bis 500 sind zulässig. Der bestätigte Fortschritt darf nicht durch ein nachträglich niedrigeres Ziel abgeschnitten werden.

`corridorTargetSourceStatus` trennt den verwendeten Sessionwert von seiner Quelle. Definitionsversion `0.2.1` startet mit der Guide-Baseline `10 Räume × 6 Monster = 60` und Status `GUIDE_CONFIRMED`. Die UI weist zusätzlich sichtbar darauf hin, dass noch kein eigener RAIDWEAVE-Live-Test vorliegt. Der Wert bleibt für spätere bestätigte Korrekturen konfigurierbar; 80 ist keine parallele Standardwahrheit mehr.

### Dispatcher

`SET_CORRIDOR_ASSIGNMENT` verwaltet pro Teilnehmer:

- Raum;
- Slot;
- Status `ASSIGNED`, `ACTIVE`, `COMPLETED` oder `FAILED`;
- Aktualisierungszeit.

`INCREMENT_CORRIDOR` ist nur zulässig, wenn eine Korridoraufgabe freigeschaltet und noch nicht abgeschlossen ist. Der Fortschritt wird transaktional aktualisiert. Beim Zielwert werden die relevanten Korridoraufgaben abgeschlossen und die Finalphase über die Definition freigeschaltet. Nach dem Abschluss kann das Ziel nicht mehr auf einen anderen Wert geändert werden; nur sein Evidenzstatus darf beim identischen Ziel nachgetragen werden.

## 9. Finale

Reine Écarlate und Princesse Maudite besitzen getrennte Taskketten und gleichwertige UI-Spalten. Der Erfolg eines Bosses beendet die Session nicht. Erst wenn beide Siegaufgaben abgeschlossen sind, wird das gemeinsame System-Gate abgeschlossen und die Session auf `ENDED` gesetzt.

## 10. Captain Radar

Der generische Radar wurde um Sanctuaire-Ausnahmen ergänzt:

- kritisches oder niedriges Raid-Leben;
- guidebasiertes, noch nicht RAIDWEAVE-live bestätigtes Korridorziel;
- ausstehende Resultatbestätigungen;
- bereite Wächter ohne Zuweisung;
- bereite Finalbosse ohne Zuweisung.

Diese Warnungen ergänzen die bereits vorhandenen generischen Blockaden, unbesetzten Tasks und Offlinezustände.

## 11. Produktoberfläche

`platform/components/SanctuaireCommandCenter.tsx` bildet die raid-spezifische Primäransicht:

- horizontaler Phasenpfad;
- 2×2-Rätselquartett auf Desktop und einspaltig auf Mobile;
- Raid-Leben mit Historie und Korrekturaktion;
- vier Wächterkarten mit Herkunftsmarkierung übertragener Daten;
- Korridorfortschritt, Zielstatus und Spielerzuweisungen;
- zwei getrennte Finalboss-Spalten mit gemeinsamer Abschlussbedingung.

Der generische Taskdrawer bleibt für jede der 49 TaskDefinitions verfügbar. Teilnehmer starten weiterhin in der persönlichen Mission.

## 12. Realtime- und Eventinvarianten

Alle neuen Sanctuaire-Mutationen verwenden den vorhandenen Plattformvertrag:

- serverautoritativ;
- transaktional;
- monotoner Sessioncursor;
- genau ein DomainEvent pro bestätigter Absicht;
- genau ein Outbox-Eintrag;
- Snapshot plus Events für Recovery;
- keine Fachmutation ausschliesslich im Browserzustand.

Der vollständige simulierte Ablauf endet bei Revision 178 mit genau 178 Events; alle 16 geladenen Clients konvergieren auf denselben Snapshot. Das Korridorziel ist 60.

## 13. Bewusste Grenzen

Nicht behauptet oder nicht implementiert:

- kein echter DOFUS-Live-Test;
- Korridor-Baseline 60 ist guidebasiert bestätigt, aber noch nicht durch RAIDWEAVE live bestätigt;
- keine In-Game-Automation oder Clientauslesung;
- kein abhängiges generisches Undo/Snapshot-Restore;
- kein externer PostgreSQL- oder Zwei-Instanzen-Test;
- keine vollständige Übersetzungsredaktion aller deutschsprachigen Definitionstexte;
- keine Gigalodon-Spezialmodule.

Diese Grenzen blockieren den abgeschlossenen Software-Scope der Phase 7 nicht, bleiben aber vor dem echten Pilot relevant.

## 14. Reconciliation v0.8.6.1

Der Quellenstatus folgt projektweit `OFFICIAL_CONFIRMED`, `GUIDE_CONFIRMED`, `LIVE_CONFIRMED`, `LIVE_REQUIRED` und `PLAYER_CORRECTED`. Teilnehmer können `Information incorrecte` melden; Captain oder Editor bestätigt additiv mit Notiz. Die Definition wird nicht automatisch geändert. Phase 9B ist nicht Bestandteil dieser Änderung.
