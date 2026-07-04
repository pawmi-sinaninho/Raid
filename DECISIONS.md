# Decisions

## D-001 – Scope

**Entscheidung:** ausschliesslich DOFUS 3 auf PC.  
**Status:** final.

## D-002 – Produktart

**Entscheidung:** Live-Kommandozentrale, nicht Guide, Kalender oder allgemeine To-do-App.  
**Status:** final.

## D-003 – Teilnahme

**Entscheidung:** Teilnehmer benötigen für die Kernnutzung kein Konto.  
**Status:** final.

## D-004 – Rollen

**Entscheidung:** Captain, Editor/Teamleiter, Teilnehmer und Zuschauer.  
**Status:** vorläufig final.

## D-005 – Gerätepriorität

**Entscheidung:** Captain Desktop; Teilnehmer Mobile/zweiter Bildschirm.  
**Status:** final.

## D-006 – Raidumfang V1

**Entscheidung:** beide mit Update 3.6 veröffentlichten Gildenraids vollständig unterstützen.  
**Status:** final.

## D-007 – Produktintelligenz

**Entscheidung:** zuerst regelbasiert und nachvollziehbar, nicht von generativer KI abhängig.  
**Status:** final.

## D-008 – Clientzugriff

**Entscheidung:** keine Manipulation oder automatische Auslesung des DOFUS-Clients in V1.  
**Status:** final.

## D-009 – Design

**Entscheidung:** eigene Premium-Identität; keine generische SaaS-Optik und keine Kopie bestehender Fan-Seiten.  
**Status:** final.

## D-010 – technische Architektur

**Entscheidung:** Next.js und TypeScript bilden Produktfrontend und Anwendungsschicht. PostgreSQL ist die produktive Persistenz. Clients senden validierbare Commands über HTTP; bestätigte Zustände und Ereignisse werden per Server-Sent Events verteilt. SQLite bleibt ausschliesslich lokale Spike- und Testtechnologie.  
**Status:** final für den Plattformkern; konkreter Hosting- und Managed-Realtime-Anbieter bleibt austauschbare Infrastruktur.

## D-011 – Definition und Sessionzustand

**Entscheidung:** Eine versionierte `RaidDefinition` beschreibt mögliche Regeln und Aufgaben; eine `RaidSession` speichert ausschliesslich den Zustand eines konkreten Durchgangs. Laufende Sessions wechseln ihre Definitionsversion niemals stillschweigend.  
**Status:** final.

## D-012 – Umgang mit unbestätigten Spielregeln

**Entscheidung:** `LIVE_REQUIRED`-Regeln bleiben konfigurierbar und werden in der UI als unbestätigt gekennzeichnet. Sie dürfen kein unsichtbares hartes Gate erzeugen.  
**Status:** final.

## D-013 – Kanonische Aufgabenstatusmaschine

**Entscheidung:** `LOCKED → READY → CLAIMED → ACTIVE` mit den Seitenzuständen `WAITING`, `BLOCKED`, `FAILED`, `COMPLETED` und `SKIPPED`. Retry aus `FAILED` sowie Korrektur aus `COMPLETED` benötigen Berechtigung und Eventlog.  
**Status:** final.

## D-014 – Editor und Teamleiter

**Entscheidung:** Es gibt technisch eine Rolle `EDITOR`. Teamleiter werden durch auf Teams oder Bereiche beschränkte Editorrechte modelliert, nicht durch eine zusätzliche globale Rolle.  
**Status:** final.

## D-015 – Ergebnisbestätigung

**Entscheidung:** Kritische Rätseldaten können `SECOND_PERSON` oder `CAPTAIN` als Bestätigungsrichtlinie verlangen. Erst der bestätigte Wert wird automatisch an abhängige Module übertragen.  
**Status:** final.

## D-016 – Primäransichten

