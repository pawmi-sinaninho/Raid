# Roadmap

Die Phasennummerierung entspricht dem tatsächlichen Projektablauf. Jede Phase endet mit einem überprüfbaren Ergebnis; abgeschlossene Phasen werden nicht ungefragt neu erstellt.

## Phase 1 – Produktfundament — abgeschlossen

- Problem, Zielgruppen und Jobs to be done;
- Scope, Nichtziele und Produktprinzipien;
- Kernfunktionen, User Flows und Architekturgrundlagen.

## Phase 2 – Fachmodellierung — abgeschlossen

- vollständige Task-Graphs für beide Raids;
- Score-, Timer-, Lebens-, Ressourcen- und Warnregeln;
- Quellenstatus, Widersprüche und Live-Testcheckliste.

## Phase 3 – Datenmodell und Wireframes — abgeschlossen

- gemeinsames JSON-Schema;
- zwei maschinenlesbare Raiddefinitionen;
- Statusmaschine, Abhängigkeiten und automatische Datenübertragungen;
- Screen-Inventar;
- Captain-Desktop- und Teilnehmer-Mobile-Wireframes;
- Validierung gegen Task-Graphs und User Flows.

## Phase 4 – Visuelles Designsystem — abgeschlossen

### Ziel

Eine eigenständige Premium-Identität auf Basis der freigegebenen Informationsarchitektur.

### Arbeit

- Name und Branding;
- Typografie, Abstände, Icons und Zustandssemantik;
- gemeinsames Komponentenfundament;
- Sanctuaire- und Gigalodon-Themen;
- Motion-Regeln;
- Desktop- und Mobile-Referenzscreens.

### Ergebnis

- öffentlicher Produktname und Markenrichtung `RAIDWEAVE`;
- Core-, Semantic- und Raid-Theme-Token;
- vollständige Status-, Risiko-, Verbindungs- und Vertrauenssemantik;
- gemeinsame Komponentenverträge;
- zwei klar getrennte Raidwelten;
- vier High-Fidelity-Referenzscreens;
- Kontrast-, Accessibility- und Integritätsprüfung.

### Abgeschlossen, weil

- die Seite nicht wie ein Standard-SaaS-Template aussieht;
- Sanctuaire und Gigalodon sofort unterscheidbar sind;
- alle Zustände konsistent, nicht nur farblich und barrierearm definiert sind;
- Designquellen und maschinenlesbare Tokens als Implementierungsvertrag vorliegen.

## Phase 5 – Technischer Realtime-Spike — abgeschlossen

### Ergebnis

- ausführbarer TypeScript-Spike;
- anonyme Sessionteilnahme und gehashte Recovery-Tokens;
- 16 gleichzeitig verbundene Raidclients;
- HTTP-Commands und Server-Sent Events;
- globale Sessionrevision und Taskrevisionen;
- atomare Claims und Zähler;
- serverautoritärer Timer;
- Eventlog und SQLite-Persistenz;
- Recovery nach Streamabbruch und Serverneustart;
- zehn vollständige Belastungs- und Zuverlässigkeitsläufe.

### Gate bestanden

- 500/500 schnelle Updates bestätigt;
- alle Clients konvergierten in jedem Lauf;
- exklusive Claims hatten genau einen Gewinner;
- Konflikte wurden explizit beantwortet;
- kein bestätigter Zustand ging bei Refresh oder Neustart verloren.

## Phase 6 – Plattformkern — abgeschlossen

### Ergebnis

- produktnahes Next.js-/TypeScript-Repository;
- PostgreSQL-Schema und Migration;
- Definition Loader und generische Dependency Engine;
- transaktionale Commands, Revisionen, Eventlog und Outbox;
- SSE mit Eventcursor und Snapshot-Recovery;
- anonyme, gehashte Invite- und Recovery-Tokens;
- Captain-, Editor-, Teilnehmer- und Zuschauerrechte;
- Team-Scopes, Linkrotation und Ready-Check;
- Lobby, generischer Task-Renderer, persönliche Mission und Captain Radar;
- responsive Produktoberfläche für Mobile und Desktop.

### Gate bestanden

