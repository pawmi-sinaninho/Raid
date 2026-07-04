# Feature Matrix

Legende:

- **P0:** zwingend für einen funktionsfähigen Piloten;
- **P1:** zwingend für die öffentliche V1;
- **P2:** Wow- und Optimierungsfunktion;
- **Später:** bewusst ausserhalb der ersten Veröffentlichung.

## 1. Plattformfunktionen

| Funktion | Priorität | Abnahmekriterium |
|---|---:|---|
| Session erstellen | P0 | Link wird erzeugt und Session gespeichert |
| anonymer Beitritt | P0 | Teilnahme ohne Konto |
| Captain- und Teilnehmerlink | P0 | getrennte Berechtigungen |
| Realtime-Synchronisation | P0 | Zustandsänderung bei allen sichtbar |
| Teilnehmerliste | P0 | 16 Teilnehmer stabil |
| Teams und Rollen | P0 | Zuweisen, ändern, entfernen |
| Aufgabenstatus | P0 | definierte Statusmaschine |
| Aufgabe übernehmen | P0 | keine doppelte unbemerkte Übernahme |
| persönliche Mission | P0 | aktuelle Aufgabe prominent |
| Timer | P0 | Start, Pause, Korrektur, Synchronität |
| Ereignisprotokoll | P0 | Person, Zeit, Änderung |
| Refresh-Recovery | P0 | Zustand und Identität bleiben erhalten |
| mobile Ansicht | P0 | ab 390 px vollständig bedienbar |
| Session duplizieren | P1 | neue Session mit Vorlage |
| Rückgängig | P1 | kritische Statusänderung reversibel |
| Zuschauerlink | P1 | read-only |
| Spracharchitektur | P1 | Texte nicht hart in Komponenten |
| Sessionzusammenfassung | P1 | Ergebnis und Verlauf |
| Benachrichtigungston | P2 | optional und gezielt |
| Discord-Webhook | P2 | wichtige Ereignisse senden |
| Overlay/PWA | Später | separat validieren |

## 2. Captain-Funktionen

| Funktion | Priorität |
|---|---:|
| Gesamtstatus | P0 |
| unbesetzte Aufgaben | P0 |
| Blockaden | P0 |
| Spieler ohne Aufgabe | P0 |
| Teamzuweisung | P0 |
| Ready-Check | P0 |
| Start und Ende | P0 |
| Captain-Rechte delegieren | P1 |
| kritischer Pfad | P2 |
| Restzeitprognose | P2 |
| automatische Aufgabenempfehlung | P2 |
| Heatmap der Engpässe | P2 |

## 3. Sanctuaire-Module

| Funktion | Priorität |
|---|---:|
| vier Rätselbereiche | P0 |
| Eingabefelder für Rätselresultate | P0 |
| Raid-Lebenszähler mit Ursache | P0 |
| vier Wächterkarten | P0 |
| automatische Resultatübernahme | P0 |
| Korridor-Zielzahl konfigurierbar | P0 |
| Monsterzähler pro Raum/Gruppe | P1 |
| Spielerzuweisung für Solokämpfe | P1 |
| getrennte Finalbossteams | P0 |
| Bossphase und Mechanikwarnung | P1 |
| Rätselvisualisierungen/Solver | P2, nur eigenständig und rechtlich sauber |

## 4. Gigalodon-Module

| Funktion | Priorität |
|---|---:|
| globaler Raidtimer | P0 |
| Etagenfortschritt | P0 |
| Lichtstatus pro Ebene | P0 |
| Lichtwarnungen | P1 |
| Salzverantwortung | P1 |
| Ressourcen pro Spieler | P0 |
| eingezahlt vs. unterwegs | P0 |
| Verlust-/Risikomeldung | P0 |
| Bossressourcen | P0 |
| Zugangsbedingungen | P0 |
| Schlüsselfragmente | P0 |
| Scoreberechnung aus Einzahlungen | P1 |
| Gigalodon-Startcheck | P0 |
| Farmen-oder-starten-Empfehlung | P2 |
| Scoreprognose | P2 |
| eigener Luminarium-Solver | P2, nach Validierung des Mehrwerts |

## 5. Wow-Funktionen

### A. Live Raid Map

Visuelle Darstellung der Raidphasen als Karte. Teams erscheinen an ihrem aktuellen Bereich. Blockaden pulsieren dezent; abgeschlossene Wege werden sichtbar freigeschaltet.

### B. Smart Next Action

Regelbasiertes System empfiehlt Teilnehmern die sinnvollste nächste Aufgabe anhand von:

- verfügbaren Aufgaben;
- Team;
- Rolle;
- Abhängigkeiten;
- aktueller Auslastung;
- Zeitrisiko.

Keine KI ist für V1 nötig. Regeln sind nachvollziehbarer und zuverlässiger.

### C. Captain Radar

Ein Bereich zeigt nur Ausnahmen:

- „Team 2 wartet seit 4 Minuten“;
- „Licht Ebene -4 kritisch“;
- „Bossressource noch nicht eingezahlt“;
- „Wächter freigeschaltet, aber ohne Team“.

### D. Risk Engine

Berechnet keine falsche Gewissheit, sondern klare Warnstufen anhand definierter Regeln:

- Grün: im Plan;
- Gelb: Aufmerksamkeit;
- Orange: kritischer Pfad gefährdet;
- Rot: sofortige Aktion erforderlich.

### E. Replay Summary

Nach dem Raid entsteht eine visuelle Zeitleiste mit wichtigen Momenten, Engpässen und Erfolgen.

## 6. Explizite Nichtfunktionen

- kein Auto-Play;
- kein Auslesen von Speicher, Netzwerkverkehr oder Clientdateien;
- keine automatischen Eingaben ins Spiel;
- keine Behauptung, offizielle DOFUS-Datenquelle zu sein;
- keine Kopie bestehender Guides oder deren UI.

## 7. Phase-9A-Implementierungsvertrag

Die P2-Wow-Funktionen sind ab v0.8.5.1 vollständig in `WOW_LAYER_SPECIFICATION.md` spezifiziert. Die Prioritäten dieser Matrix bleiben unverändert. Die technische Umsetzung erfolgt als Phase 9B erst nach Phase 8.5B und darf keine bestehende Fach- oder Realtime-Logik verändern.