**Entscheidung:** Captain sieht eine raid-spezifische Command-Center-Ansicht mit Ausnahme-Radar. Teilnehmer starten immer in der persönlichen Mission mit „Jetzt“, „Danach“ und „Warte auf“.  
**Status:** final.

## D-017 – Generischer Task-Renderer

**Entscheidung:** Jede TaskDefinition muss über einen generischen Task-Detail-Screen darstellbar sein. Raid-spezifische Screens optimieren nur häufige oder kritische Abläufe und ersetzen nicht den generischen Fallback.  
**Status:** final.

## D-018 – Phase-3-Grenze

**Entscheidung:** Phase 3 liefert Informationsarchitektur, Datenverträge und Low-Fidelity-Wireframes, aber keinen Produktcode und kein visuelles Designsystem.  
**Status:** final.

## D-019 – Phasennummerierung

**Entscheidung:** Der tatsächliche Projektablauf ist verbindlich: Phase 1 Produktfundament, Phase 2 Fachmodellierung, Phase 3 Datenmodell und Wireframes, Phase 4 visuelles Designsystem, danach Realtime-Spike und Implementierung.  
**Status:** final.


## D-020 – Projektquellen und Versionsübergabe

**Entscheidung:** Der vollständige versionierte ZIP-Ordner bleibt das exakte Projektarchiv. In ChatGPT-Projekten wird ausschliesslich die konsolidierte `DOFUS_RCC_PROJECT_MASTER_vX.Y.Z.md` als aktive Quelle verwendet. Nach jeder Phase werden Master-Datei und ZIP gemeinsam neu versioniert; einzelne Quelldateien werden nicht separat neu hochgeladen.  
**Status:** final.

## D-021 – Öffentlicher Produktname

**Entscheidung:** Das Produkt heisst `RAIDWEAVE`; `Raid Command Center` bleibt Kategorie und interner Projektbegriff.  
**Status:** final für Design und technische Umsetzung; rechtliche Marken- und Domainfreigabe vor öffentlichem Launch offen.

## D-022 – Designsystemarchitektur

**Entscheidung:** Das visuelle System besteht aus `Core`, `Semantic` und `Raid Theme`. Raidthemes dürfen Task-, Risiko-, Verbindungs- oder Quellenstatus niemals umdeuten.  
**Status:** final.

## D-023 – Raidthemen

**Entscheidung:** Sanctuaire verwendet eine botanisch-königliche, horizontale Gartenlogik. Gigalodon verwendet eine tiefsee-instrumentelle, vertikale Expeditionslogik. Beide teilen Layoutverträge und Semantik.  
**Status:** final.

## D-024 – Typografie

**Entscheidung:** `Comfortaa` für Marke/Display, `Cabin` für UI und `Cousine` für Timer/Telemetrie. Kritische Zahlen verwenden tabellarische Ziffern.  
**Status:** final für V1-Designsystem.

## D-025 – Status und Risiko

**Entscheidung:** Jeder Taskstatus besitzt Farbe, Text, Icon und Formsignal. Risiko ist eine separate Semantik mit den Stufen `NORMAL`, `ATTENTION`, `HIGH`, `CRITICAL`.  
**Status:** final.

## D-026 – Dark-first Live-Oberfläche

**Entscheidung:** Die V1-Live-Oberfläche ist dark-first. Ein Light Theme ist nicht Bestandteil von V1; Kontrast, Fokus und reduzierte Bewegung sind dennoch verbindlich.  
**Status:** final für V1.

## D-027 – Komponenten- und Formensprache

**Entscheidung:** Gemeinsame Komponenten verwenden klare Panels mit geschnittener Ecke statt austauschbarer Standard-SaaS-Karten. Theme-Formen verändern Dekoration, nie Hitbox oder Informationshierarchie.  
**Status:** final.

## D-028 – Referenzscreens

**Entscheidung:** Die vier High-Fidelity-Referenzscreens sind visuelle Implementierungsbaseline. Sie sind keine pixelgenaue Vorgabe und dürfen nur verändert werden, wenn Token-, Komponenten- und Accessibility-Verträge erhalten bleiben.  
**Status:** final.

