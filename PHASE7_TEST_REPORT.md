# Phase 7 Test Report

**Projektversion:** v0.7.0  
**Testdatum:** 27.06.2026  
**Prüfobjekt:** Sanctuaire-Implementierung im Repository `platform/`  
**Ergebnis:** PASS für den implementierten und simulierten Phase-7-Scope

## 1. Testumgebung

- Node.js 22;
- Next.js 16 Produktionsbuild;
- TypeScript Strict Mode;
- Vitest;
- PGlite als lokaler PostgreSQL-kompatibler Testmotor;
- Chromium über Playwright;
- Viewports 390 × 844 und 1440 × 900.

Ein externer PostgreSQL-Dienst, zwei getrennte App-Prozesse, WAN-Verhalten und ein echter DOFUS-Raid waren nicht Teil dieses Tests.

## 2. Gesamtergebnis

| Prüfung | Ergebnis |
|---|---:|
| TypeScript `tsc --noEmit` | PASS |
| Unit-/Integrationstests | 18/18 PASS |
| vollständige Sanctuaire-Simulation | PASS |
| wiederholter Plattform-Reliability-Test | 10/10 PASS |
| Next.js Production Build | PASS |
| Browser-E2E | 4/4 PASS |
| npm-Audit | 0 bekannte Schwachstellen |

Maschinenlesbare Zusammenfassung: `platform/artifacts/test-summary.json`.

## 3. Unit- und Integrationstests

**3 Testdateien, 18 Tests, 18 bestanden.**

### Weiterhin geprüfte Plattformverträge

- beide Raiddefinitionen validieren gegen Schema und Integritätsregeln;
- Session, Invites, Teams, Ready-Check und Timer;
- exklusives Claim-Race;
- atomare Zähler;
- Editor-Scope und Linkrotation;
- Snapshot, Cursor und Outbox.

### Neue Sanctuaire-Prüfungen

- Definition erzeugt vollständigen initialen Sanctuaire-State;
- Taskresultate werden aus den Definitionseingaben validiert;
- `SECOND_PERSON` akzeptiert nicht den ursprünglichen Einreicher;
- Captainbestätigung wird serverseitig erzwungen;
- Monochrome-Farbe wird erst nach Bestätigung übertragen;
- Sentinelle-Zielelement wird aus der versionierten Lookup-Tabelle abgeleitet;
- Clos-Zielmonster und Karte werden aus Farbe und Statuentyp abgeleitet;
- Raid-Leben bleibt zwischen 0 und 20 und besitzt eine Ursachenhistorie;
- Korridorziel ist konfigurierbar und besitzt einen separaten Evidenzstatus;
- Korridorzuweisungen werden pro Teilnehmer gespeichert;
- Korridorfortschritt ist nur in einer freigeschalteten Korridorphase zulässig;
- Erreichen des Korridorziels schaltet das Finale frei;
- ein abgeschlossenes Korridorziel kann nicht nachträglich erhöht werden;
- die Session endet erst nach beiden Finalboss-Siegen.

## 4. Vollständige 16-Client-Simulation

Quelle: `platform/artifacts/sanctuaire-simulation.json`.

| Messpunkt | Ergebnis |
|---|---:|
| Teilnehmer | 16 |
| TaskDefinitions | 49 |
| abgeschlossene Tasks | 49 |
| finale Sessionrevision | 177 |
| DomainEvents | 177 |
| Revision/Event-Invariante | PASS |
| konvergierte Clients | 16/16 |
| finales Raid-Leben | 19/20 |
| Korridor | 6/6 Testziel |
| Korridor als live bestätigt | nein |
| Reine Écarlate | COMPLETED |
| Princesse Maudite | COMPLETED |
| gemeinsames Final-Gate | COMPLETED |

Das Testziel `6` wurde absichtlich klein gewählt, damit die vollständige Korridorlogik schnell und reproduzierbar geprüft werden kann. Es ist keine Behauptung über den realen DOFUS-Zielwert.

### Geprüfte Datenübertragung

- Sentinelle-Farbe: `AMBRE_ORANGE`;
- daraus abgeleitetes Element: `EARTH`;
- Clos-Zielmonster: `Dahliane ambré`;
- Clos-Karte: `[11,21]`.

## 5. Wiederholter Plattformtest

Quelle: `platform/artifacts/platform-reliability.json`.

| Gate | Ergebnis |
|---|---:|
| vollständige Läufe | 10/10 |
| aktive Rollen pro Lauf | 16 |
| Burst-Updates gesamt | 500/500 |
| Claim Race | immer genau ein Gewinner |
| Cursor-Recovery | 10/10 |
| Outbox exklusiv | 10/10 |
| Event-Invariante | 10/10 |

