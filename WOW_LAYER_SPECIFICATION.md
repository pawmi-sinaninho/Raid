# Wow Layer Specification

**Projekt:** RAIDWEAVE – DOFUS Raid Command Center  
**Projektversion:** v0.8.5.1  
**Phase:** 9A – Wow Layer Specification  
**Status:** verbindlicher Implementierungsvertrag; technische Umsetzung gesperrt bis Phase 8.5B regressionssicher als v0.8.6 abgeschlossen ist  
**Primärsprache der Produktoberfläche:** Französisch  
**Geltung:** Sanctuaire des Jardins éternels und Gouffre du Gigalodon; Captain, Editor, Teilnehmer und Zuschauer; Desktop, Tablet und Mobile

## 1. Zweck

Der Wow Layer macht den bereits implementierten, autoritativen Raidzustand schneller erfassbar und handlungsorientierter. Er führt **keine neue Raidmechanik** ein. Er leitet aus vorhandenen Definitionen, Sessionzuständen, Teilnehmerdaten, Serverzeit und Domainevents folgende Präsentationsmodelle ab:

1. Live Raid Map;
2. Smart Next Action;
3. Risk Engine;
4. struktureller kritischer Pfad und Engpässe;
5. Replay Summary;
6. gezielte Sounds;
7. informationshaltige Animationen.

Der Wow Layer ist ein **regelbasierter Read-/Presentation-Layer**. Er darf keine bestehende Fachlogik ersetzen, verdoppeln oder stillschweigend korrigieren.

## 2. Unveränderliche Grenzen

### 2.1 Nicht verändern

Die spätere Implementierung darf nicht verändern:

- `raid-definition.schema.json`;
- `sanctuaire.v0.2.json`;
- `gigalodon.v0.2.json`;
- bestehende Task-, Session- und Raid-State-Maschinen;
- Command-Namen, Command-Payloads oder Berechtigungen;
- Event-, Revision-, Outbox-, Snapshot- und SSE-Invarianten;
- bestätigte Resultat- und Transferlogik;
- Trennung von `confirmedScore` und `projectedUnbankedScore`;
- `LIVE_REQUIRED`-Semantik;
- vorhandene Rollen und Scopes;
- vorhandene Completion-Gates;
- bestehende Task-IDs, Phasen-IDs und Definition-Versionen.

### 2.2 Zulässig

Zulässig sind:

- reine Selektoren und Projektionen aus vorhandenen Daten;
- neue Präsentationskomponenten;
- lokale, gerätebezogene Sound- und Motion-Präferenzen;
- additive, read-only Eventpagination für Replay, sofern bestehende Endpunkte unverändert bleiben;
- neue Tests, Screenshots und Analyseartefakte;
- zusätzliche französische Präsentationstexte, sofern sie keine neue Spielregel behaupten.

### 2.3 Verbotene Abkürzungen

Nicht zulässig sind:

- Status anhand sichtbarer Farbe oder Animation zu erraten;
- tatsächliche In-Game-Position aus einer Teamzuweisung zu behaupten;
- nicht bestätigte Regeln als hartes Gate darzustellen;
- fehlende Zeitdaten durch erfundene Dauerwerte zu ersetzen;
- automatische Claims, Zuweisungen, Taskübergänge, Einzahlungen oder Finalstarts;
- generative KI als Voraussetzung für eine Empfehlung;
- Personenrankings oder Schuldzuweisungen im Replay.

## 3. Vertragshierarchie

Bei Widersprüchen gilt:

1. `DECISIONS.md`;
2. versionierte JSON-Raiddefinitionen;
3. bestehende Core-/Serververträge;
4. `CURRENT_STATUS.md` und `NEXT_STEP.md`;
5. diese `WOW_LAYER_SPECIFICATION.md`;
6. Visual-Art-Direction v0.8.5;
7. ältere Design- und Wireframe-Artefakte.

Diese Spezifikation erweitert nur die Präsentation. Sie besitzt **keine höhere Autorität als Fach- oder Datenverträge**.

## 4. Architekturprinzip

### 4.1 Eingaben

Der Wow Layer erhält ausschliesslich:

```ts
interface WowLayerInput {
  snapshot: SessionSnapshot;
  actor: ActorContext | null;
  serverNowMs: number;
  locale: "fr" | "en" | "de";
  devicePreferences: {
    soundMode: "OFF" | "CRITICAL_ONLY" | "CRITICAL_AND_MISSION";
    reducedMotion: boolean;
  };
}
```

`serverNowMs` muss aus der serverautoritativen Zeitbasis beziehungsweise einer bekannten Server-Zeitabweichung abgeleitet werden. Lokale Uhrzeit darf Timer, Licht oder Risikostufen nicht eigenmächtig bestimmen.

### 4.2 Ausgaben

```ts
interface WowLayerViewModel {
  map: LiveRaidMapModel;
  nextAction: SmartNextAction | null;
  risks: RiskSignal[];
  criticalPath: CriticalPathModel;
  replay: ReplaySummaryModel | null;
  cues: InformationCue[];
  dataQuality: DataQualityState;
}
```

### 4.3 Determinismus

Für identische Inputs muss der Wow Layer identische Outputs liefern. Er darf:

- keine Zufallswerte verwenden;
- keine implizite Browserhistorie als Fachinput verwenden;
- keine versteckten Netzwerkabfragen aus Selektoren starten;
- keinen Zustand mutieren;
- keine Empfehlung ohne maschinenlesbare Begründung erzeugen.

### 4.4 Recompute-Regeln

Neu berechnen bei:

- neuer `session.revision`;
- Rollen-/Actorwechsel;
- Localewechsel;
- sekündlichem Serverzeit-Tick nur für sichtbare Timer, Licht und altersbasierte Schwellen;
- Wechsel der lokalen Sound-/Motion-Präferenz.

Graph, Route und statische Definition-Metadaten werden pro `definitionVersion` memoisiert.

## 5. Vertrauens- und Datenqualitätsmodell

Jede abgeleitete Aussage besitzt einen Vertrauensstatus:

| Status | Bedeutung | Darstellung |
|---|---|---|
| `CONFIRMED` | direkt aus bestätigtem Serverzustand oder Domainevent | normaler Text/Status |
| `DERIVED` | deterministisch aus bestätigten Daten berechnet | Label `Calculé` bei erklärungsbedürftigen Aussagen |
| `LIVE_REQUIRED` | zugrunde liegende Spielregel ist unbestätigt | Stempel `NON CONFIRMÉ EN JEU` |
| `STALE` | Eingabedaten sind älter als definierte Aktualitätsschwelle | Alter und betroffene Aussage sichtbar |
| `PARTIAL` | Event- oder Replayabdeckung ist nicht vollständig | keine vollständigen Kennzahlen behaupten |

### Datenqualitätsrang

`CONFIRMED > DERIVED > LIVE_REQUIRED > STALE > PARTIAL` beschreibt keine Risikostufe, sondern die Belastbarkeit der Aussage.

