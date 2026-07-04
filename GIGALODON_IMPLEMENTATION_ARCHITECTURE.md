# Gigalodon Implementation Architecture

**Projektversion:** v0.8.6.1  
**Phase:** 8.6.1 – Raid Truth Reconciliation & Pilot Hardening  
**Status:** implementiert und automatisiert geprüft  
**Stand:** 28.06.2026

## 1. Ziel und Grenze

Phase 8 ergänzt den bestehenden Plattform- und Raid-State-Kern um die vollständige operative Fachlogik für `Gouffre du Gigalodon`. Authentifizierung, Rollen, Realtime, Revisionen, Eventlog, Outbox, Recovery, Resultatbestätigung und generischer Task-Renderer wurden nicht neu gebaut.

Die kanonische Fachquelle bleibt `gigalodon.v0.2.json` in Definitionsversion `0.2.1`. Guide-Baselines bleiben konfigurierbar und sichtbar `GUIDE_CONFIRMED`/nicht live bestätigt; echte offene Regeln bleiben `LIVE_REQUIRED`. Keine dieser Klassen ist allein ein hartes Gate.

## 2. Implementierte Schichten

```text
gigalodon.v0.2.json
  ├─ 44 TaskDefinitions, Dependencies und Automationen
  ├─ Ressourcen-, Fragment-, Licht- und Scoretabellen
  ├─ Resultatfelder und Bestätigungsrichtlinien
  └─ initiales Gigalodon-State-Model
           │
Definition Loader / Raid-State Initializer
           │
PlatformStore Domain Commands
  ├─ Etagenziel und Gruppenfortschritt
  ├─ Lichtbeobachtungen
  ├─ Inventar, Einzahlung und Verlust
  ├─ Fragmente und Unique-Träger
  ├─ Finalbereitschaft
  └─ Gigalodon-Start, Schadensrunden und Abschluss
           │
PostgreSQL/PGlite Transaction
  ├─ Session-, Task- und Raid-State
  ├─ genau eine Sessionrevision
  ├─ genau ein DomainEvent
  └─ genau ein Outbox-Eintrag
           │
SSE / Snapshot / Eventcursor
           │
Gigalodon Command Center
  ├─ Vertical Expedition Rail
  ├─ FloorLightPanels
  ├─ ResourceLedger
  ├─ Unique- und Fragmentstatus
  ├─ FinalReadiness
  └─ GigalodonFinalTracker
```

## 3. Persistenter Gigalodon-Zustand

Der Gigalodon-Zweig in `raid_sessions.raid_state` enthält:

- Etagen- und Zugangsstatus;
- fünf zeitgestempelte Lichtzustände;
- einen gemeinsamen, versionierten Salzpool mit unveränderlicher Änderungshistorie;
- Teilnehmerinventare mit Standort, Risiko und Aktualität;
- getrennte eingezahlte Ressourcen;
- bestätigten Score und projizierten ungesicherten Score;
- Unique-Ressourcenhalter für Mureine, Exécrabe und Willorque;
- Pincen-Träger;
- vier gemeinschaftliche Fragmente;
- Finalbereitschaft mit bestätigten und unbestätigten Bedingungen;
- Finalstart, Vorbereitung, Schadensrunden, Ergebnis `VICTORY`/`DEFEAT`, bestätigten Ressourcenscore, Bonusscore, Gesamtscore und Verschluckstatus;
- unveränderliche Einzahlungs- und Verlusthistorien;
- separate Evidenzflags für offene Live-Fragen.

Migration `0004_phase8_6_1_reconciliation.sql` registriert die additive Fachmigration. Bestehendes persönliches Testsalz wird einmalig in den gemeinsamen Pool summiert und danach aus allen persönlichen Inventaren und Taskresultaten entfernt. Die Migration erzeugt pro veränderter Session genau eine Revision und ein Event; es bleibt keine parallele Salz-Doppelwahrheit.

## 4. Lichtmodell

Die erste Etage wird mit Stufe 4 initialisiert. Jede neu freigeschaltete tiefere Etage wird mit Stufe 1 und dem serverseitigen Freischaltungszeitpunkt initialisiert. `SET_GIGALODON_LIGHT` speichert danach nur Beobachtungen; Erhöhungen laufen über `REFILL_GIGALODON_LIGHT`.

Pro Etage werden gespeichert:

- beobachtetes Level `0..4`;
- serverseitigen Beobachtungszeitpunkt;
- daraus berechneten nächsten Verfall;
- verantwortliche Person;
- verwendetes Intervall;
- Vertrauensstatus von Baseline, Intervall und Salzkostensemantik.

Der Client zeigt den Countdown aus Serverzeit und Beobachtung. `effectiveLightLevel` berechnet bei veralteten Beobachtungen den erwarteten Wert, ohne die Beobachtung als neue bestätigte Spieltatsache zu speichern.