- Typecheck und Produktionsbuild bestanden;
- 10/10 Unit-/Integrationstests;
- 10/10 Zuverlässigkeitsläufe mit je 16 Rollen;
- 500/500 Burst-Updates ohne Lost Update;
- Claim Race immer genau ein Gewinner;
- Event-, Cursor- und Outbox-Invarianten bestanden;
- 4/4 Browser-E2E-Szenarien auf 390 × 844 und 1440 × 900;
- 0 bekannte npm-Schwachstellen.

### Infrastrukturgrenze

Externer PostgreSQL-, Multi-Instanz-, WAN-, Backup- und Failovertest bleiben Deploymentgates vor dem Pilot. Der produktive Codepfad ist implementiert; PGlite bleibt lokaler Testmotor.

## Phase 7 – Sanctuaire komplett — abgeschlossen

### Ergebnis

- vier parallele Rätselmodule mit definitionsbasierter Feldvalidierung;
- Selbst-, Zweitpersonen-, Captain- und Systembestätigung;
- bestätigte Datenübertragung und abgeleitete Wächterwerte;
- Raid-Leben mit Ursache, Actor, Zeit und Korrekturhistorie;
- vier Wächterkarten;
- konfigurierbarer Korridor-Dispatcher mit sichtbarem `LIVE_REQUIRED`;
- getrennte Finalbossteams und gemeinsame Abschlussbedingung;
- Sanctuaire-spezifischer Captain Radar;
- vollständiger simulierter Ablauf mit 16 Clients.

### Gate bestanden

- Typecheck und Produktionsbuild bestanden;
- 18/18 Unit-/Integrationstests;
- 49/49 Sanctuaire-Tasks im simulierten Raid abgeschlossen;
- Revision/Event-Invariante 177/177;
- 16/16 Clients konvergierten;
- 10/10 Reliability-Läufe mit 500/500 Burst-Updates;
- 4/4 Browser-E2E-Szenarien auf Mobile und Desktop;
- 0 bekannte npm-Schwachstellen.

### Live-Grenze

Der echte DOFUS-Live-Test steht weiterhin aus. Die Guide-Baseline 60 bleibt konfigurierbar und sichtbar als nicht durch RAIDWEAVE live bestätigt markiert.

## Phase 8 – Gigalodon komplett — abgeschlossen

### Ergebnis

- Etagen, Zugänge und vier Fragmente;
- serverautoritativ beobachtete Lichtzustände pro Etage;
- sichtbare `LIVE_REQUIRED`-Evidenz für Licht und Salz;
- persönliches Ressourcenledger und transaktionale Einzahlungen;
- bestätigter Score getrennt von Score at risk;
- Verlusthistorie und Unique-Ressourcenrisiko;
- Mureine, Luminarium, Exécrabe und Willorque;
- Pincen-Träger und Unique-Halter;
- Finalstartcheck mit blockiert/unbestätigt/bereit;
- drei Schadensrunden und versionierter Bonusscore;
- Gigalodon-spezifische Captain- und Teilnehmeransichten.

### Gate bestanden

- Typecheck und Produktionsbuild bestanden;
- 26/26 Unit-/Integrationstests;
- 44/44 Gigalodon-Tasks im simulierten Raid abgeschlossen;
- Revision/Event-Invariante 153/153;
- 12/12 Clients konvergierten;
- Sanctuaire-Regression 49/49 und 177/177;
- 10/10 Reliability-Läufe mit 500/500 Burst-Updates;
- 6/6 Browser-E2E-Szenarien;
- 0 bekannte npm-Schwachstellen.

### Live-Grenze

Licht-/Salzlogik, 18/20 Gruppen, Unique-Verlust, Fragmentgrenzen, Finalstart bei laufenden Kämpfen und Timerablauf bleiben sichtbar unbestätigt und müssen im aktuellen DOFUS-Client geprüft werden.


## Phase 8.5 – Visual Authenticity & Human Design Pass — abgeschlossen

### Ziel

Die funktional vollständige Produktoberfläche von generischen Dark-Dashboard-Mustern zu einem eigenständigen, glaubwürdigen Raidwerkzeug umbauen.