## 6. Gemeinsames Graphmodell

### 6.1 Quellen

- Knoten: `definition.tasks` plus sichtbare Phasen-/System-Gates;
- Kanten: `definition.dependencies`;
- Übertragungskanten: `definition.dataTransfers`;
- Laufzeitstatus: `snapshot.tasks`;
- Zuständigkeit: Owner, Teilnehmer- und Teamzuweisung;
- Raid-Spezialdaten: `session.raidState` über bestehende Core-Helper;
- Risiken: Definition-Warnings plus produktseitige Koordinationsregeln dieser Spezifikation.

### 6.2 Knotentypen

```ts
type MapNodeKind =
  | "PREPARATION"
  | "TASK"
  | "SYSTEM_GATE"
  | "PUZZLE_BRANCH"
  | "GUARDIAN_BRANCH"
  | "CORRIDOR"
  | "FLOOR"
  | "BOSS"
  | "RETURN"
  | "FINAL";
```

### 6.3 Sichtbarer Knotenstatus

Der sichtbare Status stammt immer aus der bestehenden Taskstatusmaschine. Phasenaggregate verwenden folgende Reihenfolge:

1. `BLOCKED`, wenn mindestens ein verpflichtender aktiver/erreichbarer Kindknoten blockiert ist;
2. `FAILED`, wenn ein verpflichtender Kindknoten fehlgeschlagen und noch nicht für Retry freigegeben ist;
3. `ACTIVE`, wenn mindestens ein Kindknoten aktiv ist;
4. `WAITING`, wenn kein aktiver, aber mindestens ein wartender Kindknoten existiert;
5. `CLAIMED`, wenn mindestens ein verpflichtender Kindknoten beansprucht ist;
6. `READY`, wenn mindestens ein verpflichtender Kindknoten bereit ist;
7. `COMPLETED`, wenn alle verpflichtenden Kindknoten abgeschlossen oder übersprungen sind;
8. sonst `LOCKED`.

`SKIPPED` optionaler Tasks darf einen verpflichtenden Phasenabschluss nicht fälschlich blockieren.

### 6.4 Keine geografische Täuschung

Die Live Raid Map zeigt **Workflow- und gemeldete Expeditionspositionen**, keine automatisch erfasste Spielkarte.

Verbindliche Beschriftungen:

- Team an Task: `Équipe affectée`;
- Gigalodon-Inventaretage: `Position signalée`;
- veraltete Etage: `Position signalée il y a X min`;
- keine Daten: `Position non confirmée`.

## 7. Live Raid Map – gemeinsamer Komponentenvertrag

### 7.1 Ziel

Die Map beantwortet innerhalb von drei Sekunden:

1. Wo steht der Raid im Ablauf?
2. Welche parallelen Wege laufen?
3. Was hält den nächsten Gate auf?
4. Wer trägt die relevante Verantwortung?
5. Welche Übergabe oder Bestätigung fehlt?

### 7.2 Anatomie

- `RouteFrame`: räumlicher Grundpfad;
- `RouteNode`: Task, Phase oder Gate;
- `TransferThread`: bestätigte Datenübertragung;
- `CriticalThread`: strukturell aktuell wichtigster unvollständiger Pfad;
- `TeamMarker`: zugewiesenes Team/Person;
- `BottleneckClamp`: sichtbarer Engpassmarker;
- `SourceStamp`: `LIVE_REQUIRED`, stale oder partial;
- `DecisionNote`: handlungsrelevante Ausnahme;
- `MapLegend`: Status, Vertrauen und gemeldete Position.

### 7.3 Interaktionen

- Knoten öffnen den bestehenden Taskdrawer oder das raid-spezifische Detailmodul;
- keine Statusmutation direkt durch Ziehen auf der Map;
- Drag-and-drop darf nur progressive Verbesserung sein und benötigt immer ein zugängliches Menüäquivalent;
- `Enter`/`Space` öffnet einen fokussierten Knoten;
- Pfeiltasten navigieren innerhalb einer Route logisch, nicht rein nach DOM-Zufall;
- Escape schliesst Detail und setzt Fokus auf den Ursprungsknoten zurück;
- Zuschauer erhalten keine mutierenden Aktionen.

### 7.4 Map-Dichte

- maximal ein dominanter kritischer Thread;
- bei echter Gleichwertigkeit höchstens ein zweiter paralleler kritischer Thread;
- höchstens drei gleichzeitig sichtbare Decision Notes;
- abgeschlossene Nebenaufgaben bleiben reduziert, aber fokussierbar;
- optionale P2-Aufgaben erscheinen nicht im dominanten Pfad, solange sie kein aktives Risiko tragen.

## 8. Sanctuaire Live Raid Map

### 8.1 Raumlogik

Die Map ist ein horizontaler Garten-/Schlossweg:

```text
Préparation
   ├─ Réserve de Belladone ─────┐
   ├─ Cour d’Éphèdre ──────────┤
   ├─ Ouvrage Monochrome ──────┤── Gate énigmes
   └─ Clos des Protecteurs ────┘
          ↓ transferts confirmés
   4 gardiens parallèles
          ↓ Gate gardiens
   Corridor
          ↓
   Reine Écarlate ║ Princesse Maudite
          ↓ double confirmation
   Fin du raid
```

### 8.2 Verbindliche Gruppierung

| Kartenbereich | Definitionen |
|---|---|
| Vorbereitung | `S0-*` |
| Puzzle Belladone | `S1-BEL-*` |
| Puzzle Éphèdre | `S1-EPH-*` |
| Puzzle Monochrome | `S1-OUV-*` |
| Puzzle Clos | `S1-CLO-*` |
| Puzzle-Gate | `S1-ALL-900` |
| Wächter Veilleur | `S2-VEI-*` |
| Wächter Gardien | `S2-GAR-*` |
| Wächter Défenseur | `S2-DEF-*` |
| Wächter Sentinelle | `S2-SEN-*` |
| Wächter-Gate | `S2-ALL-900` |
| Korridor | `S3-COR-*` plus `sanctuaire.corridor*` |
| Reine | `S4-QUE-*` |
| Princesse | `S4-PRI-*` |
| Raidabschluss | `S4-ALL-900` |
| optional | `S-OPT-*`, nur sekundär |

### 8.3 Resultattransfers

Die vorhandenen `dataTransfers` werden als gerichtete Fäden gezeigt:

- Monochromfarbe → Clos-Kombination und Sentinelle;
- Statue → Clos-Kombination und Veilleur;
- Blumenfolge → Gardien;
- Puzzle-Gate, Wächter-Gate und Korridor-Gate als Systemübergaben.

Regeln:

- Transferfaden erscheint erst nach bestätigtem Resultat;
- bei `PENDING` endet der Faden an einem Bestätigungsstempel;
- bei fehlendem Wert wird keine leere Verbindung als erledigt dargestellt;
- Quelle und Ziel sind über Fokus/Tooltip gegenseitig referenzierbar;
- Animation nur einmal beim Übergang `nicht vorhanden → bestätigt`.

