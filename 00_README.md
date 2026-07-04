# RAIDWEAVE – DOFUS Raid Command Center

**Arbeitsname bis Phase 3:** Raid Command Center  
**Öffentlicher Produktname:** RAIDWEAVE  
**Projektversion:** v0.8.6.1  
**Stand:** 28.06.2026  
**Status:** Phase 8.6.1 Raid Truth Reconciliation & Pilot Hardening abgeschlossen; Phase 9B bleibt ein separater, nicht implementierter Scope.  
**Scope:** ausschliesslich DOFUS 3 auf PC, zunächst die beiden Gildenraids aus Update 3.6.

## Produkt in einem Satz

Eine browserbasierte Live-Kommandozentrale, über die 8–16 Raidteilnehmer ohne Konto per Link zusammenarbeiten, Aufgaben verteilen, Zustände synchronisieren und jederzeit sehen, was als Nächstes getan werden muss.

## Das eigentliche Problem

Die Raids erzeugen gleichzeitig parallele Aufgaben, Abhängigkeiten, wechselnde Verantwortlichkeiten, Zeitdruck, gemeinsame Zustände und Informationen, die zwischen Teilgruppen weitergegeben werden müssen.

Discord-Voice löst Kommunikation, aber nicht den Überblick. Ein Guide erklärt Mechaniken, steuert aber keinen Live-Durchgang. Ein Raidplaner organisiert den Termin, aber nicht die operative Durchführung.

## Unser Unterschied

RAIDWEAVE ist **kein Guide, kein Kalender und keine statische Checkliste**. Es ist ein zustandsbasiertes Live-System mit:

1. Captain-Ansicht für den Gesamtüberblick;
2. persönlicher Spieleransicht „Was muss ich jetzt tun?“;
3. Echtzeitsynchronisation ohne Konto;
4. automatischer Weitergabe von Rätselergebnissen;
5. raid-spezifischen Timern, Ressourcen- und Risikozuständen;
6. Ereignisprotokoll und Rückgängig-Funktion;
7. visueller Raidkarte statt langer Textlisten;
8. eigenständiger Premium-Identität mit zwei klar getrennten Raidwelten.

## Ordnerinhalt

### Produkt- und Fachspezifikation

| Datei | Zweck |
|---|---|
| `01_PRODUCT_SPEC.md` | verbindliche Produktdefinition |
| `02_RAID_SOURCE_OF_TRUTH.md` | fachliche Raidgrundlage |
| `03_USER_FLOWS.md` | Nutzerabläufe |
| `04_FEATURE_MATRIX.md` | Funktionen, Prioritäten und Abnahmekriterien |
| `05_UI_ARCHITECTURE.md` | Seiten, Komponenten und UX |
| `06_DATA_AND_REALTIME_MODEL.md` | Zustände, Berechtigungen und Synchronisation |
| `07_ROADMAP.md` | Projektphasen |
| `08_RESEARCH_AND_OPEN_QUESTIONS.md` | Quellen, Unsicherheiten, Live-Tests |

### Projektsteuerung

| Datei | Zweck |
|---|---|
| `CURRENT_STATUS.md` | aktueller Projektstand |
| `DECISIONS.md` | getroffene Entscheidungen |
| `NEXT_STEP.md` | genau der nächste Arbeitsschritt |
| `CHANGELOG.md` | Änderungen an der Spezifikation |
| `CODEX_BACKLOG.md` | abgegrenzte Implementierungsaufgaben |

### Phase 2 und 3

| Datei | Zweck |
|---|---|
| `SANCTUAIRE_TASK_GRAPH.md` | vollständige Aufgaben- und Abhängigkeitslogik |
| `GIGALODON_TASK_GRAPH.md` | vollständige Aufgaben- und Abhängigkeitslogik |
| `LIVE_TEST_CHECKLIST.md` | beweisbare In-Game-Verifikation |
| `raid-definition.schema.json` | Definitionsschema |
| `sanctuaire.v0.2.json` | maschinenlesbare Sanctuaire-Definition |
| `gigalodon.v0.2.json` | maschinenlesbare Gigalodon-Definition |
| `SCREEN_INVENTORY.md` | vollständiges Screen- und Zustandsinventar |
| `WIREFRAMES.md` | Low-Fidelity-Wireframes |
| `PHASE3_VALIDATION_REPORT.md` | Phase-3-Prüfung |

