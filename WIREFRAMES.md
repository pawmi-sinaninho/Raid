# Low-Fidelity Wireframes

**Dokumentstatus:** Phase 3 v0.3  
**Zweck:** Informationshierarchie, Interaktion und Zustandslogik prüfen.  
**Nicht enthalten:** Branding, Farben, Typografie, Texturen, Illustrationen oder finale Komponentenabstände.

## 1. Gemeinsame Regeln

- Captain Desktop arbeitet mit **fixem Header**, **Raidkarte/Arbeitsfläche**, **Captain Radar rechts** und **Aktivitätsleiste unten**.
- Teilnehmer Mobile öffnet immer auf **Mission**. Navigation: Mission, Raid, Team, Meldungen.
- Eine Aufgabe besitzt höchstens eine dominante Primäraktion.
- Ergebnisfelder erscheinen erst, wenn sie für den aktuellen Status benötigt werden.
- `LIVE_REQUIRED` wird als sichtbares Unsicherheitslabel dargestellt.
- Jeder bestätigte Schreibvorgang zeigt kurz: gespeichert, Person und Uhrzeit.

---

## 2. Session erstellen – Responsive

```text
┌──────────────────────────────────────────────┐
│ RAID COMMAND CENTER                         │
│ Erstelle eine Live-Session                  │
├──────────────────────────────────────────────┤
│ Raid                                         │
│ [ Sanctuaire ]  [ Gigalodon ]               │
│                                              │
│ Sessionname                                  │
│ [ Gilde – Freitagabend                  ]    │
│ Sprache      [ Français ▾ ]                  │
│ Startzeit    [ optional                  ]    │
│                                              │
│ 8–16 Spieler · 2:00 h                        │
│                             [Session erstellen]
└──────────────────────────────────────────────┘
```

**Fehlerfälle:** Definition deaktiviert, ungültige Eingabe, Session konnte nicht gespeichert werden.  
**Abnahme:** maximal vier Eingaben bis zum teilbaren Link.

---

## 3. Captain-Lobby – 1440×900

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sanctuaire · LOBBY       12/16 online      Link teilen      Verbindung ●     │
├─────────────────────────────┬───────────────────────────────┬────────────────┤
│ TEAMS                       │ TEILNEHMER                    │ STARTCHECK     │
│ ┌ Boote 2/2 ─────────────┐  │  ● Aline   bereit            │ ✓ 8+ Spieler   │
│ │ Aline · Berto           │  │  ● Berto   bereit            │ ✓ Ersatzeditor │
│ └─────────────────────────┘  │  ○ Chloé   nicht bereit      │ ! Clos frei    │
│ ┌ Schach 4/4 ────────────┐  │  ● ...                       │                │
│ │ ...                     │  │                               │ [Ready-Check]  │
│ └─────────────────────────┘  │ Drag & Drop / Zuweisen        │ [Raid starten] │
│ ┌ Monochrome 2/2 ────────┐  │                               │                │
│ └─────────────────────────┘  │                               │                │
│ ┌ Clos 3/4 ──────────────┐  │                               │                │
│ └─────────────────────────┘  │                               │                │
├─────────────────────────────┴───────────────────────────────┴────────────────┤
│ Einladungslinks · letzter Beitritt · Aktivitätsmeldungen                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Startblocker:** Teilnehmergrenze, kritische Rolle unbesetzt, kein Ersatzeditor, unbestätigter Startwert.

---

## 4. Teilnehmer-Lobby – 390×844

```text
┌──────────────────────────────┐
│ Sanctuaire        online ●   │
│ Lobby · 12/16                │
├──────────────────────────────┤
│ DEIN TEAM                    │
│ Monochrome                   │
│ Rolle: Podeste erfassen      │
│ Team: Chloé, Malik           │
│                              │
│ ERSTE AUFGABE                │
│ Vier Podeste erfassen        │
│ Ort: Clos [11,21] / [12,20]  │
│                              │
│ [ Ich bin bereit ]           │
│                              │
│ Warte auf Captain-Start      │
├──────────────────────────────┤
│ Mission   Raid   Team   Meld.│
└──────────────────────────────┘
```

---