### 8.4 Raid-Leben

- eigenständiges Siegel neben dem aktiven Kartenabschnitt;
- Wert und Maximum sichtbar;
- letzte Ursache als kurze Zeile;
- Verlust/Gewinn erscheint als einmaliger Delta-Impuls;
- <=10 `HIGH`, <=5 `CRITICAL` gemäss bestehender Radarlogik;
- keine 20 dekorativen Herzen.

### 8.5 Korridor

- breites `CorridorRibbon` statt Standardcard;
- zeigt `corridorCompleted / corridorTarget`;
- Ziel trägt `NON CONFIRMÉ EN JEU`, solange `corridorTargetConfirmed=false`;
- Spielerzuweisungen erscheinen als Slots mit Status;
- fehlgeschlagene Slots werden als Retry markiert, nicht als endgültig verloren;
- der kritische Thread darf den Korridor erst nach erfülltem Wächter-Gate betreten.

### 8.6 Finale

- Reine und Princesse bleiben gleichwertige parallele Zielmarken;
- ein abgeschlossener Boss darf den anderen nicht visuell verdrängen;
- gemeinsames Abschlussband zeigt: `Les deux victoires sont requises`;
- kein Endscreen, bevor `S4-ALL-900` bestätigt abgeschlossen ist.

## 9. Gigalodon Live Raid Map

### 9.1 Raumlogik

Die Map ist eine permanente vertikale Tiefenroute mit sichtbarem Rückweg:

```text
Préparation
  ↓
Étage -1
  ↓ Mureine
Étage -3 / Luminarium
  ↓ Exécrabe
Étage -5 / Fragments
  ↓ Willorque
Retour et sécurisation ↺ dépôt
  ↓ contrôle final
Gigalodon
```

Die kontinuierlichen Prozesse `G-PAR-LIGHT` und `G-PAR-LEDGER` liegen als Instrumente **an** der Route, nicht als getrennte Dashboardsektion.

### 9.2 Verbindliche Gruppierung

| Kartenbereich | Definitionen/Zustand |
|---|---|
| Lichtinstrument | `G-LIGHT-*`, `gigalodon.lightStates` |
| Frachtmanifest | `G-LEDGER-*`, Inventare, Deposits, Losses |
| Vorbereitung | `G0-*` |
| Etage -1 | `G1-*`, `floor1GroupTarget` |
| Mureine | `G2-*`, Unique Mureine |
| Luminarium | `G3-*` |
| Exécrabe | `G4-*`, Pince, Unique Exécrabe |
| Etage -5/Fragmente | `G5-*`, `fragments` |
| Willorque | `G6-*`, Unique Willorque |
| Rückweg/Sicherung | `GF-*`, Finalreadiness |
| Finale | `GG-*`, `gigalodon.final` |

### 9.3 Licht

Jede sichtbare Lichtanzeige ist einer Etage zugeordnet und zeigt:

- gemeldetes Level;
- effektiv abgeleitetes Level;
- nächsten erwarteten Verfall;
- verantwortliche Person;
- Aktualität;
- Evidenz für Intervall und Salzkosten.

Pflichttext:

`Lumière −3 à 2 · prochain déclin estimé dans 02:01`

Wenn Intervall oder Salzkosten unbestätigt sind:

`Estimation basée sur une règle non confirmée en jeu`

Ein erwarteter Verfall ändert die Darstellung, aber **persistiert keinen neuen beobachteten Lichtwert**.

### 9.4 Fracht und gemeldete Position

- Inventare erscheinen als Transportmarker an `currentFloor`;
- Unique-Fracht steht vor normalem Score;
- `projectedUnbankedScore` wird als getragen, nie als bestätigt bezeichnet;
- `confirmedScore` bleibt separate gesicherte Zahl;
- ab fünf Minuten ohne Bestätigung trägt der Marker `À confirmer`;
- unbekannte Etage liegt in einer separaten Zone `Position non confirmée`;
- Einzahlungen animieren zur Sicherungszone, nicht zum Scoresymbol allein.

### 9.5 Rückweg und Finalfreigabe

- Rückweg ist ein sichtbarer eigener Routenabschnitt;
- `FinalClearance` gruppiert `bloqué`, `non confirmé`, `prêt`;
- aktive Kämpfe sind nur dann rotes Gate, wenn die bestehende Evidenz dies bestätigt;
- unbestätigte aktive Kämpfe erscheinen orange mit `Blocage possible`;
- Finalstart bleibt ein expliziter bestehender Command und wird nie automatisch ausgelöst.

## 10. Smart Next Action

### 10.1 Ziel

Smart Next Action gibt genau **eine** primäre Empfehlung und optional eine Folgeaktion. Jede Empfehlung enthält:

```ts
interface SmartNextAction {
  id: string;
  audience: "PARTICIPANT" | "CAPTAIN" | "EDITOR";
  actionKind: SmartActionKind;
  targetTaskId?: string;
  title: string;
  reason: string;
  consequence: string | null;
  confidence: "CONFIRMED" | "DERIVED" | "LIVE_REQUIRED" | "STALE";
  riskLevel: "NORMAL" | "ATTENTION" | "HIGH" | "CRITICAL";
  existingCommandPath: string | null;
  score: number;
}
```

`existingCommandPath` verweist nur auf vorhandene UI-/Commandabläufe. Die Empfehlung selbst sendet keinen Command.

### 10.2 Kandidaten für Teilnehmer

In dieser Reihenfolge erzeugen:

1. eigene blockierte aktive Aufgabe → Blockade klären oder melden;
2. eigene aktive Aufgabe → fortsetzen/Resultat liefern;
3. ausstehende Bestätigung, für die die Person berechtigt ist;
4. eigene beanspruchte Aufgabe → starten;
5. persönliche raid-spezifische Pflicht:
   - Unique-Fracht sichern;
   - eigenes veraltetes Gigalodon-Inventar bestätigen;
   - als Lichtverantwortlicher reagieren;
6. zugewiesene bereite Aufgabe → übernehmen/starten;
7. unbesetzte bereite Aufgabe, die gemäss bestehender Assignmentregel übernommen werden darf;
8. bewusster Wartezustand mit konkretem Auslöser.

### 10.3 Kandidaten für Captain/Editor

1. neue kritische Blockade auf strukturellem Pfad;
2. Unique-Fracht oder Lichtlevel 0;
3. ausstehende erforderliche Bestätigung;
4. kritische Aufgabe ohne Team/Owner;
5. offline/veraltete verantwortliche Person auf kritischem Pfad;
6. Finalfreigabe mit genau benanntem fehlendem Check;
7. bereit gewordener Gate-/Bossabschnitt;
8. gruppierte Attention-Entscheidung.

### 10.4 Scoring