### Phase 4

| Datei | Zweck |
|---|---|
| `BRAND_DIRECTION.md` | Name, Positionierung, Logo- und Sprachrichtung |
| `DESIGN_SYSTEM.md` | Farben, Typografie, Abstände, Semantik, Motion und Accessibility |
| `design-tokens.v0.4.json` | maschinenlesbare Design-Tokens |
| `COMPONENT_VISUAL_SPECS.md` | visuelle Komponentenverträge |
| `SANCTUAIRE_REFERENCE_SCREENS.md` | Sanctuaire-Theme und Referenzbeschreibung |
| `GIGALODON_REFERENCE_SCREENS.md` | Gigalodon-Theme und Referenzbeschreibung |
| `PHASE4_VALIDATION_REPORT.md` | Integritäts-, Kontrast- und Abdeckungsprüfung |
| `reference/*.html` | statische High-Fidelity-Referenzquellen |
| `reference/*.png` | gerenderte Referenzansichten |


### Phase 5

| Datei | Zweck |
|---|---|
| `TECH_SPIKE_PLAN.md` | messbare Spike-Anforderungen und Testmatrix |
| `SPIKE_ARCHITECTURE_DECISION.md` | bestätigte Plattform- und Realtime-Architektur |
| `REALTIME_TEST_REPORT.md` | Belastungs-, Konflikt-, Timer- und Recovery-Ergebnisse |
| `SPIKE_RUNBOOK.md` | Start-, Test- und Diagnoseanleitung |
| `spike/` | ausführbarer TypeScript-Prototyp, Tests und Messartefakte |

### Phase 6

| Datei | Zweck |
|---|---|
| `PLATFORM_CORE_ARCHITECTURE.md` | implementierte Plattform-, Datenbank-, Realtime- und Sicherheitsarchitektur |
| `PHASE6_TEST_REPORT.md` | Typecheck-, Build-, Integrations-, Reliability- und Browserprüfung |
| `platform/README.md` | Start-, Test- und Betriebsanleitung |
| `platform/` | produktnaher Next.js-/TypeScript-Plattformkern |
| `platform/artifacts/platform-reliability.json` | zehn wiederholte 16-Client-Läufe |
| `platform/artifacts/npm-audit.json` | Sicherheitsprüfung der Node-Abhängigkeiten |

### Phase 7

| Datei | Zweck |
|---|---|
| `SANCTUAIRE_IMPLEMENTATION_ARCHITECTURE.md` | implementierte Sanctuaire-Domain-, Transfer- und UI-Architektur |
| `PHASE7_TEST_REPORT.md` | Unit-, Simulations-, Reliability- und Browserprüfung |
| `platform/src/core/sanctuaire.ts` | Resultat-, Bestätigungs- und Transferhelfer |
| `platform/components/SanctuaireCommandCenter.tsx` | raid-spezifische Captain-Primäransicht |
| `platform/scripts/sanctuaire-simulation.ts` | vollständiger simulierter 16-Client-Raid |
| `platform/artifacts/sanctuaire-simulation.json` | maschinenlesbares End-to-End-Ergebnis |

### Phase 8

| Datei | Zweck |
|---|---|
| `GIGALODON_IMPLEMENTATION_ARCHITECTURE.md` | implementierte Etagen-, Licht-, Ledger-, Finalcheck- und Finalkampfarchitektur |
| `PHASE8_TEST_REPORT.md` | Unit-, Simulations-, Reliability-, Security- und Browserprüfung |
| `platform/src/core/gigalodon.ts` | Gigalodon-State-, Score-, Licht- und Readiness-Helfer |
| `platform/components/GigalodonCommandCenter.tsx` | raid-spezifische Captain- und Teilnehmeransichten |
| `platform/scripts/gigalodon-simulation.ts` | vollständiger simulierter 12-Client-Raid |
| `platform/artifacts/gigalodon-simulation.json` | maschinenlesbares End-to-End-Ergebnis |