## D-029 – Command-/Push-Trennung

**Entscheidung:** Clients senden Absichten und niemals ungeprüfte Komplettzustände. Der Server validiert, persistiert und publiziert erst danach den bestätigten Zustand.  
**Status:** final.

## D-030 – Realtime-Transport V1

**Entscheidung:** Server-Sent Events sind der Standard-Push-Transport für V1. Schreiboperationen bleiben normale HTTP-Commands. WebSockets sind nur einzuführen, wenn ein späterer konkreter Use Case echte bidirektionale Dauerkommunikation verlangt.  
**Status:** final für V1.

## D-031 – Revisionsmodell

**Entscheidung:** Jede Session besitzt eine monoton steigende globale Revision. Jede TaskInstance besitzt zusätzlich eine eigene Revision. Exklusive Claims und komplexe Resultatänderungen prüfen die erwartete Taskrevision; atomare Zähler verwenden eine transaktionale Inkrementoperation.  
**Status:** final.

## D-032 – Event-Invariante

**Entscheidung:** Jede bestätigte Domainmutation erzeugt genau ein Event und genau eine neue Sessionrevision. Reads und reine Transportmetadaten erzeugen kein Domainevent.  
**Status:** final.

## D-033 – Anonyme Identität

**Entscheidung:** Invite- und Recovery-Tokens werden zufällig erzeugt, nur gehasht gespeichert und an Session sowie Teilnehmer gebunden. Zuschauer besitzen keine Schreibrechte.  
**Status:** final; Rotation, Ablauf und Widerruf sind seit Phase 6 implementiert.

## D-034 – Phase-5-Gate

**Entscheidung:** Der technische Realtime-Spike gilt als bestanden. Zehn vollständige Läufe mit je 16 Clients, 50 schnellen Updates, Claim Race, Revisionskonflikt, Timer, Reconnect und Neustartpersistenz waren erfolgreich.  
**Status:** final.


## D-035 – Plattformrepository

**Entscheidung:** Der produktnahe Code lebt ab Phase 6 im separaten Verzeichnis `platform/`. Der Phase-5-Spike bleibt unverändert als Referenz und wird nicht schrittweise zum Produkt umgebaut.  
**Status:** final.

## D-036 – PostgreSQL-Testmodus

**Entscheidung:** Produktion verwendet PostgreSQL über `pg`. PGlite darf für lokale Entwicklung, Integration und Reliability-Tests dieselben PostgreSQL-Verträge ausführen, ist aber keine Produktionspersistenz und kein Ersatz für einen externen Deploymenttest.  
**Status:** final.

## D-037 – Transaktionale Event-Outbox

**Entscheidung:** Domainzustand, globale Sessionrevision, genau ein DomainEvent und genau ein Outbox-Eintrag werden in derselben Datenbanktransaktion geschrieben. Outbox-Worker claimen mit `FOR UPDATE SKIP LOCKED`; PostgreSQL `LISTEN/NOTIFY` dient nur als Wake-up, nicht als Quelle der Wahrheit.  
**Status:** final.

## D-038 – Reconnect-Cursor

**Entscheidung:** Realtime-Wiederverbindung basiert auf der monotonen Sessionrevision als Eventcursor. Der Client lädt einen bestätigten Snapshot und danach Events ab Cursor. Verpasste Notifications verursachen keinen Datenverlust.  
**Status:** final.

## D-039 – Editor-Scope

**Entscheidung:** Editorrechte werden serverseitig über gespeicherte Team- und Aufgaben-Scopes begrenzt. Die Benutzeroberfläche darf Rechte ausblenden, ist aber nie die Sicherheitsgrenze. Globale Sessionaktionen bleiben Captain-only.  
**Status:** final.

## D-040 – Invite-Lebenszyklus