Basispunkte:

| Kandidat | Punkte |
|---|---:|
| eigene blockierte Aufgabe / kritische Captainentscheidung | 120 |
| eigene aktive Aufgabe | 115 |
| erforderliche Bestätigung | 110 |
| eigene beanspruchte Aufgabe | 100 |
| persönliche Unique-/Lichtpflicht | 95 |
| zugewiesene bereite Aufgabe | 85 |
| unbesetzte bereite Aufgabe | 60 |
| Wartehinweis | 20 |

Modifier:

- +30 auf strukturellem kritischen Pfad;
- +25 bei `CRITICAL`, +15 bei `HIGH`, +8 bei `ATTENTION`;
- +15 direkter Owner, +10 Teamzuweisung, +5 explizite Teilnehmerzuweisung;
- +3 je voller Warteminute, maximal +15;
- -40, wenn eine veraltete Eingabe zuerst bestätigt werden muss;
- Ausschluss, wenn Rolle/Scope die angezeigte Aktion nicht ausführen darf.

Tie-Breaker:

1. höhere Risikostufe;
2. mehr unvollständige verpflichtende Nachfolger;
3. längeres gemeldetes Warten;
4. kleinere Definition-Order;
5. lexikografische Task-ID.

### 10.5 Erklärbarkeit

Jede Empfehlung zeigt einen kurzen Grund:

- `Parce que cette étape retient 7 étapes obligatoires.`
- `Parce que vous portez une ressource unique non déposée.`
- `Parce qu’une seconde confirmation manque.`
- `Parce que l’équipe affectée est hors ligne.`

Keine Empfehlung darf nur `Système recommandé` anzeigen.

### 10.6 Wartezustand

Wenn keine ausführbare Aktion existiert:

- Titel: `Attendre la prochaine ouverture`;
- Grund nennt maximal zwei konkrete Blocker;
- Folgeauslöser: `La mission changera quand …`;
- kein künstlicher Button.

## 11. Risk Engine

### 11.1 Zweck

Die Risk Engine priorisiert beobachtete oder deterministisch abgeleitete Abweichungen. Sie prognostiziert keine garantierte Niederlage.

### 11.2 Modell

```ts
interface RiskSignal {
  id: string;
  level: "NORMAL" | "ATTENTION" | "HIGH" | "CRITICAL";
  category: RiskCategory;
  title: string;
  impact: string;
  recommendedAction: string | null;
  affectedTaskIds: string[];
  affectedParticipantIds: string[];
  confidence: "CONFIRMED" | "DERIVED" | "LIVE_REQUIRED" | "STALE";
  enteredAtRevision: number | null;
  ageSeconds: number | null;
  soundEligible: boolean;
}
```

### 11.3 Gemeinsame Regeln

| Bedingung | Stufe |
|---|---|
| Task `BLOCKED` auf kritischem Pfad | `CRITICAL` |
| Task `BLOCKED` ausserhalb kritischem Pfad | `HIGH` |
| verpflichtende kritische Task `READY/ACTIVE` ohne Zuständigkeit | `HIGH` |
| andere bereite Task ohne Zuständigkeit | `ATTENTION` |
| `WAITING` > 120 s | `ATTENTION` |
| `WAITING` > 300 s auf kritischem Pfad | `HIGH` |
| verantwortliche Person >120 s offline/stale | `HIGH` auf kritischem Pfad, sonst `ATTENTION` |
| verantwortliche Person >300 s offline auf kritischem Pfad | `CRITICAL` |
| Reconnect/Offline des gesamten Clients | Datenqualitätszustand, keine neue Raidbehauptung |
| unvollständige Eventhistorie | `PARTIAL`, keine Raidrisikostufe |

Die Zeitgrenzen sind **Koordinationsschwellen**, keine DOFUS-Spielregeln.

### 11.4 Sanctuaire-Regeln

Bestehende Regeln bleiben verbindlich:

- Raid-Leben <=10: `HIGH`;
- Raid-Leben <=5: `CRITICAL`;
- Korridorziel unbestätigt: `ATTENTION` + `LIVE_REQUIRED`;
- ausstehende Zweit-/Captain-Bestätigung, die einen Pfad hält: `HIGH`;
- bereiter Wächter oder Finalboss ohne Team: `HIGH`;
- gescheiterter Korridorslot: `HIGH`, wenn keine freie Ersatzperson vorhanden ist; sonst `ATTENTION`.

### 11.5 Gigalodon-Regeln

Bestehende Regeln bleiben verbindlich:

- Licht 0: `CRITICAL`;
- Licht 1: `HIGH`;
- Licht 2: `ATTENTION`;
- Licht-/Salzregel unbestätigt: `ATTENTION` + `LIVE_REQUIRED`;
- Unique nicht eingezahlt: `CRITICAL`;
- >=5'000 projizierte ungesicherte Punkte: `HIGH`;
- Inventar >300 s unbestätigt: `HIGH`;
- Pincen-Träger nach Exécrabe unbekannt: `CRITICAL`;
- aktive Kämpfe am Finalstart: `CRITICAL`, wenn bestätigt; sonst `HIGH` + `LIVE_REQUIRED`;
- weniger als 180 s und Gigalodon nicht gestartet: gemäss bestehender Definition `CRITICAL`.

### 11.6 Deduplizierung

- gleiche Ursache + gleiche betroffene Entität = ein Signal;
- höheres Level ersetzt niedrigeres;
- mehrere veraltete Inventare dürfen zu einer Gruppennotiz zusammengefasst werden, betroffene Personen bleiben aufklappbar;
- ein Task darf maximal ein primäres Blockadesignal und ein getrenntes Datenqualitätssignal tragen.

### 11.7 Lebenszyklus

Risiken werden nicht separat persistiert. `enteredAtRevision` wird clientseitig aus dem ersten Revisionseintritt rekonstruiert, solange die Eventabdeckung vollständig ist. Fehlt sie, bleibt das Feld `null`.

Kein gemeinsames `Acknowledged`-Flag in Phase 9A, da dies neue persistente Fachmutation erfordern würde.

## 12. Struktureller kritischer Pfad

### 12.1 Begriff

RAIDWEAVE verwendet bis zu belastbaren Dauerwerten ausschliesslich einen **strukturellen kritischen Pfad**:

> Die aktuell wichtigste Kette verpflichtender, noch unvollständiger Abhängigkeiten bis zu einem Abschluss-Gate.

Nicht behaupten:

- exakte Restdauer;
- mathematisch zeitkritischster CPM-Pfad;
- Gewinn-/Verlustwahrscheinlichkeit.

Pflichtlabel: `Chemin critique structurel`.

### 12.2 Algorithmus