Amber visualisiert Licht. Semantische Risikoindikatoren markieren zusätzlich Level 2, 1 und 0. Die Guide-Baseline von 120 Sekunden und die inkrementellen Kosten `1/3/6/10` bleiben sichtbar als nicht live bestätigt gekennzeichnet. Mehrstufige Auffüllungen summieren die Schritte und belasten den gemeinsamen Pool atomar.

## 5. Ressourcenledger und Score

Jeder Teilnehmer besitzt ein Raid-Inventar mit acht Score-Ressourcen, drei Unique-Bossressourcen und der Pince d’Exécrabe. Salz ist ausdrücklich kein Bestandteil dieses Inventars.

### Gemeinsamer Salzpool

`ADJUST_GIGALODON_SALT` erfasst Sammeln oder berechtigte Korrekturen. `REFILL_GIGALODON_LIGHT` verbraucht Salz und erhöht das Licht in derselben Transaktion. Der Pool kann nicht negativ werden. Jede Änderung hält Actor, Serverzeit, Ursache, Vorher-/Nachher-Wert sowie optionale Sammler-/Auffüllerverantwortung fest. `SELECT … FOR UPDATE` und die bestehende Serialisierung verhindern verlorene parallele Updates. Salz bleibt bei der Scoreberechnung 0.

### Getragen

`UPDATE_GIGALODON_INVENTORY` aktualisiert:

- Mengen;
- aktuelle Etage;
- Risikostufe;
- Bestätigungszeit;
- Actor.

Der daraus berechnete Wert ist ausschliesslich `projectedUnbankedScore` beziehungsweise `score at risk`.

### Eingezahlt

`DEPOSIT_GIGALODON_INVENTORY` überträgt scorefähige Mengen atomar in `depositedResources`, erhöht `confirmedScore`, setzt den getragenen scorefähigen Bestand zurück und protokolliert einen Deposit-Eintrag. Die nicht scorefähige Pince bleibt getrennt; persönliches Salz wird serverseitig abgewiesen.

Bestätigter Score und Score at risk werden in Domain, API und UI niemals zu einer unbeschrifteten Zahl vermischt.

### Verlust

`RECORD_GIGALODON_LOSS` protokolliert beobachtete Verluste, setzt den angegebenen getragenen Bestand zurück und reduziert den ungesicherten Score. Unique-Verlust besitzt ein separates `uniqueLossConfirmedInGame`; ohne diese Evidenz wird kein unbestätigtes Sonderverhalten als sichere Regel behauptet.

## 6. Etagen, Zugänge und Fragmente

- Etage -1 besitzt ein Captain-konfigurierbares Gruppenziel mit separatem Evidenzflag.
- Gruppenfortschritt ist atomar und kann das definierte Zugangsgate auslösen.
- Mureine, Luminarium, Exécrabe-Rätsel, vier Fragmente und Willorque öffnen ihre Folgeetagen definitionsgetrieben.
- Fragmente werden gemeinschaftlich gespeichert.
- Fragment 2 und 3 werden aus bestätigten Bossresultaten abgeleitet.
- Fragment 1 und 4 können beobachtungsbasiert bestätigt werden.
- Das Systemgate für Etage -6 schliesst erst bei vier Fragmenten.

Die Dropchance wird aus der versionierten Lookup-Tabelle und ausschliesslich aus `confirmedScore` berechnet. Offene Inklusivgrenzen bleiben Definition-/Live-Testthema.

## 7. Boss- und Rätselmodule

### Mureine

Bestätigter Sieg speichert den Unique-Halter, Fragment 2 und den Zugang zur nächsten Etage.

### Luminarium

Der Ausgangszustand wird als echte 4×4-Boolean-Matrix serverseitig validiert. Phase 8 implementiert bewusst keinen eigenen Solver; das Resultat und der bestätigte Abschluss sind vollständig trackbar.

### Exécrabe

Die vier HP-Schwellen akzeptieren nur vier unterschiedliche Erscheinungen. `SECOND_PERSON` wird serverseitig erzwungen. Erst die Bestätigung überträgt die Sequenz an das Statuenrätsel. Rancune-, Pincen-Halter und Fragment 3 werden getrennt gespeichert.

### Willorque

Bestätigter Sieg speichert den Noirceur-Halter und priorisiert den Rückweg-/Einzahlungsabschnitt. Das Produkt bleibt ein operativer Tracker, kein vollständiger Kampfsimulator.

## 8. Finalbereitschaft

`CONFIRM_GIGALODON_FINAL_READINESS` speichert:

- Sicherheit des Restzeitfensters;
- drei eingezahlte Unique-Ressourcen;
- kritischen ungesicherten Score;
- aktive Kämpfe;
- Evidenzstatus der aktiven-Kämpfe-Regel;
- Finalteam-Bereitschaft;
- Captainbestätigung;
- veraltete Inventarbestätigungen.

Die UI gruppiert Checks in `blockiert`, `unbestätigt` und `bereit`. Aktive Kämpfe mit `LIVE_REQUIRED` erscheinen als konkrete Soft Warning („könnten den Start verhindern · im Spiel prüfen“); der Captain kann bewusst fortfahren. Nur eine separat bestätigte Fachregel dürfte daraus ein hartes Gate machen.

