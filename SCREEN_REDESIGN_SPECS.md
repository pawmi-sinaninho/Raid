# Screen Redesign Specifications

**Projektversion:** v0.8.5  
**Ziel:** verbindliche Neugestaltung der fünf priorisierten Kernansichten  
**Referenzen:** `reference-authenticity/*.png` und die zugehörigen HTML-Dateien

## 1. Landingpage

**Referenz:** `reference-authenticity/landing_1440x900.png`

### Primäre Aufgabe

In weniger als zehn Sekunden vermitteln:

- RAIDWEAVE steuert einen laufenden Raid;
- die beiden Raids besitzen unterschiedliche operative Welten;
- Nutzer können direkt erstellen oder beitreten.

### Neuer Aufbau

1. schmale Marken- und Utility-Zeile;
2. redaktioneller Claim links;
3. zwei überlappende Raidposter rechts;
4. kompakter Join-Dock direkt beim Claim;
5. sekundäre Sessionerstellung ohne grosses Formularpanel;
6. detailliertes Erstellformular erst nach der Raidwahl als Step oder Drawer.

### Entfernen

- Benefit-Card-Paar;
- grosse generische Form-Card im Hero;
- Claim `One raid. Every move.` als alleinige Hauptaussage;
- gleichgewichtige Zweispalten-SaaS-Komposition.

### Microcopy-Basis

- Hauptclaim: `Le raid ne se gagne pas dans un tableau.`
- Erklärung: `Répartissez les rôles, faites circuler les résultats et gardez chaque joueur sur la prochaine action utile.`
- Primäraktion bestehender Nutzer: `Rejoindre le raid`.
- Primäraktion Captain: `Créer une session`.

### Responsive

Unter 768 px:

- Poster werden zu zwei horizontalen Raidbändern;
- Join-Dock steht vor der Sessionerstellung;
- kein dekoratives Poster über 180 px Höhe;
- Kernaktion ohne Scrollen sichtbar.

## 2. Session-Lobby

**Referenz:** `reference-authenticity/session_lobby_1440x900.png`

### Primäre Aufgabe

Die Lobby wird zum Briefingraum. Der Captain muss unmittelbar sehen:

- Formation;
- offene Positionen;
- fehlende Ready-Antworten;
- konkrete Startblockade;
- Teilnehmercode und Link.

### Neuer Aufbau

1. linkes Missionsticket mit Sessioncode und Rahmenbedingungen;
2. zentrale Formation mit Teams als Lanes statt Listen-Panels;
3. rechte Abmarschfreigabe mit Ready-Ring und Startentscheidung;
4. jüngste Beitritte als schmale Statusleiste;
5. Teamzuweisung direkt innerhalb der Formation.

### Entfernen

- drei gleichwertige Administrationspanels;
- generische Personenliste ohne sichtbaren Raidauftrag;
- isolierte Ready-Checkboxen ohne gemeinsamen Startkontext;
- technische Inviteverwaltung im Hauptblick.

### Startbutton-Zustände

- fehlende Mindestzahl: `Noch X Spieler erforderlich`;
- Ready offen: `X Spieler erneut anfragen`;
- bewusstes Überspringen: sekundär `Trotzdem starten` mit Begründung;
- bereit: `Donner le signal de départ`.

## 3. Sanctuaire Captain

**Referenz:** `reference-authenticity/sanctuaire_captain_1440x900.png`

### Primäre Aufgabe

Der Captain erkennt als Route:

- welche Rätsel parallel laufen;
- welche Resultate wohin übertragen werden;
- welcher Wächter oder Korridor als Nächstes öffnet;
- welche Entscheidung aktuell blockiert.

### Neuer Aufbau

1. horizontaler Gartenpfad im oberen Bereich;
2. Raid-Leben als eigenständiges Siegel, nicht als Metric Tile;
3. vier Rätsel als unterschiedlich gewichtete Garten-Arbeitsflächen;
4. sichtbare Transferpfeile und Zielknoten;
5. Korridor als breites Fortschrittsband;
6. Finalbosse als gekoppelte Zielmarken;
7. Captain Radar als angeheftete Entscheidungsnotizen.