1. optionale Tasks aus der Hauptberechnung entfernen;
2. gerichteten Graph aus Dependencies bauen;
3. verpflichtende Terminalknoten bestimmen: verpflichtende Knoten ohne verpflichtende ausgehende Kante beziehungsweise bekannte Sessionabschluss-Gates;
4. abgeschlossene/übersprungene Knoten aus dem Restgraph entfernen, ihre Kanten logisch überbrücken;
5. für jeden unvollständigen Knoten `remainingMandatoryDescendants` berechnen;
6. Druckwert berechnen:
   - Risikorang `CRITICAL=400`, `HIGH=300`, `ATTENTION=200`, normal `100`;
   - + `remainingMandatoryDescendants * 10`;
   - + Wartealter in Minuten, maximal 15;
   - +20 bei fehlender Zuständigkeit;
   - +20 bei ausstehender Pflichtbestätigung;
7. höchsten Druckpfad bis zum Terminal wählen;
8. bei exakt gleichwertigen parallelen Ästen höchstens zwei Pfade zeigen;
9. System-Gates als Gate, nicht als menschliche Aufgabe darstellen.

### 12.3 Engpasstypen

```ts
type BottleneckKind =
  | "BLOCKED_TASK"
  | "PENDING_CONFIRMATION"
  | "UNASSIGNED"
  | "OFFLINE_OWNER"
  | "STALE_INPUT"
  | "LIGHT_RISK"
  | "RESOURCE_AT_RISK"
  | "FINAL_GATE"
  | "PARALLEL_BRANCH_LAG";
```

### 12.4 Engpassdarstellung

Ein `BottleneckClamp` zeigt:

- Ursache;
- betroffenen Knoten;
- Anzahl unvollständiger verpflichtender Nachfolger;
- Alter, wenn belastbar;
- konkrete bestehende Aktion;
- Vertrauensstatus.

Beispiel:

`Confirmation manquante · retient 6 étapes · depuis 03:14`

### 12.5 Parallelität

Die Map darf parallele Äste nicht fälschlich seriell darstellen. Ein langsamer Ast wird nur als `PARALLEL_BRANCH_LAG` markiert, wenn:

- ein gemeinsames Gate alle Äste verlangt;
- mindestens ein Schwesterast abgeschlossen ist;
- der markierte Ast noch mindestens zwei verpflichtende unvollständige Knoten besitzt oder ein `HIGH/CRITICAL`-Risiko trägt.

## 13. Replay Summary

### 13.1 Ziel

Nach `ENDED` oder `FAILED` zeigt Replay Summary den Raid als nachvollziehbaren Ablauf, nicht als Roh-Eventlog.

### 13.2 Vollständigkeitsprüfung

Eventhistorie gilt als vollständig, wenn:

- erste vorhandene Revision = 1;
- letzte vorhandene Revision = `session.revision`;
- jede Revision lückenlos genau einmal vorhanden ist.

Bei `session.revision > 200` reicht der bestehende Snapshot allein möglicherweise nicht. Die spätere Implementierung darf deshalb einen **additiven read-only Replay-Endpunkt** ergänzen:

`GET /api/sessions/[sessionId]/replay-events?afterRevision=<n>&limit=<1..500>`

Regeln:

- bestehende Snapshot-/Events-Endpunkte bleiben unverändert;
- Rückgabe verwendet unveränderte `EventRecord`-Form;
- gleiche Authentisierung und Leserechte wie Snapshot;
- keine neue Tabelle und keine Mutation;
- Cursor monoton nach `sessionRevision`;
- bei fehlender Vollständigkeit zeigt die UI `Résumé partiel`.

### 13.3 Kapitel

- Vorbereitung;
- raid-spezifische Hauptphasen;
- Korridor beziehungsweise Rückweg;
- Finale;
- Abschluss.

Kapitelgrenzen werden aus erstem/letztem relevanten Event der enthaltenen Tasks abgeleitet.

### 13.4 Kennzahlen

Nur bei vollständiger oder explizit ausreichend markierter Datenbasis:

- Gesamtdauer;
- Dauer je Phase;
- gemeldete `WAITING`-/`BLOCKED`-Zeit je Engpass;
- Anzahl Pflichtbestätigungen und deren Wartezeit;
- Zeitpunkt der Gate-Öffnungen;
- Raid-Leben-Verlauf im Sanctuaire;
- Peak des getragenen Scores und gesicherte Einzahlungen im Gigalodon;
- Lichtkritische Momente;
- Finalstart und Abschluss;
- Anzahl Reconnect-/Offline-Ereignisse nur, wenn historisch tatsächlich vorhanden.

Nicht verwenden:

- `temps perdu` ohne Qualifizierung;
- individuelle Leistungsnoten;
- Schaden-/Geschwindigkeitsrankings, die nicht autoritativ erfasst werden;
- Kausalbehauptung aus zeitlicher Nähe allein.

Pflichtformulierung: `Temps signalé en attente`, nicht `temps gaspillé`.

### 13.5 Highlight-Regeln

Ein Moment wird Highlight, wenn mindestens eine Bedingung erfüllt ist:

- Risiko steigt erstmals auf `CRITICAL`;
- struktureller Gate öffnet;
- bestätigter Resultattransfer erfolgt;
- Raid-Leben ändert sich;
- Unique wird aufgenommen, gefährdet oder eingezahlt;
- hoher Score wird gesichert;
- Finalfreigabe wird erreicht;
- Finalkampf startet;
- Session endet.

Maximal zwölf Highlights; weitere bleiben in der vollständigen Chronik.

### 13.6 Visuelle Form

- `ReplayThread` folgt derselben Route wie die Live Map;
- Ereignisse erscheinen als Stiche/Knoten, nicht als generische Activity-Cards;
- Engpässe als Klammern über Zeitspannen;
- Sanctuaire: Gartenroute mit Lebensmarken;
- Gigalodon: Tiefen-/Rückwegroute mit Einzahlungsmarken;
- druckbare Zusammenfassung erlaubt, aber kein öffentlicher Share-Link in Phase 9A.

## 14. Sounds

### 14.1 Grundsatz

Sound ist optional, gerätebezogen und standardmässig aus. Aktivierung benötigt eine bewusste Nutzergeste.

Modi:

- `OFF`;
- `CRITICAL_ONLY`;
- `CRITICAL_AND_MISSION`.

Speicherung nur lokal, zum Beispiel `localStorage`; kein Session- oder Teilnehmerfeld.

### 14.2 Erlaubte Soundereignisse

| Cue | Zielgruppe | Bedingung |
|---|---|---|
| `critical-rise` | Captain/Editor + direkt betroffene Person | neues Risiko steigt auf `CRITICAL` |
| `mission-changed` | betroffener Teilnehmer | Smart Next Action wechselt auf neue konkrete Aufgabe |
| `confirmation-requested` | berechtigte Bestätigungsperson | neue Pflichtbestätigung wird erreichbar |
| `final-clearance-ready` | Captain | Finalreadiness wechselt vollständig auf bereit |

### 14.3 Kein Sound für

