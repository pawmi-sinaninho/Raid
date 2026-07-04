# Visual Authenticity Audit

**Projektversion:** v0.8.5  
**Phase:** 8.5A – Visual Authenticity & Human Design Pass  
**Auditbasis:** tatsächlich implementierte v0.8.0-Oberfläche, bestehende Phase-4-Referenzen und Quellcode  
**Ergebnis:** Designrichtung ist fachlich brauchbar, wirkt in der Umsetzung jedoch zu stark wie ein gleichmässig generiertes Dark-Dashboard. Ein gezielter visueller Neuaufbau ist nötig; Fachlogik und Datenverträge bleiben unverändert.

## 1. Geprüfte Ist-Artefakte

### Implementierte Screens

- `platform/artifacts/phase7-screens/sanctuaire-captain-1440x900.png`
- `platform/artifacts/phase7-screens/sanctuaire-participant-390x844.png`
- `platform/artifacts/phase8-screens/gigalodon-captain-1440x900.png`
- `platform/artifacts/phase8-screens/gigalodon-participant-390x844.png`
- `platform/artifacts/phase8-screens/gigalodon-participant-raid-390x844.png`

### Implementierungsquellen

- `platform/app/page.tsx`
- `platform/app/globals.css`
- `platform/components/CreateSessionForm.tsx`
- `platform/components/JoinForm.tsx`
- `platform/components/SessionApp.tsx`
- `platform/components/SanctuaireCommandCenter.tsx`
- `platform/components/GigalodonCommandCenter.tsx`

### Frühere Designbasis

- `BRAND_DIRECTION.md`
- `DESIGN_SYSTEM.md`
- `COMPONENT_VISUAL_SPECS.md`
- `reference/*.html`
- `reference/*.png`

## 2. Gesamturteil

Die Oberfläche ist **funktional lesbar und konsistent**, aber visuell zu gleichförmig. Die aktuelle Implementierung übersetzt fast jede Information in dieselbe Kombination aus:

- dunkler rechteckiger Fläche;
- dünner Kontur;
- leicht abgerundeter beziehungsweise geschnittener Ecke;
- kleinem Versal-Label;
- gleichmässigem Grid;
- Akzentfarbe am Rand;
- wiederholtem Card- oder Metric-Muster.

Das erzeugt Ordnung, aber keine glaubwürdige Welt. Die Screens wirken deshalb eher wie ein technisch korrektes SaaS-Dashboard mit Raid-Vokabular als wie ein Werkzeug, das von Raidspielern für einen echten laufenden Einsatz gebaut wurde.

## 3. Elemente mit erkennbarem KI-Template-Eindruck

| Befund | Konkrete Stelle | Warum problematisch | Priorität |
|---|---|---|---:|
| Hero nach Standardmuster | Landing: Claim links, Formular rechts, zwei Benefit-Cards | häufige generische Landingpage-Komposition ohne eigene Produktdramaturgie | kritisch |
| Gleichartige Cards überall | `.panel`, `.card`, `.task-card`, `.giga-metric`, `.unique-card`, `.readiness-group` | unterschiedliche Bedeutungen erhalten dieselbe visuelle Grammatik | kritisch |
| Zu perfekte Symmetrie | 2×2-Puzzlegrids, fünf identische Metriken, drei gleich grosse Readiness-Spalten | wirkt automatisch zusammengesetzt statt redaktionell priorisiert | hoch |
| Pill- und Badge-Routine | `.phase-pill`, `.mission-context`, Statuslabels | kleine dekorative UI-Chips ersetzen räumliche oder operative Darstellung | mittel |
| Komfortable, aber charakterlose Typografie | Comfortaa/Cabin/Cousine in fast allen Ebenen | Comfortaa erzeugt schnell einen freundlichen App-Template-Eindruck; die Hierarchie bleibt zu weich | hoch |
| Gradient + Glow als Atmosphäre | globale Radialverläufe, aktive Ringe, Licht-Glows | visuelle Stimmung wird über Effekte statt Material, Illustration und Komposition erzeugt | mittel |
| Einheitliche Abstände und Radien | fast alle Module 10–14 px Radius, 12–24 px Padding | keine sichtbare Hand, keine unterschiedliche Wertigkeit, kein rhythmischer Bruch | hoch |
| Generische Icon-Ersatzformen | gedrehte Quadrate, Punkte, einfache Statusrauten | sauber, aber nicht eigenständig; keine Raid- oder Markenherkunft erkennbar | hoch |
| Metriken als Startpunkt | Captain-Screens beginnen mit Kennzahlenblöcken | der operative Zustand wird zur Dashboard-Auswertung statt zur laufenden Mission | kritisch |
| Leere Flächen in grossen Karten | insbesondere gesperrte Module | wirken wie automatisch erzeugte Platzhalter, nicht wie bewusst gestaltete Zustände | mittel |