## 5. Sanctuaire Captain Command Center – Rätselphase

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Sanctuaire  01:42:18   Score 4'000   Raid-Leben 18   15/16 online ●         │
├──────────────────────────────────────────────────────┬───────────────────────┤
│ RAIDWEG                                              │ CAPTAIN RADAR         │
│                                                      │ 🔴 Clos validiert     │
│ [RÄTSEL 2/4] ── [WÄCHTER gesperrt] ── [KORRIDOR]    │    falsch: -1 Leben  │
│                                                      │ 🟠 Schach wartet 3m   │
│ ┌ Boote ────────── ACTIVE ───────────────┐            │ 🟡 1 Spieler offline │
│ │ Treffer 4/6 · Brett B ist dran         │            │                       │
│ │ Team 1 · [Öffnen]                      │            │ [Alle Meldungen]      │
│ └────────────────────────────────────────┘            │                       │
│ ┌ Schach ───────── WAITING ──────────────┐            │ UNBESETZT             │
│ │ Warte auf 4. Spieler                   │            │ Manuskript optional   │
│ └────────────────────────────────────────┘            │                       │
│ ┌ Monochrome ───── COMPLETED ────────────┐            │                       │
│ │ Farbe: AZUR · bestätigt von 2 Personen │            │                       │
│ └────────────────────────────────────────┘            │                       │
│ ┌ Clos ─────────── ACTIVE ───────────────┐            │                       │
│ │ Gärten 3/4 · Ziel noch gesperrt        │            │                       │
│ └────────────────────────────────────────┘            │                       │
├──────────────────────────────────────────────────────┴───────────────────────┤
│ 19:14 Farbe bestätigt · 19:13 Raid-Leben -1 · [Verlauf] [Rückgängig]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Kernprüfung:** Captain sieht parallel Fortschritt, Wartezustand, Lebensverlust und fehlenden Spieler ohne Taskliste.

---

## 6. Sanctuaire Task-Detail – Endfarbe

```text
┌────────────────────────────────────────────┐
│ ENDFARE ERFASSEN                    ACTIVE │
│ Ouvrage Monochrome                        │
├────────────────────────────────────────────┤
│ Wähle die im Spiel sichtbare Endfarbe:    │
│ ( ) Ambre / Erde                           │
│ (●) Azur / Wasser                          │
│ ( ) Viridine / Luft                        │
│ ( ) Écarlate / Feuer                       │
│                                            │
│ Zweitbestätigung: Malik ●                  │
│                                            │
│ Wird automatisch übertragen an:           │
│ • Clos-Zielmonster                         │
│ • Sentinelle-Zielobelisk                   │
│                                            │
│ [Mechanik anzeigen]                        │
│ [Ergebnis bestätigen]                      │
└────────────────────────────────────────────┘
```

---