- normale Taskabschlüsse;
- jeden Scorezuwachs;
- jeden Lichttick;
- Realtime-Heartbeat;
- Hover, Navigation oder Mapöffnung;
- wiederholtes Rendern desselben Risikos.

### 14.4 Dedupe und Cooldown

- Schlüssel: `sessionId + cueType + targetId + enteredAtRevision`;
- gleicher Cue maximal einmal;
- globale Mindestpause 3 Sekunden;
- Risiko ertönt erneut erst nach vollständiger Auflösung und neuem Eintritt;
- bei stale/partial Daten kein kritischer Ton aus unsicherer Ableitung.

### 14.5 Akustische Gestaltung

- eigene, kurze Töne oder Web-Audio-Synthese;
- 120–450 ms;
- keine DOFUS-Sounds, keine fremden Assets;
- keine Sprachansagen in V1;
- kritischer Cue deutlich, aber nicht schreckhaft;
- visuelle und textliche Alternative immer vorhanden.

## 15. Informationshaltige Animationen

### 15.1 Erlaubte Motion

| Übergang | Dauer | Aussage |
|---|---:|---|
| Route/Gate öffnet | 300 ms | neue Abhängigkeit erfüllt |
| bestätigter Transferfaden | 260 ms | Daten wurden übertragen |
| Mission wechselt | 140 ms | neue persönliche Priorität |
| Einzahlungsmarker bewegt sich | 220 ms | Fracht wurde bestätigt gesichert |
| Risiko erscheint | 140 ms + einmaliger 180-ms-Kantenimpuls | neue Entscheidung nötig |
| Raid-Leben Delta | 180 ms | bestätigte Veränderung |
| Lichtsegment fällt | 140 ms | abgeleiteter/aktualisierter Levelwechsel |

### 15.2 Verbote

- kein dauerhaftes Pulsieren;
- kein Bouncing;
- keine Partikel über Nutzdaten;
- kein animiertes Glühen ausser einmaliger aktiver Route und Lumeninstrument;
- keine Positionsanimation, die Fokus oder Leseposition verschiebt;
- keine Animation als einziges Signal.

`design-tokens.v0.8.5.json` mit `criticalPulseCount: 0` bleibt verbindlich.

### 15.3 Reduced Motion

Bei `prefers-reduced-motion`:

- sofortige Zustandsänderung;
- Transfer erscheint direkt mit Quellen-/Zielmarker;
- keine Wegbewegung;
- kein Kantenimpuls;
- Timer und Lichtwerte aktualisieren ohne Ziffernanimation.

## 16. Zusammenspiel mit Visual Art Direction v0.8.5

### 16.1 Materialzuordnung

| Wow-Element | Material |
|---|---|
| Live Route | `route` |
| aktive Arbeitsstelle | `sheet` oder `plate` |
| Risiko/Engpass | `note` |
| kritischer Pfad | schmaler `strap`/Thread |
| Quellenstatus | `stamp` |
| Replaykapitel | `manifest`/Thread |
| Smart Next Action Mobile | `MissionOrder` + `NextOrderSlip` |

### 16.2 Authentizitätsregeln

- Map darf nicht als Node-Graph-Bibliothek im Standardlook erscheinen;
- Risiken sind angeheftete Entscheidungen, keine KPI-Kacheln;
- kritischer Pfad ist eine Route, kein Fortschrittsbalken mit Prozentfantasie;
- Replay ist ein Einsatzfaden, keine Analytics-Dashboardseite;
- Sanctuaire und Gigalodon teilen Semantik, aber nicht Raumkomposition;
- maximal drei direkt benachbarte identische Cards bleibt verbindlich.

### 16.3 Akzentgrenzen

- höchstens zwei Raid-Akzente plus eine semantische Warnfarbe pro Arbeitsbereich;
- CriticalThread verwendet Raid-Akzent, Engpass selbst semantische Risikofarbe;
- `LIVE_REQUIRED` verwendet Quellenstempel, nicht roten Gefahrencode.

## 17. Responsive Verhalten

### 17.1 Desktop 1440 × 900

Captain:

- Header 54 px;
- Hauptfläche: Route/Workbench flexibel;
- rechte Decision-Note-Spalte 286 px;
- Smart Next Action oberhalb der Radar-Notizen;
- Activity Strip bleibt sekundär;
- Taskdetail ersetzt Radarfläche temporär;
- vollständiger kritischer Thread sichtbar.

Teilnehmer auf Desktop/Zweitmonitor:

- MissionOrder links dominant;
- kompakte Map rechts mit eigener Position und nächstem Gate;
- keine vollständige Captain-Risikologik.

### 17.2 Tablet 768 × 1024

- Route oben, Entscheidungen darunter;
- Sanctuaire-Puzzleäste in zwei Reihen, ohne horizontales Kernscrolling;
- Gigalodon bleibt vertikal;
- Taskdetail als Bottom Sheet;
- Captain sieht maximal drei Risiken vor `Tout voir`;
- Touchziele mindestens 44 × 44 px;
- Landscape darf Route und Details zweispaltig zeigen.

### 17.3 Mobile 390 × 844 – Teilnehmer

Erste 620 px enthalten:

1. Timer/Verbindung;
2. gemeldeten Ort;
3. Smart Next Action;
4. Primäraktion;
5. persönliches kritisches Risiko, falls vorhanden.

Die Map zeigt nur:

- vorherigen abgeschlossenen Knoten;
- aktuellen Knoten;
- nächsten Gate/Task;
- persönliche Transfer-/Frachthinweise.

Vollständige Raidkarte ist im Ziel `Raid` vertikal erreichbar. Keine Miniatur, die nur dekorativ ist.

### 17.4 Mobile – Captain-Notbetrieb

- Smart Captain Action zuerst;
- Top-3-Risiken;
- vereinfachte vertikale Route;
- kein Drag-and-drop;
- kritische Zuweisung über zugängliche Auswahl;
- keine Funktion wird allein wegen kleiner Breite entfernt, aber progressive Offenlegung ist erlaubt.

### 17.5 Wide 1920 × 1080

- Route darf mehr Kontext zeigen, aber keine zusätzliche Semantik erfinden;
- Stream-/Zuschauermodus kann Namen minimieren;
- Decision Notes bleiben auf fünf sichtbare begrenzt.

## 18. Zustände

### 18.1 Loading

- Skeleton folgt realer Routengeometrie;
- keine zufälligen Card-Skelette;
- bestätigte letzte Daten bleiben sichtbar, wenn nur Teilbereich neu lädt.

Microcopy: `Chargement de l’état confirmé…`

### 18.2 Reconnecting

- globale gelbe Leiste;
- Wow-Ableitungen bleiben sichtbar, tragen aber `Synchronisation en cours`;
- keine Soundcues;
- keine neue Risikoeskalation allein durch lokalen Zeitablauf, bis Serverbezug wieder belastbar ist.

### 18.3 Offline