**Entscheidung:** Invite-Geheimnisse werden nur gehasht gespeichert. Klartext wird nur bei Erstellung oder Rotation ausgegeben. Rotation widerruft den bisherigen aktiven Link derselben Rolle; Nutzungsgrenze, Ablauf und manueller Widerruf sind serverseitige Join-Bedingungen.  
**Status:** final.

## D-041 – Dependency-Folgeaktionen

**Entscheidung:** Freischaltungen, die direkt aus einer bestätigten Taskmutation folgen, werden innerhalb derselben Domaintransaktion ausgeführt und im `after`-Zustand desselben Events dokumentiert. Dadurch bleibt die Invariante „eine bestätigte Absicht = eine Revision = ein Event“ erhalten.  
**Status:** final für den Plattformkern.

## D-042 – Phase-6-Gate

**Entscheidung:** Der Plattformkern gilt als abgeschlossen. Typecheck, Produktionsbuild, 10 Unit-/Integrationstests, zehn 16-Client-Zuverlässigkeitsläufe, 500/500 Burst-Updates und vier Browser-E2E-Szenarien waren erfolgreich. Externer PostgreSQL-/Multi-Instanz-Betrieb bleibt ein separates Deploymentgate vor dem Pilot.  
**Status:** final.

## D-043 – Raid-spezifischer Sessionzustand

**Entscheidung:** Raid-spezifische Laufzeitdaten werden in `raid_sessions.raid_state` gespeichert und bei Sessionerstellung aus dem versionierten `stateModel` der gebundenen Raiddefinition initialisiert. Der JSONB-Zustand ergänzt TaskInstances, ersetzt sie aber nicht.  
**Status:** final.

## D-044 – Resultat- und Bestätigungsworkflow

**Entscheidung:** Taskresultate besitzen getrennte Schritte für Entwurf, Einreichung und Bestätigung. Pflichtfelder und Werte werden serverseitig aus der TaskDefinition validiert. `SECOND_PERSON` muss durch eine andere Person und `CAPTAIN` durch den Captain bestätigt werden. Erst bestätigte Resultate dürfen Folgeaktionen auslösen.  
**Status:** final.

## D-045 – Definition-getriebene Sanctuaire-Folgeaktionen

**Entscheidung:** Rätseldatenübertragungen, System-Gates und abgeleitete Wächterdaten werden aus `dataTransfers`, Automationen und versionierten Lookup-Tabellen der Raiddefinition ausgeführt. Die UI darf diese Fachregeln nur darstellen, nicht als zweite Wahrheit implementieren. Direkte Folgeänderungen bleiben in derselben Transaktion, Revision und demselben Event wie die auslösende bestätigte Absicht.  
**Status:** final.

## D-046 – Sanctuaire Raid-Leben und Korrektur

**Entscheidung:** Raid-Leben wird serverseitig auf 0 bis 20 begrenzt. Jede Änderung benötigt eine Ursache und erzeugt einen unveränderlichen Historieneintrag mit Actor und Zeit. Korrekturen überschreiben keinen früheren Eintrag, sondern verweisen als neue protokollierte Änderung auf ihn.  
**Status:** final.

## D-047 – Sanctuaire-Korridorunsicherheit

**Entscheidung:** Das Korridorziel ist pro Session konfigurierbar. Der verwendete Zielwert und seine In-Game-Bestätigung sind getrennte Zustände. Bis zur Live-Verifikation von 60 versus 80 bleibt der Wert sichtbar `LIVE_REQUIRED` und darf kein unsichtbares hartes Gate auf Basis einer behaupteten Wahrheit erzeugen.  
**Status:** final.

## D-048 – Sanctuaire-Finalabschluss

**Entscheidung:** Reine Écarlate und Princesse Maudite werden als getrennte Finalketten geführt. Der Abschluss eines Bosses beendet den Raid nicht. Erst beide bestätigten Siege schliessen das gemeinsame System-Gate und setzen die Session auf `ENDED`.  
**Status:** final.