## 9. Finalkampf und Score

`START_GIGALODON_FINAL` prüft Captainrechte, speichert den serverseitigen Startzeitpunkt, ob vor Ablauf gestartet wurde, die Vorbereitungszeit und setzt die Session auf `FINAL_ACTIVE`.

`UPDATE_GIGALODON_FINAL` verwaltet:

- Runde 1 bis 3;
- kumulierten Schaden;
- aus versionierten Schwellen abgeleiteten Bonusscore;
- verschluckte Person;
- Belegung des schwarzen Felds.

Der Abschluss verlangt ein explizites `VICTORY` oder `DEFEAT`. Beide Ergebnisse beenden den Versuch und sperren einen zweiten Start. Ergebnis, Runden, Gesamtschaden, bestätigter Ressourcenscore, fixierter Finalbonus und Gesamtscore werden getrennt gespeichert und angezeigt.

`FINISH_GIGALODON_RAID` ist nach beiden Ergebnissen zulässig und setzt die Session auf `ENDED`. Der Gesamtscore ist `confirmedResourceScore + finalBonusScore`.

## 10. Captain Radar und persönliche Mission

Der Radar ergänzt die generischen Plattformwarnungen um:

- Lichtlevel 0, 1 und 2;
- unbestätigte Licht-/Salzwerte;
- Unique-Ressourcen unterwegs;
- hohen ungesicherten Score;
- Inventar älter als fünf Minuten;
- unbekannten Pincen-Träger;
- fehlende Fragmente;
- Finalteam oder Captainbestätigung offen;
- aktive Kämpfe als bestätigte oder mögliche Startblockade;
- globalen Timer unter den definierten Produktschwellen.

Die persönliche Mission zeigt zusätzlich eigene Etage, getragenes Risiko, Pincen-Rolle und noch einzuzahlende Unique-Ressourcen.

## 11. Produktoberfläche

`platform/components/GigalodonCommandCenter.tsx` bildet die raid-spezifische Primäransicht:

- vertikaler Expeditionspfad;
- Etage--1-Ziel und Fortschritt;
- fünf Lichtinstrumente mit Countdown;
- getrennte Kennzahlen für bestätigten und ungesicherten Score;
- vollständiges Captain-Ledger;
- gemeinsamer Salzpool mit letzter Änderung und Verantwortlichen;
- kompakter eigener Bestand ohne Salz für Teilnehmer;
- Unique-, Fragment- und Pincenstatus;
- gruppierter Finalstartcheck;
- Drei-Runden-Schadenstracker mit explizitem Finalergebnis.

Der generische Taskdrawer bleibt für alle 44 TaskDefinitions verfügbar.

## 12. Realtime- und Eventinvarianten

Alle Gigalodon-Mutationen verwenden den bestehenden Plattformvertrag:

- serverautoritativ;
- transaktional;
- monotoner Sessioncursor;
- genau ein DomainEvent pro bestätigter Absicht;
- genau ein Outbox-Eintrag;
- Snapshot plus Events für Recovery;
- automatische Folgeänderungen innerhalb derselben Revision.

Der vollständige Sieg-Ablauf endet bei Revision 155 mit genau 155 Events; zwölf geladene Clients konvergieren auf denselben Snapshot. Eine getrennte Niederlage-Simulation prüft Ergebnis, Abschluss und Startsperre mit denselben Revisions-/Eventinvarianten.

## 13. Bewusste Grenzen

Nicht behauptet oder nicht implementiert:

- kein echter DOFUS-Live-Test;
- Lichtinitialisierung, 120-Sekunden-Intervall und Salzkosten-Guide-Baseline nicht durch RAIDWEAVE live bestätigt;
- Etage--1-Gruppenzahl 18/20 nicht live bestätigt;
- Unique-Verlust bei Niederlage nicht live bestätigt;
- Fragmentchance an den Grenzwerten nicht live bestätigt;
- Finalstart bei gleichzeitigem Kampf nicht live bestätigt;
- kein eigener Luminarium-Solver;
- kein vollständiger Kampfsimulator;
- kein externer PostgreSQL- oder Zwei-Instanzen-Test;
- kein abhängiges generisches Undo/Snapshot-Restore.

Diese Grenzen blockieren den abgeschlossenen Software- und Simulationsscope der Phase 8 nicht.

## 14. Pilotkorrektur und Scopegrenze v0.8.6.1

`REPORT_INFORMATION_INCORRECT` ist für Teilnehmer, Captain und Editor verfügbar. Nur Captain oder Editor kann mit Notiz über `CONFIRM_PLAYER_CORRECTION` den Status `PLAYER_CORRECTED` protokollieren. Die Definition wird nicht automatisch verändert. Phase 9B, Smart Next Action, Risk Engine, Live Raid Map, Critical Path, Replay, Sound und neue Wow-Motion sind nicht implementiert.