### Kartenreduktion

- keine vier identischen Rätselkarten;
- keine zweite identische Vierergruppe für Wächter;
- Wächterinformationen erscheinen als Zielknoten oder werden bei Aktivierung zur Arbeitsfläche;
- gesperrte Bereiche zeigen die konkrete fehlende Übergabe, nicht leere Fläche.

### Visuelle Priorität

1. aktuelle Blockade beziehungsweise Entscheidung;
2. aktive Rätsel und fehlende Bestätigung;
3. Resultattransfer;
4. Korridorvorbereitung;
5. Score und Verlauf.

## 4. Gigalodon Captain

**Referenz:** `reference-authenticity/gigalodon_captain_1440x900.png`

### Primäre Aufgabe

Der Captain erkennt die Expedition als zusammenhängende Tiefenroute:

- aktuelle Etage;
- Licht pro betroffener Etage;
- getragene kritische Fracht;
- Rückweg- und Einzahlungsrisiko;
- fehlende Finalfreigabe.

### Neuer Aufbau

1. permanente vertikale Tiefenroute links;
2. Lichtzustand direkt am Etagenkontext plus verdichtete Light Bay;
3. dominante Situationszeile statt fünf gleichartiger Metriken;
4. Unique-Ressourcen als Frachtmanifest;
5. normales Ledger als Transportliste;
6. Finalreadiness als begründete Freigabebänder;
7. Radar nur mit Risiken, die den aktuellen Plan verändern.

### Entfernen

- fünf identische `giga-metric`-Karten;
- fünf isolierte gleichartige `light-card`-Karten als Hauptdarstellung;
- vier gleichartige Unique-Karten;
- drei gleich grosse Readiness-Spalten;
- Kennzahlensammlung ohne räumliche Bindung.

### Pflichtformulierungen

- `X Punkte sind noch getragen`, nicht nur `Score à risque`;
- `Lumière −3 à 2 · prochain déclin estimé dans 02:01`;
- `Règle non confirmée en jeu`, wenn eine offene Regel betroffen ist;
- `Pourquoi le Gigalodon ne peut pas partir` als Finalcheck-Titel.

## 5. Teilnehmer Mobile

**Referenz:** `reference-authenticity/participant_mobile_390x844.png`

### Primäre Aufgabe

Ohne Interpretation zeigen:

- wo der Spieler ist;
- was er jetzt tun muss;
- welche Information er liefern muss;
- welches persönliche Risiko besteht;
- was direkt danach folgt.

### Neuer Aufbau

1. kompakter Raid-/Timerkopf;
2. Ort als eigenes Routenband;
3. Mission als Einsatzblatt mit grosser Verbalform;
4. exakt eine dominante Primäraktion;
5. maximal zwei schnelle persönliche Kennzahlen;
6. Folgeauftrag als separater Slip;
7. Bottom Navigation unverändert mit vier Zielen.

### Regeln

- Missionstitel beginnt mit einem Verb;
- Ort und Team stehen vor der Erklärung;
- Button beschreibt die bestätigte Wirkung, nicht nur `Terminer`;
- Captain-Gesamtdaten bleiben verborgen;
- persönliche Unique-Fracht steht oberhalb normaler Ressourcen;
- keine vertikale Folge aus mehr als drei gleichartigen Cards.

## 6. Gemeinsame Screenabnahme

Jeder der fünf Screens muss:

- ohne horizontales Kernscrolling funktionieren;
- bei 200 % Browserzoom noch bedienbar bleiben;
- lange französische Labels ohne kritische Kürzung zeigen;
- Status nicht nur über Farbe transportieren;
- eine sichtbare Fokusreihenfolge besitzen;
- bei `prefers-reduced-motion` ohne Informationsverlust funktionieren;
- mindestens eine raid- beziehungsweise workflow-spezifische räumliche Beziehung darstellen;
- die wichtigste Entscheidung innerhalb von drei Sekunden erkennbar machen.