### Phase 8.5A – abgeschlossen

- Design-Audit der tatsächlichen Implementierung;
- neue Art Direction `Field-built Raid Desk`;
- neue Typografie, Materialien, Icons und Microcopy;
- Neuaufbau von Landing, Lobby, beiden Captain-Screens und Teilnehmer-Mobile;
- fünf HTML-/PNG-Referenzbilder;
- Codex-Implementierungsplan und messbare Abnahme.

### Phase 8.5B – abgeschlossen als v0.8.6

- Referenzen im bestehenden Plattformcode implementiert;
- Foundations, Fonts, Tokens, Icons und Materialkomponenten migriert;
- Public, Lobby, Participant Mobile, Sanctuaire Captain und Gigalodon Captain umgesetzt;
- 390, 768, 1440 und 1920 px, Accessibility und Reduced Motion abgenommen;
- fünf verbindliche Screenshots erzeugt;
- vollständige visuelle und technische Regression bestanden;
- Fachlogik, Raiddefinitionen, API, Realtime, Persistenz und Berechtigungen unverändert gelassen.

## Phase 8.6.1 – Raid Truth Reconciliation & Pilot Hardening — abgeschlossen

- Gigalodon-Salz als gemeinsamer, atomarer Raidpool statt persönlichem Inventar;
- Lichtinitialisierung und Kosten als versionierte Guide-Baseline;
- Finalergebnis `VICTORY`/`DEFEAT` und Startsperre nach Ergebnis;
- Sanctuaire-Korridor standardmässig 60 (`10 × 6`), weiterhin konfigurierbar;
- Quellenstatus vereinheitlicht und `LIVE_REQUIRED` als nicht blockierendes Vertrauenssignal;
- bekannte offene Regeln als konkrete Soft Warnings;
- Pilotmeldung `Information incorrecte` mit berechtigter `PLAYER_CORRECTED`-Bestätigung;
- Datenmigration, Simulationen, Regression und v0.8.6.1-Release-Artefakte.

Phase 9B und alle Wow-Layer-Funktionen wurden dabei nicht implementiert.

## Phase 9 – Wow Layer

### Phase 9A – Spezifikation abgeschlossen

Dokumentationsstand v0.8.5.1:

- Live Raid Map für beide Raids;
- Smart Next Action;
- Risk Engine;
- struktureller kritischer Pfad und Engpässe;
- Replay Summary;
- Sound und informationshaltige Animationen;
- responsive, Accessibility-, Performance- und Testverträge;
- technische Codex-Grenzen ohne Produktcode-Umbau.

Verbindliche Artefakte:

- `WOW_LAYER_SPECIFICATION.md`;
- `PHASE9A_VALIDATION_REPORT.md`.

### Phase 9B – weiterhin separater Implementierungsscope

Gate:

- Phase 8.6.1 ist als v0.8.6.1 regressionssicher abgeschlossen;
- Wow Layer wird danach auf der neuen Visual-Art-Direction implementiert;
- bestehende Fach-, API-, Realtime-, Raiddefinitions- und Berechtigungsverträge bleiben unverändert;
- keine scheinpräzise Zeitprognose und keine automatische Domainmutation.

## Phase 10 – Pilot

- geschlossene Gruppe und echter Raid;
- Bildschirmaufzeichnung;
- Rückfragen, Zeitverlust und Fehler messen;
- keine neuen Funktionen während des Piloten;
- danach Prioritäten neu ordnen.

## Phase 11 – Öffentliche V1

- Datenschutz, Impressum und Markenprüfung;
- Fehlermonitoring, Backup und Statusseite;
- Feedbackkanal und Patch-Updateprozess;
- französische Veröffentlichung zuerst.

## Qualitäts-Gates

Kein Übergang zur nächsten technischen Phase, solange:

- kritische Fachfragen weder bestätigt noch sicher konfigurierbar sind;
- mobile Kernabläufe unverständlich sind;
- Realtime unzuverlässig ist;
- eine Funktion nur optisch, aber nicht zustandslogisch fertig ist;
- vorhandene Funktionen nicht getestet wurden.
