# User Flows

## 1. Captain erstellt eine Session

1. Startseite öffnen.
2. Raid auswählen.
3. optional Sessionname, Sprache und geplante Startzeit festlegen.
4. Session erstellen.
5. System erzeugt:
   - Bearbeitungslink für Captain;
   - Teilnehmerlink;
   - optional Zuschauerlink;
   - kurzen Lobbycode.
6. Captain teilt den Teilnehmerlink.
7. Captain landet direkt im Vorbereitungsraum.

**Abnahme:** Von Startseite bis teilbarem Link höchstens vier Eingaben.

## 2. Teilnehmer tritt ohne Konto bei

1. Link öffnen.
2. Anzeigename eingeben.
3. Klasse optional auswählen.
4. Teilnahme bestätigen.
5. lokale Wiederverbindung wird gespeichert.
6. Teilnehmer sieht Lobby oder persönliche Mission.

**Abnahme:** Kein Passwort, keine E-Mail, keine Registrierung.

## 3. Vorbereitung

Captain oder delegierter Editor:

1. prüft Teilnehmerzahl;
2. teilt Teilnehmer Teams oder Rollen zu;
3. weist Startaufgaben zu;
4. sieht unbesetzte kritische Aufgaben;
5. startet Ready-Check;
6. startet Live-Modus.

Teilnehmer:

1. bestätigt Bereitschaft;
2. sieht Team und erste Aufgabe;
3. kann Aufgabe annehmen oder Problem melden.

## 4. Aufgabe beanspruchen

1. Spieler öffnet eine bereite Aufgabe.
2. „Übernehmen“ wählen.
3. Aufgabe wird live für alle als beansprucht markiert.
4. Captain sieht Verantwortlichen.
5. Spieler startet Aufgabe.
6. nach Abschluss Ergebnis oder benötigte Daten eingeben.
7. System prüft Folgeabhängigkeiten.

## 5. Ergebnis löst Folgeaktionen aus

Beispiel:

1. Rätselteam trägt Farbe und Resultat ein.
2. Ergebnis wird bestätigt.
3. abhängige Wächterkarte wird freigeschaltet.
4. korrekte Farbe erscheint automatisch in der Wächterkarte.
5. zugewiesenes Wächterteam erhält neue persönliche Mission.
6. Captain erhält keine manuelle Übertragungsaufgabe.

## 6. Blockade melden

Teilnehmer wählt:

- brauche Hilfe;
- falsche Information;
- Kampf verloren;
- Aufgabe nicht möglich;
- Spieler fehlt;
- technische Störung.

System:

1. markiert Aufgabe;
2. informiert Captain und betroffene Teams;
3. zeigt Auswirkung auf kritischen Pfad;
4. bietet Neuzuweisung oder Rücksetzen an.

## 7. Kritische Aktion rückgängig machen

1. Captain öffnet Verlauf.
2. wählt Ereignis.
3. sieht abhängige Änderungen.
4. bestätigt Rückgängig.
5. System stellt konsistenten Zustand wieder her.
6. neue Aktion wird ebenfalls protokolliert.

## 8. Wiederverbindung

1. Teilnehmer lädt Seite neu oder öffnet denselben Link.
2. lokales Token identifiziert seine Teilnahme.
3. letzter bestätigter Zustand wird geladen.
4. persönliche Mission erscheint wieder.
5. bei verlorenem Token kann Captain die Identität neu zuweisen.

## 9. Raid beenden

1. Abschlussbedingung erreicht oder Captain beendet Session.
2. System friert Livezustand ein.
3. Zusammenfassung zeigt:
   - Score;
   - Zeit;
   - abgeschlossene und ausgelassene Aufgaben;
   - Raid-Leben beziehungsweise Risiken;
   - Beiträge der Teams;
   - Engpässe;
   - Ereignisverlauf.
4. Captain kann Session duplizieren oder archivieren.

## 10. Rollen

| Rolle | Rechte |
|---|---|
| Captain | alle Zustände, Rechte, Start, Ende, Rückgängig |
| Editor/Teamleiter | zugewiesene Bereiche und Teilnehmer verwalten |
| Teilnehmer | eigene und freigegebene Aufgaben bearbeiten |
| Zuschauer | nur lesen |
| anonymer Gast | Rechte gemäss Einladungslink |

## 11. Konfliktfälle

### Zwei Personen bearbeiten gleichzeitig

- letzte Änderung wird nicht blind überschrieben;
- UI zeigt Konflikt;
- bei einfachen Zählern atomare Aktualisierung;
- bei komplexen Eingaben Version prüfen und Zusammenführung verlangen.

### Captain verlässt Browser

- Session läuft weiter;
- mindestens ein Ersatz-Captain kann vorher bestimmt werden;
- Captain-Rechte können über Recovery-Key wiederhergestellt werden.

### Teilnehmer verlässt Raid

- Aufgabe bleibt sichtbar;
- Captain erhält Hinweis;
- Aufgabe kann freigegeben oder neu zugeteilt werden.