## 7. Sanctuaire Korridor-Dispatcher

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ KORRIDOR     37 / 60     Restzeit 00:31:20     Ziel: 60  [LIVE_REQUIRED]    │
├───────────────────────────────────────────────────┬──────────────────────────┤
│ Räume                                             │ Freie Spieler            │
│ R1  6/6 ✓   R2 6/6 ✓   R3 5/6  [1 frei]          │ Aline   Kampf R4-2      │
│ R4  3/6     R5 4/6     R6 2/6                     │ Berto   frei [zuweisen]  │
│ R7  3/6     R8 2/6     R9 0/6   R10 0/6          │ Chloé   Retry R3-6      │
│                                                   │ ...                      │
│ Prognose: bei aktuellem Tempo 8 Min. Reserve      │ [Alle automatisch verteilen]
├───────────────────────────────────────────────────┴──────────────────────────┤
│ Letzte Niederlage: Chloé · R3-6 · Raid-Leben -1 · Kampf wieder freigegeben │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Sanctuaire Finalboss Split View

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ FINALE              00:18:42       Raid-Leben 9       Score 30'000          │
├──────────────────────────────────────┬───────────────────────────────────────┤
│ REINE ÉCARLATE                       │ PRINCESSE MAUDITE                     │
│ ACTIVE · Team 8/8                    │ READY · Team 6/8                      │
│ Phase 2                              │ Warte auf 2 Spieler                   │
│ Volonté 12'400 HP                    │                                       │
│ Pommeau ✓   Lame ✕                   │ [Spieler zuweisen]                    │
│ dauerhaft verwundbar: NEIN           │                                       │
│ [Lame besiegt] [Niederlage]          │ [Kampf starten]                       │
├──────────────────────────────────────┴───────────────────────────────────────┤
│ Abschluss erst nach beiden Siegen                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Gigalodon Captain Expedition Map

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Gigalodon  00:24:38   Score 12'480 + 8'320 at risk   Fragmente 3/4          │
├───────────────┬──────────────────────────────────────────┬────────────────────┤
│ LICHT         │ EXPEDITION                               │ CAPTAIN RADAR      │
│ -1  4  01:34  │ [Vorposten] ✓                           │ 🔴 Noirceur nicht  │
│ -2  3  00:42  │    ↓                                     │    eingezahlt      │
│ -3  4  01:58  │ [Mureine] ✓  Unité: Aline ⚠             │ 🟠 Licht -5 Level 1│
│ -4  2  00:18  │    ↓                                     │ 🟠 8'320 at risk   │
│ -5  1  01:06  │ [Luminarium] ✓                           │ 🟡 Inventar Malik  │
│               │    ↓                                     │    7m alt          │
│ Salzteam      │ [Exécrabe] ✓  Pince: Berto              │                    │
│ Malik         │    ↓                                     │ [Finalcheck]       │
│ [Auffüllen]   │ [Etage -5] ACTIVE · Fragment 4 fehlt    │                    │
│               │    ↓                                     │                    │
│               │ [Willorque] ✓  Noirceur: Chloé ⚠        │                    │
│               │    ↓                                     │                    │
│               │ [Rückweg / Einzahlung] LOCKED            │                    │
├───────────────┴──────────────────────────────────────────┴────────────────────┤
│ 19:44 Fragmentchance 10 % · 19:43 Licht -5 auf Level 1                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Gigalodon Teilnehmer-Mission – 390×844

```text
┌──────────────────────────────┐
│ 00:24:38     Etage -5  L1 🟠 │
│ online ●                     │
├──────────────────────────────┤
│ JETZT                        │
│ Krak'Haine-Gruppe K5-07      │
│ Team Combat B                │
│ Ziel: Fragment 4             │
│                              │
│ [ Kampf starten ]            │
│                              │
│ DEIN INVENTAR                │
│ Onyx 3 · Jais 5 · Salz 2     │
│ Score at risk: 190           │
│ Letzte Bestätigung: vor 2m   │
│ [ Bestand aktualisieren ]    │
│                              │
│ DANACH                       │
│ Rückweg / Einzahlung         │
│                              │
│ WARTE AUF                    │
│ Niemanden                    │
│ [Problem melden]             │
├──────────────────────────────┤
│ Mission   Raid   Team   Meld.│
└──────────────────────────────┘
```

---

## 11. Exécrabe Sequenz – Touch und Zweitbestätigung

```text
┌──────────────────────────────────────┐
│ EXÉCRABE-SEQUENZ             ACTIVE │
├──────────────────────────────────────┤
│ 80'000  [ Coquillage ✓ ]             │
│ 60'000  [ Perle ✓ ]                  │
│ 40'000  [ Poulpe ✓ ]                 │
│ 20'000  [ ? ]                        │
│                                      │
│ [Coquillage] [Oursin]                │
│ [Perle]       [Poulpe]               │
│                                      │
│ Schreiber: Malik                     │
│ Bestätigung: noch offen              │
│                                      │
│ [Sequenz zweitbestätigen]            │
└──────────────────────────────────────┘
```

**Konfliktregel:** gleichzeitige Auswahl wird nicht „last write wins“ überschrieben; der Serverwert und der konkurrierende Entwurf werden angezeigt.

---

## 12. Gigalodon Final Readiness Check