### Phase 8.5A

| Datei | Zweck |
|---|---|
| `VISUAL_AUTHENTICITY_AUDIT.md` | Audit der tatsächlich implementierten Oberfläche |
| `VISUAL_ART_DIRECTION_V2.md` | neue visuelle Richtung und Materiallogik |
| `SCREEN_REDESIGN_SPECS.md` | verbindlicher Neuaufbau der fünf Kernansichten |
| `CODEX_VISUAL_IMPLEMENTATION_PLAN.md` | datei- und komponentengenaue Codex-Übergabe |
| `PHASE8_5_VALIDATION_REPORT.md` | Abdeckung und Konsistenzprüfung |
| `design-tokens.v0.8.5.json` | neue Implementierungstokens |
| `reference-authenticity/` | fünf editierbare HTML- und PNG-Referenzen |

### Phase 8.5B

| Datei | Zweck |
|---|---|
| `PHASE8_5B_IMPLEMENTATION_AND_TEST_REPORT.md` | vollständiger Implementierungs-, Vertrags- und Testnachweis |
| `platform/styles/authenticity.css` | globale Token-, Typografie-, Material- und Accessibility-Basis |
| `platform/styles/raid-themes.css` | raid-spezifische Sanctuaire- und Gigalodon-Themes |
| `platform/styles/components.css` | responsive Komponenten- und Screenlayouts |
| `platform/e2e/visual-authenticity.spec.ts` | Zielgrössen-, Screenshot-, A11y- und Reduced-Motion-Abnahme |
| `platform/artifacts/phase8-5b-screens/` | fünf verbindliche v0.8.6-Abnahmescreenshots |

### Phase 8.6.1

| Datei | Zweck |
|---|---|
| `PHASE8_6_1_RAID_TRUTH_AND_PILOT_HARDENING_REPORT.md` | vollständiger Korrektur-, Migrations- und Testnachweis |
| `platform/src/server/db/migrations/0004_phase8_6_1_reconciliation.sql` | additive Datenmigrationsregistrierung |
| `platform/components/gigalodon/SharedSaltPool.tsx` | gemeinsamer Salzpool, Historie, Kosten und Verantwortliche |
| `platform/e2e/phase8-6-1.spec.ts` | Phase-8.6.1-Abnahme auf Desktop und Mobile |

Kernkorrekturen: globaler Gigalodon-Salzpool, Licht-Guide-Baseline, finales `VICTORY`/`DEFEAT`, Sanctuaire-Ziel 60, vereinheitlichte Vertrauensstatus, Soft Warnings und `Information incorrecte`.


### Phase 9A

| Datei | Zweck |
|---|---|
| `WOW_LAYER_SPECIFICATION.md` | vollständiger Codex-Vertrag für Map, Next Action, Risiko, kritischen Pfad, Replay, Sound und Motion |
| `PHASE9A_VALIDATION_REPORT.md` | Abdeckungs-, Vertrags- und Konsistenzprüfung |

Phase 9A verändert keinen Produktcode. Phase 8.5B ist regressionssicher abgeschlossen; die technische Wow-Layer-Implementierung bleibt trotzdem ein separat freizugebender Scope.

## Arbeitsprinzip

Der versionierte ZIP-Ordner ist das vollständige technische Archiv. Für ChatGPT-Projektquellen wird ausschliesslich die konsolidierte Master-Datei hochgeladen.

Nach jeder abgeschlossenen Phase werden gemeinsam erzeugt:

1. `DOFUS_RCC_PROJECT_MASTER_vA.B.C[.D].md`;
2. `DOFUS_Raid_Command_Center_Spec_vA.B.C[.D].zip`.

Textquellen werden vollständig in die Master-Datei eingebettet. Binäre PNG-Vorschauen werden im Integritätsmanifest aufgeführt, bleiben aber als abgeleitete Vorschauen im ZIP; die zugehörigen HTML- und Markdown-Quellen sind im Master enthalten.