- rote Verbindungsleiste;
- letzte Revision und Alter sichtbar;
- Empfehlungen, die einen Schreibvorgang benötigen, bleiben lesbar, aber Aktion ist deaktiviert mit Grund;
- keine Behauptung `enregistré`.

### 18.4 Empty/No action

- Lobby: keine Live Map, sondern Formation/DepartureGate;
- Live ohne persönliche Aufgabe: konkrete Blocker oder `En attente d’une affectation`;
- Radar leer: `Rien ne bloque la prochaine étape` plus Synczeit.

### 18.5 Partial replay

- Banner `Résumé partiel`;
- verfügbare Chronik bleibt nutzbar;
- Kennzahlen mit unvollständiger Grundlage werden verborgen oder ausdrücklich als Minimum markiert;
- keine Zeitverlustsumme.

### 18.6 Stale input

- Wert bleibt sichtbar;
- Alter und Quelle stehen direkt daneben;
- Smart Next Action priorisiert bei betroffener Person zuerst die Bestätigung;
- stale ist nicht automatisch falsch.

### 18.7 Permission denied

- Grund nennt Rolle/Scope verständlich;
- keine versteckte Aktion;
- Taskdetail bleibt read-only erreichbar, wenn Leserecht besteht.

### 18.8 Ended/Failed

- Live-Sounds stoppen;
- Smart Next Action wird durch Abschlussaktion ersetzt: Replay öffnen, Session duplizieren oder archivieren, soweit bestehend;
- Map friert auf letzter bestätigter Revision ein.

## 19. Verbindliche Microcopy

### 19.1 Navigation und Überschriften

| Zweck | Französisch |
|---|---|
| Live Map | `Carte vivante du raid` |
| kritischer Pfad | `Chemin critique structurel` |
| Engpässe | `Ce qui retient la suite` |
| Captain-Ausnahmen | `Ce qui demande une décision` |
| Smart Next Action | `À faire maintenant` |
| Folgeaktion | `Ensuite` |
| Replay | `Le fil du raid` |
| Datenqualität | `Fiabilité des informations` |

### 19.2 Map und Zuständigkeit

- `Aucune équipe ne porte cette étape.`
- `Équipe affectée · position non suivie automatiquement.`
- `Position signalée il y a 4 min.`
- `Cette étape retient 7 étapes obligatoires.`
- `Ouverture après confirmation de …`
- `Résultat transmis depuis …`
- `Donnée reçue, confirmation encore requise.`

### 19.3 Risk Engine

- `Rien ne bloque la prochaine étape.`
- `Une décision est requise maintenant.`
- `Risque élevé sur le chemin critique.`
- `Règle non confirmée en jeu.`
- `Information trop ancienne pour une décision sûre.`
- `Blocage possible, pas encore confirmé en jeu.`

### 19.4 Smart Next Action

- `Confirmer votre inventaire avant de poursuivre.`
- `Déposer la ressource unique.`
- `Reprendre la mission en attente.`
- `Confirmer le résultat transmis.`
- `Affecter une équipe à cette étape.`
- `Donner le signal de départ.`
- `Attendre l’ouverture de …`

### 19.5 Replay

- `Résumé complet du raid.`
- `Résumé partiel · certains événements ne sont pas disponibles.`
- `Temps signalé en attente.`
- `Premier blocage critique.`
- `La route finale a été ouverte.`
- `Points sécurisés lors de ce dépôt.`
- `Aucun classement individuel n’est calculé.`

### 19.6 Verbotene Texte

- `AI recommendation`;
- `Chance de réussite 83 %` ohne verifizierbares Modell;
- `Temps perdu par [Name]`;
- `Position actuelle` bei nur gemeldeter Etage;
- `Score total` für bestätigten + ungesicherten Score;
- `Bloqué` aufgrund einer reinen `LIVE_REQUIRED`-Annahme.

## 20. Accessibility

- Status, Risiko, Vertrauen und Pfad sind nie nur farblich;
- Route erhält lineare Screenreader-Zusammenfassung;
- `aria-current="step"` für aktuellen Knoten;
- Engpass nennt Ursache und Folge im Accessible Name;
- neue kritische Warnung einmalig über `aria-live="assertive"`, keine Wiederholung pro Tick;
- normale Missionwechsel über `aria-live="polite"`;
- Soundtoggle besitzt Textstatus;
- Animationen respektieren Reduced Motion;
- Fokusreihenfolge folgt Ablauf und nicht visuellen Überlappungen;
- Zoom 200 % ohne Verlust der Primäraktion;
- Touchziele mindestens 44 px;
- französische Langtexte werden nicht kritisch abgeschnitten.

## 21. Performance und Stabilität

### Budgets

Bei maximal 50 Tasks, 16 Teilnehmern und 200 sichtbaren Events:

- vollständige Wow-Projektion p95 <16 ms in Unit-Benchmark;
- zeitbasierter Tick aktualisiert nur betroffene Licht-/Alterselemente;
- keine Layout-Neuberechnung der gesamten Map pro Sekunde;
- keine Canvas-Pflicht; semantisches HTML/SVG bevorzugt;
- Replay-Pagination maximal 500 Events pro Request;
- keine Sounddatei >100 KB ohne Begründung;
- keine Blockierung des bestehenden SSE-Reconnects.

### Stabilität

- Fehler im Wow Layer dürfen Taskdrawer und bestehende Kernansichten nicht unbenutzbar machen;
- bei Selektorfehler fällt UI auf vorhandene Mission/Radar-/Taskdarstellung zurück;
- Error Boundary protokolliert, verändert aber keinen Serverzustand.

## 22. Technische Implementierungsvorgaben für Codex

### 22.1 Erst nach Phase 8.5B

Codex beginnt Phase 9B erst, wenn:

- v0.8.6 vorliegt;
- visuelle Authenticity-Regression grün ist;
- bestehende Unit-, Simulation-, Reliability-, Build- und E2E-Suites grün sind.

### 22.2 Vorgeschlagene reine Domain-/View-Dateien

```text
platform/src/wow/types.ts
platform/src/wow/graph.ts
platform/src/wow/critical-path.ts
platform/src/wow/risk-engine.ts
platform/src/wow/next-action.ts
platform/src/wow/replay.ts
platform/src/wow/sound-policy.ts
platform/src/wow/view-model.ts
```

Diese Dateien dürfen bestehende Core-Helper importieren, aber keine Servermutation ausführen.

### 22.3 Vorgeschlagene Komponenten

```text
platform/components/wow/LiveRaidMap.tsx
platform/components/wow/RouteNode.tsx
platform/components/wow/TransferThread.tsx
platform/components/wow/CriticalThread.tsx
platform/components/wow/BottleneckNote.tsx
platform/components/wow/SmartNextAction.tsx
platform/components/wow/RiskDecisionStack.tsx
platform/components/wow/ReplaySummary.tsx
platform/components/wow/SoundController.tsx
platform/components/wow/MotionBoundary.tsx
platform/components/sanctuaire/SanctuaireLiveMap.tsx
platform/components/gigalodon/GigalodonLiveMap.tsx
```