## D-049 – Phase-7-Gate

**Entscheidung:** Phase 7 gilt für den implementierten Software- und Simulationsscope als abgeschlossen. 18 Tests, 49/49 simulierte Tasks, 177/177 Revisionen und Events, 16/16 konvergierte Clients, zehn Reliability-Läufe, vier Browser-E2E-Szenarien und der Produktionsbuild waren erfolgreich. Der echte DOFUS-Live-Test bleibt ein separates Fachgate.  
**Status:** final.


## D-050 – Gigalodon-Licht als Beobachtungsmodell

**Entscheidung:** Licht wird pro Etage als zeitgestempelte Serverbeobachtung gespeichert. Ein erwarteter Verfall darf für Countdown und Warnung berechnet werden, ersetzt aber keine neue In-Game-Bestätigung. Intervall und Salzkostensemantik besitzen separate Evidenzflags.  
**Status:** final.

## D-051 – Gigalodon-Scoretrennung

**Entscheidung:** Getragene Ressourcen erzeugen ausschliesslich `projectedUnbankedScore`. Erst eine transaktionale Einzahlung erhöht `confirmedScore`. Beide Werte werden in Domain, API und UI getrennt beschriftet und niemals still addiert.  
**Status:** final.

## D-052 – Gigalodon-Verlust und Unique-Evidenz

**Entscheidung:** Ressourcenverlust wird als explizit beobachtete Mutation protokolliert. Ob Unique-Bossressourcen betroffen sind, wird separat als live bestätigt oder unbestätigt gespeichert; unbestätigtes Sonderverhalten darf keine automatische irreversible Annahme auslösen.  
**Status:** final.

## D-053 – Gigalodon-Rätselvalidierung

**Entscheidung:** Das Luminarium verwendet eine serverseitig validierte 4×4-Boolean-Matrix. Ein eigener Solver ist nicht Bestandteil von Phase 8. Die Exécrabe-Sequenz verlangt vier unterschiedliche Erscheinungen und `SECOND_PERSON`, bevor sie an das Statuenrätsel übertragen wird.  
**Status:** final.

## D-054 – Gigalodon-Finalstartcheck

**Entscheidung:** Finalbereitschaft unterscheidet `blockiert`, `unbestätigt` und `bereit`. Aktive Kämpfe sind erst nach Live-Evidenz ein bewiesenes hartes Gate; bis dahin erscheinen sie als mögliche Startblockade, die der Captain bewusst beurteilt.  
**Status:** final.

## D-055 – Gigalodon-Finalzustand und Bonusscore

**Entscheidung:** Finalvorbereitung und aktiver Finalkampf sind eigene Sessionzustände. Der Bonusscore wird ausschliesslich aus den versionierten Schadensschwellen der Raiddefinition abgeleitet. Der Gesamtscore besteht aus bestätigtem Ressourcenscore plus fixiertem Finalbonus.  
**Status:** final.

## D-056 – Phase-8-Gate

**Entscheidung:** Phase 8 gilt für den implementierten Software- und Simulationsscope als abgeschlossen. 26 Tests, 44/44 Gigalodon-Tasks, 153/153 Revisionen und Events, 12/12 konvergierte Clients, eine vollständige Sanctuaire-Regression, zehn Reliability-Läufe, sechs Browser-E2E-Szenarien und der Produktionsbuild waren erfolgreich. Der echte DOFUS-Live-Test bleibt ein separates Fachgate.  
**Status:** final.


## D-057 – Visual Authenticity vor Wow Layer

**Entscheidung:** Der visuelle Authenticity-Umbau wird vor Phase 9 implementiert. Die Wow-Funktionen dürfen nicht auf der aktuellen gleichförmigen Dashboardstruktur aufgebaut werden.  
**Status:** final.

## D-058 – Field-built Raid Desk

**Entscheidung:** Die verbindliche visuelle Richtung lautet `Field-built Raid Desk`: Route, Übergabe, Verantwortung und Entscheidung stehen vor Cards und Metriken.  
**Status:** final.