Lokale Messwerte:

- durchschnittliche Gesamtdauer pro Lauf: **1'131.50 ms**;
- durchschnittliche Dauer eines 50-Update-Bursts: **132.68 ms**;
- langsamster Burst: **150.18 ms**;
- langsamstes Claim-Race: **7.56 ms**.

Diese Werte messen einen lokalen Prozess und dürfen nicht als Internet- oder Hostinglatenz interpretiert werden.

## 6. Browser-E2E

**4/4 Szenarien bestanden.**

### 390 × 844

- Session erstellen und anonym beitreten;
- Lobby und persönliche Mission;
- vier Ziele der Bottom Navigation;
- Task öffnen, übernehmen und bearbeiten;
- Navigation zwischen Mission und Raidübersicht;
- kein horizontales Kernscrolling.

### 1440 × 900

- Sanctuaire Command Center sichtbar;
- vier Rätselmodule;
- Raid-Lebensänderung über die Produktoberfläche;
- vier Wächterkarten;
- Korridor-Dispatcher;
- zwei getrennte Finalboss-Spalten;
- Captain Radar;
- kein horizontales Kernscrolling im Zielviewport.

Referenzscreens:

- `platform/artifacts/phase7-screens/sanctuaire-captain-1440x900.png`;
- `platform/artifacts/phase7-screens/sanctuaire-participant-390x844.png`.

Der Desktop-Screenshot ist als vollständige Seite gespeichert und deshalb höher als der 900-px-Viewport; die Interaktionsprüfung selbst lief im definierten 1440 × 900-Viewport.

## 7. Sicherheits- und Fachgrenzen

Bestätigt:

- Rollen- und Scope-Prüfung bleibt serverseitig;
- Zuschauer können keine Sanctuaire-Mutation ausführen;
- Resultatvalidierung und Bestätigung liegen im Server;
- Transfers werden nicht durch ungeprüfte Browserdaten ausgelöst;
- npm-Audit meldet keine bekannte Schwachstelle.

Nicht bewiesen:

1. echter DOFUS-Client und aktueller Live-Patch;
2. eigene RAIDWEAVE-Live-Bestätigung der Guide-Baseline 60;
3. reale Parallelität und Fehlereffekte aller Rätsel/Wächter;
4. externer PostgreSQL-Netzwerkdienst;
5. Fan-out zwischen zwei App-Instanzen;
6. Mobilfunk, Browser-Hintergrundmodus und lange WAN-Unterbrechungen;
7. Backup, Restore, Failover und Penetrationstest;
8. vollständiges abhängiges Undo.

Die Browserumgebung dieses Containers blockierte standardmässig alle URLs über eine Chromium-Enterprise-Policy. Für den lokalen E2E-Lauf wurde ausschliesslich `localhost` temporär erlaubt und die Policy danach wiederhergestellt; der Produktcode wurde dafür nicht verändert.

## 8. Widerspruchsprüfung

| Thema | Ergebnis |
|---|---|
| Korridor 60 | Guide-Baseline 10 × 6, Sessionwert konfigurierbar und fehlende eigene Live-Bestätigung sichtbar |
| Bestätigung vs. Transfer | nur bestätigte Resultate werden übertragen |
| UI vs. Fachlogik | UI rendert; Server/Definition entscheidet |
| beide Finalbosse | getrennt verfolgbar; gemeinsamer Abschluss erst nach beiden |
| System-Gates vs. Event-Invariante | automatische Änderungen bleiben im auslösenden Event |
| bisheriger Plattformkern | bestehende Auth-/Realtime-Verträge erhalten |

## 9. Gate

Phase 7 ist für den implementierten Software- und Simulationsscope abgeschlossen. Vor einem echten Pilot müssen die priorisierten Sanctuaire-Punkte aus `LIVE_TEST_CHECKLIST.md` im aktuellen DOFUS-Client geprüft werden.

## 10. Addendum v0.8.6.1

Die Korridor-Baseline ist auf `10 × 6 = 60` vereinheitlicht. Der Standard bleibt konfigurierbar, trägt `GUIDE_CONFIRMED` und wird sichtbar als noch nicht durch RAIDWEAVE live bestätigt angezeigt. Die frühere 60/80-Vermischung ist entfernt.

Die aktualisierte vollständige Simulation schliesst 49/49 Tasks mit Korridorziel 60 ab, erreicht Revision/Event 178/178 und konvergiert für alle 16 Clients. Browser-E2E prüft die Anzeige auf 390 × 844 und 1440 × 900. Die vollständige v0.8.6.1-Testmatrix steht im Phase-8.6.1-Abschlussbericht.