```text
┌────────────────────────────────────────────────────────────┐
│ FINALSTART-CHECK                              00:05:42 🟠  │
├────────────────────────────────────────────────────────────┤
│ ✓ Zugang Gigalodon                                       │
│ ✓ Unité de Mureine eingezahlt                            │
│ ✓ Rancune d'Exécrabe eingezahlt                          │
│ ✕ Noirceur de Willorque unterwegs – Chloé               │
│ ! 1 aktiver Kampf – mögliche Startblockade [UNBESTÄTIGT] │
│ ✓ Finalteam 12/12 bereit                                  │
│ ! 420 Score at risk                                       │
│                                                            │
│ [Chloé anpingen] [Aktiven Kampf öffnen]                    │
│                                                            │
│ [Finalstart noch gesperrt]                                 │
└────────────────────────────────────────────────────────────┘
```

---

## 13. Task-Detail – Blockade melden

```text
┌──────────────────────────────────────┐
│ PROBLEM MELDEN                       │
├──────────────────────────────────────┤
│ ( ) Brauche Hilfe                    │
│ ( ) Falsche Information              │
│ ( ) Kampf verloren                   │
│ (●) Spieler fehlt                    │
│ ( ) Aufgabe nicht möglich            │
│ ( ) Technische Störung               │
│                                      │
│ Notiz [__________________________]    │
│                                      │
│ Betroffene Aufgabe: Schachkampf      │
│ Captain und Team werden informiert.  │
│                                      │
│ [Meldung senden]                     │
└──────────────────────────────────────┘
```

---

## 14. Verlauf und Rückgängig

```text
┌─────────────────────────────────────────────────────────────┐
│ AKTIVITÄTSVERLAUF                                           │
├─────────────────────────────────────────────────────────────┤
│ 19:44 Malik  Licht -5: 2 → 1                    [Details]   │
│ 19:43 Chloé  Noirceur-Halter bestätigt          [Details]   │
│ 19:41 Aline  Aufgabe fälschlich abgeschlossen   [Undo]      │
│                                                             │
│ Undo-Vorschau                                               │
│ • Aufgabe zurück auf ACTIVE                                 │
│ • Finalcheck wieder blockiert                               │
│ • Warnung „Noirceur fehlt“ wird reaktiviert                 │
│                                                             │
│ [Abbrechen]                         [Konsistent rückgängig]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. Raidzusammenfassung

```text
┌─────────────────────────────────────────────────────────────┐
│ RAID ABGESCHLOSSEN                                          │
│ Score 48'720 · Dauer 58:14 · Finalstart bei 03:12           │
├─────────────────────────────────────────────────────────────┤
│ Höhepunkte                 │ Engpässe                       │
│ ✓ Alle Unique gesichert   │ 7m Inventar veraltet           │
│ ✓ Fragment 4 bei 14:22    │ Licht -5 zweimal kritisch      │
│ ✓ Finalteam 12/12         │ 1'000 Score Rätselstrafe       │
│                            │                                 │
│ Teambeiträge · Timeline · Verluste                          │
│                                                             │
│ [Session duplizieren] [Teilbare Zusammenfassung]             │
└─────────────────────────────────────────────────────────────┘
```

---

## 16. Wireframe-Abnahme gegen Kernflows

| Kernflow | Nachweis im Wireframe |
|---|---|
| Beitreten ohne Konto | Session erstellen, Teilnehmer-Lobby |
| Aufgabe erkennen | Mobile Mission: „Jetzt“ ist dominant |
| Ergebnis melden | Task-Detail mit kontextabhängigen Feldern |
| Blockade erkennen | Captain Radar und Blockade-Dialog |
| Folgeaufgabe verstehen | „Danach“ und „Warte auf“ auf Mobile |
| Rätseldaten übertragen | Endfarbe-Detail nennt Zielmodule explizit |
| Solokämpfe verteilen | Korridor-Dispatcher verhindert Doppelbelegung |
| Licht und Ressourcen koordinieren | Gigalodon Expedition Map + Ledger |
| Finalstart absichern | Final Readiness Check mit Unsicherheitslabel |
| Undo nachvollziehen | Verlauf zeigt abhängige Folgen vor Bestätigung |

## 17. Noch nicht Bestandteil dieser Phase

- visuelle Marke, Logo, Farbpalette, Typografie und Texturen;
- finale Komponentenbibliothek;
- klickbarer Figma-/Browserprototyp;
- React/Next.js-Implementierung;
- Realtime-Verhalten im laufenden Code;
- automatische Luminarium-Berechnung im Produktcode.