## 4. Wo die Oberfläche zu glatt, symmetrisch oder generisch ist

### Landingpage

Die Landingpage erklärt das Produkt korrekt, aber die Komposition ist austauschbar. Zwei gleichartige Benefit-Cards und ein klassisches Formularpanel ergeben keinen visuellen Beweis dafür, dass RAIDWEAVE ein Live-Raidwerkzeug ist. Die Raidwelten tauchen erst nach Auswahl auf, statt bereits den ersten Eindruck zu prägen.

### Session-Lobby

Die Lobby ist als dreispaltiger Administrationsscreen aufgebaut. Teilnehmer, Teams und Startcheck stehen nebeneinander wie Datenpflegebereiche. Es fehlt die Wahrnehmung eines Briefings: Wer geht wohin, welche Position ist noch offen, und was verhindert den Abmarsch?

### Sanctuaire Captain

Die Phasenleiste oben vermittelt nur Zähler. Darunter folgen vier gleich grosse Rätselkarten und vier gleich grosse Wächterkarten. Die botanisch-königliche Welt bleibt im Wesentlichen auf Grün und Labels reduziert. Der Captain sieht viele Module, aber keinen lebendigen Gartenpfad, auf dem Resultate tatsächlich weiterwandern.

### Gigalodon Captain

Der vertikale Etagenrail ist die stärkste raid-spezifische Idee der aktuellen Umsetzung. Er wird jedoch von fünf gleichartigen Metrik-Karten, fünf gleichartigen Lichtkarten, vier Unique-Karten und drei Readiness-Karten umgeben. Dadurch verliert die Expedition ihre Tiefendramaturgie und wird erneut zum Dashboard.

### Teilnehmer Mobile

Die Kernpriorität „eine Mission“ ist richtig. Dennoch besteht die Ansicht aus einer grossen Card plus mehreren kleineren Cards. Die Mission wirkt wie ein Aufgabenobjekt in einer App, nicht wie ein konkreter Einsatzbefehl. Ort, Team, Risiko und nächste Bewegung sind zu wenig räumlich miteinander verbunden.

## 5. Wo die Oberfläche wie ein Dashboard statt wie ein Raidwerkzeug wirkt

Ein echtes Raidwerkzeug muss primär vier Fragen beantworten:

1. **Wo stehen wir im Raid?**
2. **Was blockiert den nächsten gemeinsamen Schritt?**
3. **Wer muss jetzt handeln?**
4. **Welche Information oder Ressource muss weitergegeben werden?**

Die aktuelle UI beantwortet diese Fragen erst nach dem Scannen mehrerer Panels. Sie priorisiert stattdessen:

- vollständige Kennzahlensicht;
- modulare Gleichbehandlung;
- universelle Card-Wiederverwendung;
- technische Zustandsabdeckung.

Das ist für die Implementierung sicher, aber für den Live-Einsatz zu indirekt. Die neue Gestaltung muss **Route, Übergabe, Verantwortung und Entscheidung** zur primären Form machen.

## 6. Was bereits stark ist und erhalten bleiben muss

- klare Trennung von bestätigtem und ungesichertem Score;
- sichtbare `LIVE_REQUIRED`-Kennzeichnung;
- semantisch konsistente Risiko- und Taskzustände;
- eine dominante Teilnehmermission;
- vertikale Gigalodon-Etagenlogik;
- getrennte Sanctuaire-Rätsel-, Wächter-, Korridor- und Finalphasen;
- Captain Radar als Ausnahmeansicht;
- mobile Bedienbarkeit ohne horizontales Kernscrolling;
- bestehende Fokus-, Kontrast- und Reconnect-Anforderungen.

## 7. Ziel des Redesigns

Die Oberfläche soll nach dem Umbau wirken wie:

> **ein von erfahrenen Raidspielern gebauter Einsatz- und Kartentisch, nicht wie ein generiertes Produktdashboard.**

Erkennbar wird das durch:

- räumliche Routen statt Metrikreihen;
- unterschiedlich gebaute Informationsformen statt universeller Cards;
- asymmetrische, aber kontrollierte Komposition;
- typografische Hierarchie mit eigener Stimme;
- menschliche Einsatzsprache;
- eigenständige Raidmaterialien und SVG-Illustrationen;
- sichtbare Übergaben zwischen Personen, Aufgaben und Phasen.

## 8. Verbindliche Auditfolgerung

Phase 9 darf nicht auf der aktuellen visuellen Grundstruktur aufbauen. Zuerst wird der in v0.8.5 spezifizierte Visual-Authenticity-Umbau implementiert und visuell regressionsgeprüft. Die funktionalen Phase-6-bis-8-Verträge werden dabei nicht neu entwickelt.