## D-059 – Kontrollierte Unregelmässigkeit

**Entscheidung:** Asymmetrie, unterschiedliche Modulhöhen, einzelne versetzte Notizen und materialabhängige Kanten sind erlaubt. Navigation, Hitboxes, Fokus und Informationshierarchie bleiben strikt konsistent.  
**Status:** final.

## D-060 – Typografie v0.8.5

**Entscheidung:** Zieltypografie ist `Gillius ADF No2` für Marke/Display, `Andika` für UI, `Go Mono` für Telemetrie und `EB Garamond SC` nur als punktueller redaktioneller Akzent. Comfortaa/Cabin/Cousine werden in der Produktoberfläche ersetzt.  
**Status:** final für den Visual-Authenticity-Pass.

## D-061 – Material statt universeller Cards

**Entscheidung:** Unterschiedliche Informationsarten verwenden `sheet`, `plate`, `note`, `strap`, `manifest`, `route` und `stamp`. Kein Kernscreen darf mehr als drei direkt benachbarte gleichartig gerahmte Cards enthalten.  
**Status:** final.

## D-062 – Referenzscreens v0.8.5

**Entscheidung:** Die fünf Dateien unter `reference-authenticity/` sind die neue visuelle Implementierungsbaseline. Sie sind keine Pixelvorgabe, aber Komposition, Informationsgewicht, Materiallogik und Card-Reduktion sind verbindlich.  
**Status:** final.

## D-063 – Phase-8.5-Grenze

**Entscheidung:** Phase 8.5A liefert Audit, Art Direction, Tokens, Screenreferenzen und Codex-Plan. Der Produktcode bleibt funktional v0.8.0, bis Codex Phase 8.5B implementiert und als v0.8.6 regressionsgeprüft übergibt.  
**Status:** final.

## D-064 – Dokumentationszwischenversion v0.8.5.1

**Entscheidung:** Phase 9A wird als dokumentationsbezogene Zwischenversion v0.8.5.1 versioniert. Die für Phase 8.5B reservierte Implementierungszielversion v0.8.6 bleibt unverändert.  
**Status:** final.

## D-065 – Wow Layer als Read-/Presentation-Layer

**Entscheidung:** Live Map, Smart Next Action, Risk Engine, kritischer Pfad und Replay werden deterministisch aus bestehenden Definitionen, Snapshot, Serverzeit, Actor und Eventhistorie abgeleitet. Sie persistieren keine zweite Wahrheit und führen keine automatischen Domainmutationen aus.  
**Status:** final.

## D-066 – Struktureller statt zeitbasierter kritischer Pfad

**Entscheidung:** Solange keine belastbaren Aufgabendauern existieren, zeigt RAIDWEAVE ausschliesslich einen `Chemin critique structurel`. Exakte Restdauer, CPM und Erfolgswahrscheinlichkeit dürfen nicht erfunden werden.  
**Status:** final.

## D-067 – Smart Next Action ist regelbasiert und erklärbar

**Entscheidung:** Empfehlungen entstehen aus dokumentierten Kandidaten, Punkten, Risikomodifiern, Rechten und Tie-Breakern. Jede Empfehlung nennt einen konkreten Grund und öffnet nur bestehende Commandflows. Keine generative KI und keine automatische Ausführung.  
**Status:** final.

## D-068 – Risiko und Datenvertrauen bleiben getrennt

**Entscheidung:** `CONFIRMED`, `DERIVED`, `LIVE_REQUIRED`, `STALE` und `PARTIAL` beschreiben die Belastbarkeit einer Aussage und sind keine Risikostufen. Eine unbestätigte Spielregel darf ohne Evidenz kein rotes hartes Gate erzeugen.  
**Status:** final.

## D-069 – Keine behauptete In-Game-Ortung