Dateinamen dürfen nach Phase 8.5B an die finale Komponentenstruktur angepasst werden; Verantwortungsgrenzen bleiben verbindlich.

### 22.4 Integrationspunkte

- `SessionApp`: Wow-ViewModel einmal pro Snapshot ableiten;
- CaptainView: Smart Captain Action, Map, RiskDecisionStack;
- MissionView: Smart Participant Action und kompakte persönliche Route;
- Sanctuaire/Gigalodon Command Center: raid-spezifische Map-Komposition;
- Endscreen: Replay Summary;
- bestehender TaskDrawer bleibt Detail- und Fallbackvertrag;
- bestehender `deriveCaptainRadar` bleibt bis vollständiger Testmigration verfügbar und wird nicht ungeprüft entfernt.

### 22.5 API und Persistenz

- keine Migration erforderlich;
- keine neuen Commands;
- keine Änderung existierender API-Payloads;
- optionaler additiver read-only Replay-Eventendpunkt gemäss Abschnitt 13;
- Sound-/Motionpräferenz nur lokal;
- Wow-Risiken, Pfade und Empfehlungen werden nicht als zweite Wahrheit persistiert.

### 22.6 Feature-Rollout

Empfohlene Flags:

- `wowLiveMap`;
- `wowNextAction`;
- `wowRiskEngine`;
- `wowReplay`;
- `wowSound`.

Flags dürfen Darstellung deaktivieren, aber keine Fachlogik beeinflussen.

## 23. Testmatrix

### 23.1 Unit

- Graphintegrität beider Definitionen;
- deterministische Aggregatstatus;
- kritischer Pfad bei parallelen Ästen;
- optionaler Task verändert Hauptpfad nicht;
- Smart-Action-Scoring und Tie-Breaker;
- Rollen-/Scope-Ausschluss;
- jede Risk-Regel und Deduplizierung;
- `LIVE_REQUIRED` eskaliert kein unbewiesenes hartes Gate;
- Replay-Vollständigkeit und Lücken;
- Sound-Dedupe/Cooldown;
- Reduced-Motion-Cues.

### 23.2 Integration

- Snapshotrevision erzeugt identische Wow-Projektion bei allen Clients;
- Mapknoten öffnet richtige bestehende Task;
- Empfehlung führt in vorhandenen Commandflow;
- Reconnect unterdrückt unsichere Soundeskalation;
- Eventpagination rekonstruiert lückenlosen Replay;
- Scoretrennung bleibt intakt;
- Sanctuaire-Transfers erscheinen erst nach Bestätigung.

### 23.3 E2E

Je Raid:

- Captain Desktop 1440 × 900;
- Tablet 768 × 1024;
- Teilnehmer Mobile 390 × 844;
- Reduced Motion;
- Sound Off und opt-in;
- Offline/Reconnect;
- `LIVE_REQUIRED`;
- Ended + vollständiger Replay;
- Partial Replay.

### 23.4 Regression

Weiterhin zwingend:

- Typecheck;
- bestehende Unit-/Integrationstests;
- Sanctuaire-Simulation;
- Gigalodon-Simulation;
- Reliability-Läufe;
- Produktionsbuild;
- bestehende Browser-E2E;
- Visual-Authenticity-E2E;
- npm-Audit.

## 24. Visuelle Abnahmekriterien

### Gemeinsame Kriterien

- wichtigste Entscheidung in drei Sekunden sichtbar;
- keine mehr als drei direkt benachbarten identischen Cards;
- struktureller kritischer Pfad als Route, nicht nur Textliste;
- Engpassursache und Folge gleichzeitig sichtbar;
- keine geografische Position behauptet, die nicht erfasst wird;
- Status nicht nur über Farbe oder Animation;
- `LIVE_REQUIRED`, stale und partial klar getrennt;
- 390 px und 768 px ohne horizontales Kernscrolling;
- 200 % Zoom bedienbar;
- Reduced Motion ohne Informationsverlust.

### Sanctuaire

- vier Puzzleäste und ihre Zusammenführung sofort erkennbar;
- bestätigte Transfers sichtbar;
- Korridor als eigener breiter Übergang;
- zwei Finalbosse gleichwertig;
- Raid-Leben als eigenständiges Siegel.

### Gigalodon

- Tiefenroute permanent erkennbar;
- Licht an Etagen gebunden;
- getragene und gesicherte Werte klar getrennt;
- Unique-Fracht priorisiert;
- Rückweg und Finalfreigabe räumlich verbunden;
- unbestätigte Finalblockade nicht rot als bewiesene Wahrheit.

### Replay

- Live-Route visuell wiedererkennbar;
- Kapitel, Highlights und Engpassspannen unterscheidbar;
- keine Personenrangliste;
- Partial-Zustand unübersehbar;
- Druckansicht ohne interaktive Abhängigkeit verständlich.

## 25. Abnahme-Gates

Phase 9B gilt erst als abgeschlossen, wenn:

1. bestehende Verträge unverändert sind;
2. gleiche Snapshots auf allen Clients gleiche Empfehlungen/Risiken erzeugen;
3. beide Maps alle verpflichtenden Definitionstasks erreichbar darstellen;
4. kein unbestätigter Fakt als sicheres Gate erscheint;
5. kritischer Pfad explizit strukturell beschriftet ist;
6. Replay bei lückenhaften Events keine vollständigen Kennzahlen behauptet;
7. Sounds standardmässig aus und dedupliziert sind;
8. Motion rein informationshaltig und reduzierbar ist;
9. alle Responsive-, Accessibility- und Performancekriterien bestehen;
10. komplette technische Regression grün ist.

## 26. Stop-Regeln für Codex

Codex stoppt und dokumentiert statt zu raten, wenn:

- eine Empfehlung nur mit neuer Raidregel begründbar wäre;
- eine Mapposition nicht aus vorhandenen Daten abgeleitet werden kann;
- ein Replaywert wegen fehlender Events nicht belastbar ist;
- ein Risiko neue Persistenz oder einen neuen Command benötigen würde;
- eine Visualisierung bestätigten und ungesicherten Score vermischt;
- eine `LIVE_REQUIRED`-Regel als rotes hartes Gate formuliert werden müsste;
- Phase 8.5B noch nicht regressionssicher abgeschlossen ist;
- Accessibility nur durch Informationsverlust erreichbar wäre.

## 27. Ergebnis dieser Phase

Phase 9A liefert ausschliesslich:

- diesen vollständigen Implementierungsvertrag;
- aktualisierte Projektsteuerung und Roadmap;
- Codex-Backlog und Abnahmekriterien;
- Validierungsbericht;
- gemeinsam versionierte Master- und ZIP-Datei.

Produktcode, Raiddefinitionen, APIs, Realtime, Persistenz und Berechtigungen bleiben in v0.8.5.1 unverändert.
