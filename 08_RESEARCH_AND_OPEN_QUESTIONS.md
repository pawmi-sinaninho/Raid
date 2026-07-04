# Research and Open Questions

**Stand:** 28.06.2026, v0.8.6.1.

## 1. Verwendete Kernquellen

### Offizielle Quellen

- Ankama Devblog: „MAJ 3.6 – Les Raids de guilde“  
  https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1769268-maj-3-6-raids-guilde
- Ankama Update 3.6: „Raid is not dead“  
  https://www.dofus.com/fr/mmorpg/actualites/maj/1770516-raid-not-dead
- Ankama Detail-/Patchbereich 3.6  
  https://www.dofus.com/fr/mmorpg/actualites/maj/1770574-raid-not-dead/details

### Community-Guides

- DofusPourLesNoobs: Sanctuaire des Jardins éternels  
  https://www.dofuspourlesnoobs.com/sanctuaire-des-jardins-eternels.html
- DofusPourLesNoobs: Gouffre du Gigalodon  
  https://www.dofuspourlesnoobs.com/gouffre-du-gigalodon.html
- DofusPourLesNoobs: kollaboratives Rätseltracking  
  https://www.dofuspourlesnoobs.com/suivi-des-enigmes-du-raid-des-jardins-eternels.html
- DofusPourLesNoobs: Luminarium-Solver  
  https://www.dofuspourlesnoobs.com/solveur-du-luminarium.html

## 2. Reconciled Guide-Baselines

| Regel | Baseline | Status |
|---|---|---|
| Sanctuaire-Korridor | 10 Räume × 6 Monster = 60 | `GUIDE_CONFIRMED`, nicht RAIDWEAVE-live bestätigt |
| erstes Gigalodon-Licht | Stufe 4 | `GUIDE_CONFIRMED`, nicht RAIDWEAVE-live bestätigt |
| neu freigeschaltete tiefere Etage | Stufe 1, Verfall ab Freischaltung | `GUIDE_CONFIRMED`, nicht RAIDWEAVE-live bestätigt |
| Lichtintervall | 120 Sekunden | `GUIDE_CONFIRMED`, nicht RAIDWEAVE-live bestätigt |
| Lichtkosten | inkrementell 1/3/6/10 | `GUIDE_CONFIRMED`, nicht RAIDWEAVE-live bestätigt |
| Gigalodon-Salz | gemeinsamer Raidpool, 0 Score | fachlich korrigiert in v0.8.6.1 |

## 3. Kartenpositionsaudit

Eindeutig dokumentiert sind unter anderem die Luminomachinen und Salzvorkommen auf −1, −3 und −5, zwei Luminomachinen sowie Mureine-/Aufzugzugang auf −2, der Luminariumzugang auf −3, die Abkürzung `[6,10] → [4,7]` sowie Käfig und Autopilot auf −5. Nicht eindeutig belegt sind weitere Salz-, Boss-, Fragment-, Übergabe- und Zugangswerte, insbesondere auf −4 und −6. Diese bleiben ohne Schätzung offen.

## 4. Kritische offene Live-Fragen

| Frage | Produktverhalten bis zur Bestätigung | Test |
|---|---|---|
| Kann Gigalodon bei laufenden Kämpfen gestartet werden? | konkrete Soft Warning; Captain darf fortfahren | kontrollierter Live-Test |
| 18 oder 20 relevante Gruppen auf −1? | sichtbarer `LIVE_REQUIRED`-Hinweis | vollständige Kartenzählung |
| Welche Unique-Ressourcen gehen bei Niederlage verloren? | keine automatische irreversible Löschung | risikoarmer Live-Test |
| Exakte Fragmentgrenzen/Inklusion | konfigurierbar, sichtbar unbestätigt | Scoregrenzen beobachten |
| Timerablauf vor/während Finale | warnen, nicht erfinden | kontrollierter Ablauf |
| Disconnect in Kampf/Rätsel/Übergabe | Recovery erhalten, Sonderregel offen | absichtlicher Disconnect |
| Captainwechsel im laufenden Raid | Plattformrechte unverändert; Spielverhalten offen | Live-Test |
| Rechte externer Teilnehmer | Plattformrollen unverändert; Spielverhalten offen | Gasttest |
| Licht- und Korridor-Baselines im aktuellen Client | Guide-Baseline sichtbar | Messung mit Evidenz |

## 5. Pilotkorrekturen

`Information incorrecte` speichert referenzierte Regel/Anzeige, Textnotiz, Actor und Serverzeit. Teilnehmer dürfen melden; nur Captain oder Editor bestätigt mit Notiz als `PLAYER_CORRECTED`. Die Definition wird nicht automatisch geändert. Übernahme in eine spätere Definitionsversion benötigt separate fachliche Prüfung.

## 6. Benötigte Live-Testdaten

- Datum, Spielversion, Server und Raid;
- Teilnehmerzahl und Rollen;
- Vorbedingungen und reproduzierbare Schritte;
- Screenshot oder Video;
- beobachtetes statt erwartetes Verhalten;
- Ergebnis `PASS`, `FAIL` oder `INCONCLUSIVE`;
- Auswirkung auf Baseline und notwendige Definitionsversion.

## 7. Rechtliche Grenze

Vor öffentlicher Veröffentlichung bleiben Fan-Content-/Markenrichtlinien, Disclaimer und Datenschutz abschliessend zu prüfen. Bis dahin: eigenes Logo und Design, keine offizielle Zugehörigkeit, keine Clientmanipulation, keine Ankama-Logindaten, keine automatisierten Spielaktionen und keine kopierten Guideinhalte.