**Entscheidung:** Teamzuweisung und gemeldete Gigalodon-Etage werden als Workflow- beziehungsweise gemeldete Position bezeichnet. RAIDWEAVE behauptet keine automatische oder aktuelle In-Game-Ortung.  
**Status:** final.

## D-070 – Replay benötigt lückenlose Events

**Entscheidung:** Vollständige Replay-Kennzahlen sind nur bei lückenloser Eventfolge von Revision 1 bis zur Sessionrevision zulässig. Andernfalls erscheint `Résumé partiel` und unsichere Kennzahlen entfallen.  
**Status:** final.

## D-071 – Additive Replay-Pagination

**Entscheidung:** Falls mehr als die im Snapshot enthaltenen Events benötigt werden, darf ein neuer read-only Cursor-Endpunkt mit unverändertem `EventRecord` ergänzt werden. Bestehende Endpunkte, Payloads, Tabellen und Mutationsverträge bleiben unverändert.  
**Status:** final für die spätere Phase 9B.

## D-072 – Sounds sind lokales Opt-in

**Entscheidung:** Sounds sind pro Gerät standardmässig aus, benötigen eine Nutzergeste, werden nicht in der Session persistiert und ertönen nur für neue kritische oder persönliche handlungsrelevante Übergänge. Dedupe und Cooldown sind verbindlich.  
**Status:** final.

## D-073 – Motion muss Information transportieren

**Entscheidung:** Animationen sind nur für Gateöffnung, bestätigten Transfer, Missionwechsel, Einzahlung, Lichtwechsel und einmalige Risikoankunft erlaubt. Dauerpulsieren und dekorative Partikel bleiben verboten; Reduced Motion darf keine Information verlieren.  
**Status:** final.

## D-074 – Replay ohne Personenranking

**Entscheidung:** Replay zeigt Ablauf, Engpässe, Gateöffnungen und bestätigte Beiträge, aber keine individuellen Leistungsnoten, Schuldzuweisungen oder nicht autoritativ erfassten Rankings.  
**Status:** final.

## D-075 – Reihenfolge Phase 8.5B vor Phase 9B

**Entscheidung:** Phase 9A darf vorab spezifiziert werden. Die technische Phase 9B bleibt jedoch gesperrt, bis Phase 8.5B als v0.8.6 visuell und technisch regressionssicher abgeschlossen ist. Beide Coding-Scopes werden nicht vermischt.  
**Status:** final.

## D-076 – Phase 8.5B bleibt eine Präsentationsschicht

**Entscheidung:** Die neue Visual-Art-Direction wird ausschliesslich in App-Seiten, UI-Komponenten, Styles, Assets und Browserprüfungen umgesetzt. Domain-, Server-, API-, Command-, Realtime-, Persistenz- und Raiddefinitionsverträge bleiben unverändert.  
**Status:** final und in v0.8.6 umgesetzt.

## D-077 – Schriften werden lokal und lizenzbelegt ausgeliefert

**Entscheidung:** Display-, Text- und Monospace-Schriften liegen lokal unter `platform/public/fonts/`; ihre Lizenzen werden gemeinsam mit den Fontdateien versioniert. Die Produktoberfläche benötigt dafür keinen externen Fontdienst.  
**Status:** final und in v0.8.6 umgesetzt.

## D-078 – Französische Microcopy ist eine Präsentationslokalisierung

**Entscheidung:** Deutsche Laufzeittexte aus bestehenden Definitionen oder Ableitungen werden in den neuen Kernansichten durch eine französische Präsentationsschicht ersetzt. IDs, State, Commands, Definitionen und Semantik werden nicht verändert.  
**Status:** final und in v0.8.6 umgesetzt.

## D-079 – Visuelle Abnahme ist automatisiert und evidenzbasiert

**Entscheidung:** Die fünf verbindlichen Screenshots, Zielbreiten 390/768/1440/1920, horizontales Overflow, mobile Primäraktion, Materialstruktur, Axe-A11y, Fokus und Reduced Motion werden durch `visual-authenticity.spec.ts` geprüft.  
**Status:** final und grün.

## D-080 – Phase 9B bleibt ein eigener Coding-Scope

**Entscheidung:** Der Abschluss von v0.8.6 hebt nur das vorgelagerte Gate auf. Live Raid Map, Smart Next Action, Risk Engine, struktureller kritischer Pfad, Replay, Sounds und neue Wow-Layer-Motion wurden in Phase 8.5B nicht implementiert.  
**Status:** final.

## D-081 – Salz ist eine gemeinsame Gigalodon-Raidressource

**Entscheidung:** `Sel des profondeurs` lebt ausschliesslich im serverautoritativen gemeinsamen Pool. Persönliche Inventare weisen Salz zurück. Sammlung, Korrektur und Auffüllverbrauch werden atomar mit Actor, Zeitpunkt, Ursache, Vorher-/Nachher-Wert und Verantwortlichem protokolliert; Salz erzeugt 0 Scorepunkte.  
**Status:** final ab Definition 0.2.1.

## D-082 – Lichtbaseline bleibt guidebasiert sichtbar

**Entscheidung:** Etage −1 startet bei Freigabe mit 4, Etagen −2 bis −5 mit 1. Verfall beginnt serverzeitbasiert bei Freischaltung; 120 Sekunden und Schritte 1/3/6/10 sind `GUIDE_CONFIRMED`, bis ein RAIDWEAVE-Live-Test sie auf `LIVE_CONFIRMED` hebt.  
**Status:** final für die Softwarebaseline, Live-Evidenz offen.

## D-083 – Ein Finalversuch besitzt ein explizites Ergebnis

**Entscheidung:** `VICTORY` und `DEFEAT` beenden beide den einzigen Gigalodon-Finalversuch. Danach ist jeder zweite Start gesperrt. Raidabschluss ist nach beiden Ergebnissen möglich; Ergebnis, Runden, Schaden und Scorebestandteile werden getrennt persistiert.  
**Status:** final.

## D-084 – Sanctuaire-Korridorbaseline ist 60

**Entscheidung:** Der Guide-Detailabschnitt 10 Räume × 6 Monster gilt als konfigurierbarer Standard 60. Die frühere 80-Vermischung wird entfernt. Quellenstatus ist `GUIDE_CONFIRMED`; eigener Live-Test bleibt ausstehend.  
**Status:** final für Definition 0.2.1.

## D-085 – Einheitliche Vertrauenssemantik

**Entscheidung:** Fachliche Evidenz verwendet `OFFICIAL_CONFIRMED`, `GUIDE_CONFIRMED`, `LIVE_CONFIRMED`, `LIVE_REQUIRED` und `PLAYER_CORRECTED`. Vertrauen ist keine Risikostufe. `PRODUCT_RULE` bleibt nur die Kennzeichnung interner Orchestrierungsregeln. `PLAYER_CORRECTED` erfordert Actor, Zeit und Notiz.  
**Status:** final.

## D-086 – Pilotabweichungen ändern keine Definition automatisch

**Entscheidung:** Teilnehmer dürfen `Information incorrecte` melden. Captain oder Editor darf die Meldung als `PLAYER_CORRECTED` bestätigen. Beides erzeugt je genau eine Revision und ein Event; die versionierte Raiddefinition bleibt unverändert, bis eine separate redaktionelle Migration erfolgt.  
**Status:** final.

## D-087 – Unbelegte Regeln und Positionen bleiben weich beziehungsweise unbekannt

**Entscheidung:** Nicht live bestätigte Startbedingungen, Gruppenzahl, Unique-Verlust, Fragmentgrenzen, Timer-, Disconnect-, Captain- und Gastrechte sind konkrete Soft Warnings. Unbelegte Kartenpositionen bleiben `null`/offen. Weder Warnung noch UI darf Gewissheit erfinden oder irreversibel mutieren.  
**Status:** final.
