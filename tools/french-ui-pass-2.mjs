import fs from "node:fs";

function rw(path, fn) {
  if (!fs.existsSync(path)) return;
  const before = fs.readFileSync(path, "utf8");
  const after = fn(before);
  if (after !== before) fs.writeFileSync(path, after, { encoding: "utf8" });
}

function rep(text, pairs) {
  for (const [from, to] of pairs) text = text.split(from).join(to);
  return text;
}

const common = [
  ["Live Raid Command", "Commandement de raid en direct"],
  ["Live-Kommandozentrale für komplexe DOFUS-Gildenraids.", "Centre de commandement en direct pour les raids de guilde complexes sur DOFUS."],
  ["Ready check", "Appel de préparation"],
  ["GUIDE CONFIRMÉ · PAS ENCORE TESTÉ EN LIVE", "GUIDE CONFIRMÉ · PAS ENCORE CONFIRMÉ EN JEU"],
  ["Confirmé en live", "Confirmé en jeu"],
  ["Guide confirmé · pas encore testé en live", "Guide confirmé · pas encore confirmé en jeu"],
  ["Guide confirmé · pas encore testé en jeu", "Guide confirmé · pas encore confirmé en jeu"],
];

rw("platform/app/layout.tsx", (t) => rep(t, common));
rw("platform/components/lobby/DepartureGate.tsx", (t) => rep(t, common));
rw("platform/components/SessionApp.tsx", (t) => rep(t, common));
rw("platform/components/sanctuaire/CorridorRibbon.tsx", (t) => rep(t, common));

// Visible fallback reasons
rw("platform/src/core/mission.ts", (t) => rep(t, [
  ["Aufgabe ist bereit und kann übernommen werden.", "La mission est prête et peut être prise."],
  ["Warte auf Zuweisung oder Freischaltung.", "En attente d’une affectation ou d’un déverrouillage."]
]));

// Radar messages used by Captain/Wow layer
rw("platform/src/core/radar.ts", (t) => rep(t, [
  ["Captain muss Team oder Person zuweisen.", "Le capitaine doit affecter une équipe ou une personne."],
  ["Aktuelle Aufgabe kann ohne Neuzuweisung blockieren.", "La mission en cours peut se bloquer sans nouvelle affectation."],
  ["Teilnehmerstatus prüfen.", "Vérifier l’état du joueur."],
  ["Kritischer Pfad kann nicht fortgesetzt werden.", "Le chemin critique ne peut pas continuer."],
  ["Abhängigkeit auf dem nächsten Pfad ist noch offen.", "Une dépendance de la prochaine étape reste ouverte."]
]));

// Server errors visible in UI
rw("platform/src/server/api.ts", (t) => rep(t, [
  ["Wiederverbindungsdaten fehlen.", "Données de reconnexion manquantes."],
  ["Interner Fehler.", "Erreur interne."]
]));

rw("platform/src/server/db/database.ts", (t) => rep(t, [
  ["DATABASE_URL fehlt für RAIDWEAVE_DB_MODE=postgres", "DATABASE_URL manquante pour RAIDWEAVE_DB_MODE=postgres"],
  ["Invalid PostgreSQL channel", "Canal PostgreSQL invalide"]
]));

rw("platform/src/server/platform-store.ts", (t) => rep(t, [
  ["Anzeigename fehlt.", "Nom affiché manquant."],
  ["Anzeigename ist zu lang.", "Nom affiché trop long."],
  ["Einladungslink ist ungültig.", "Lien d’invitation invalide."],
  ["Einladungslink wurde widerrufen.", "Lien d’invitation révoqué."],
  ["Einladungslink ist abgelaufen.", "Lien d’invitation expiré."],
  ["Einladungslink wurde bereits vollständig verwendet.", "Lien d’invitation déjà entièrement utilisé."],
  ["Session ist bereits beendet.", "La session est déjà terminée."],
  ["Maximale Teilnehmerzahl ist erreicht.", "Nombre maximal de joueurs atteint."],
  ["Anzeigename wird bereits verwendet.", "Ce nom affiché est déjà utilisé."],
  ["Wiederverbindungsdaten sind ungültig.", "Données de reconnexion invalides."],
  ["Beschränkter Editor darf keine globalen Teams erstellen.", "Un éditeur restreint ne peut pas créer d’escouades globales."],
  ["Editor darf dieses Team nicht verwalten.", "L’éditeur ne peut pas gérer cette escouade."],
  ["Teilnehmer wurde nicht gefunden.", "Joueur introuvable."],
  ["Team wurde nicht gefunden.", "Escouade introuvable."],
  ["Teilnehmer sind nicht bereit.", "joueurs ne sont pas prêts."],
  ["Mindestens ein Ersatzeditor ist erforderlich.", "Au moins un éditeur de secours est requis."],
  ["Session kann noch nicht gestartet werden.", "La session ne peut pas encore démarrer."],
  ["Session wurde nicht gefunden.", "Session introuvable."],
  ["Session ist nicht mehr in der Lobby.", "La session n’est plus dans le hall."],
  ["Zuschauer dürfen nicht schreiben.", "Les spectateurs ne peuvent pas modifier la session."],
  ["Zuschauer dürfen nicht bestätigen.", "Les spectateurs ne peuvent pas confirmer."],
  ["Aufgabe wurde nicht gefunden.", "Mission introuvable."],
  ["Aufgabe wurde bereits geändert.", "La mission a déjà été modifiée."],
  ["Abgeschlossene Aufgabe muss zuerst korrigiert werden.", "Une mission terminée doit d’abord être corrigée."],
  ["Aufgabe gehört einer anderen Person.", "Cette mission appartient à une autre personne."],
  ["Aufgabendefinition fehlt.", "Définition de mission manquante."],
  ["Resultat ist unvollständig oder ungültig.", "Le résultat est incomplet ou invalide."],
  ["Diese Aufgabe wird automatisch abgeschlossen.", "Cette mission se termine automatiquement."],
  ["Aufgabe ist in diesem Zustand nicht einreichbar.", "La mission ne peut pas être envoyée dans cet état."],
  ["Keine offene Bestätigung vorhanden.", "Aucune confirmation ouverte."],
  ["Eine andere Person muss bestätigen.", "Une autre personne doit confirmer."],
  ["Nur der Captain darf bestätigen.", "Seul le capitaine peut confirmer."],
  ["Resultat muss zuerst eingereicht und bestätigt werden.", "Le résultat doit d’abord être envoyé et confirmé."],
  ["Ungültige Lebensänderung.", "Variation de vie invalide."],
  ["Ursache fehlt.", "Cause manquante."],
  ["Korridorziel muss zwischen 1 und 500 liegen.", "L’objectif du corridor doit être compris entre 1 et 500."],
  ["Ziel liegt unter dem bestätigten Fortschritt.", "L’objectif est inférieur à la progression confirmée."],
  ["Das Korridorziel kann nach Abschluss nicht mehr geändert werden.", "L’objectif du corridor ne peut plus être modifié après son achèvement."],
  ["Raum und Slot sind ungültig.", "Salle ou emplacement invalide."],
  ["Der Korridor ist noch nicht freigeschaltet oder bereits abgeschlossen.", "Le corridor n’est pas encore déverrouillé ou est déjà terminé."],
  ["Ungültige Korridoränderung.", "Variation de corridor invalide."],
  ["Gruppenziel muss zwischen 1 und 100 liegen.", "L’objectif de groupes doit être compris entre 1 et 100."],
  ["Diese Aktion ist nur für Gigalodon verfügbar.", "Cette action n’est disponible que pour Gigalodon."],
  ["Zuschauer dürfen den Etagenfortschritt nicht ändern.", "Les spectateurs ne peuvent pas modifier la progression des étages."],
  ["Ungültige Gruppenänderung.", "Variation de groupes invalide."]
]));

// Contract strings: human-readable text only. Do not rename keys/enums/IDs.
for (const path of [
  "platform/contracts/sanctuaire.v0.2.json",
  "platform/contracts/gigalodon.v0.2.json"
]) {
  rw(path, (t) => rep(t, [
    ["Captain bestätigt", "Le capitaine confirme"],
    ["Captain und Ersatzeditor online bestätigen.", "Confirmer que le capitaine et l’éditeur de secours sont en ligne."],
    ["Captain-, Teilnehmer- und optional Zuschauerlink erzeugen.", "Générer les liens capitaine, joueur et éventuellement spectateur."],
    ["Teilnehmer", "joueurs"],
    ["Teilnehmerzuweisungen", "affectations des joueurs"],
    ["Bereite Spieler", "Joueurs prêts"],
    ["Bereite Teilnehmer", "Joueurs prêts"],
    ["Bereitschaft bestätigen", "Confirmer la préparation"],
    ["Bereit", "Prêt"],
    ["Bestätigen", "Confirmer"],
    ["bestätigen", "confirmer"],
    ["bestätigt", "confirmé"],
    ["Bestätigt", "Confirmé"],
    ["bestätigten", "confirmé"],
    ["bestätigtem", "confirmé"],
    ["unbestätigt", "non confirmé"],
    ["Unbestätigt", "Non confirmé"],
    ["Zweitbestätigung", "Deuxième confirmation"],
    ["zweitbestätigen", "faire confirmer par une deuxième personne"],
    ["Zweite Person bestätigt", "Une deuxième personne confirme"],
    ["Zweite Person", "Deuxième personne"],
    ["Spieler", "joueur"],
    ["Spielerposition", "Position du joueur"],
    ["Spieler auswählen", "Choisir les joueurs"],
    ["Spieler verschluckt", "Joueur avalé"],
    ["Spieler anpingen", "Relancer le joueur"],
    ["Team bereit", "Escouade prête"],
    ["Teams verteilen", "Répartir les escouades"],
    ["Team verteilen", "Répartir l’escouade"],
    ["Team vervollständigen", "Compléter l’escouade"],
    ["Team und", "Escouade et"],
    ["Team vor", "Escouade avant"],
    ["Team bis", "Escouade jusqu’à"],
    ["Team", "escouade"],
    ["Startfreigabe", "autorisation de départ"],
    ["Startsignal", "signal de départ"],
    ["Startcheck", "contrôle de départ"],
    ["Start blockiert", "Départ bloqué"],
    ["Starten", "Démarrer"],
    ["Start", "Départ"],
    ["Finalstart", "lancement du combat final"],
    ["Finalkampf", "combat final"],
    ["Schaden aktualisieren", "Actualiser les dégâts"],
    ["Schaden", "dégâts"],
    ["Schadensrunde", "tour de dégâts"],
    ["Schadensrunden", "tours de dégâts"],
    ["Schadensschwelle", "seuil de dégâts"],
    ["Niederlage", "Défaite"],
    ["Sieg", "Victoire"],
    ["Fehler melden", "Signaler une erreur"],
    ["Fehler", "erreur"],
    ["Warnung", "alerte"],
    ["Warnungen", "alertes"],
    ["Risiko", "risque"],
    ["Risiken", "risques"],
    ["Kämpfe", "combats"],
    ["Kampf", "combat"],
    ["Räume", "salles"],
    ["Räumen", "salles"],
    ["Solokämpfe", "combats solo"],
    ["Abgeschlossene", "Terminés"],
    ["Abschluss", "clôture"],
    ["Abgeschlossen", "Terminé"],
    ["Aufgabe", "mission"],
    ["Mission", "mission"],
    ["Halter", "porteur"],
    ["Halter wählen", "Choisir le porteur"],
    ["Halter sofort zum Koffer führen.", "Conduire immédiatement le porteur au coffre."],
    ["Koffer", "coffre"],
    ["Inventar bestätigen", "Confirmer l’inventaire"],
    ["Inventar", "inventaire"],
    ["Bestände", "inventaires"],
    ["Ressourcen", "ressources"],
    ["Ressourcenscore", "score de ressources"],
    ["Score at risk", "score non sécurisé"],
    ["at risk", "non sécurisé"],
    ["ungesichert", "non sécurisé"],
    ["Ungesicherter", "Non sécurisé"],
    ["sicherbaren", "sécurisables"],
    ["bestätigten Raidscore", "score de raid confirmé"],
    ["Scorezuwachs", "gain de score"],
    ["Rest", "reste"],
    ["Lichtlevel", "niveau de lumière"],
    ["Lichtzustand", "état de la lumière"],
    ["Licht", "lumière"],
    ["Light Count", "Light Count"],
    ["Guide-Baseline", "base guide"],
    ["Guidebasierte Baseline", "base issue du guide"],
    ["Baseline", "base"],
    ["noch nicht durch RAIDWEAVE live bestätigt", "pas encore confirmé en jeu par RAIDWEAVE"],
    ["live zu prüfen", "à vérifier en jeu"],
    ["Live-Modus", "mode direct"],
    ["In-Game", "en jeu"],
    ["im Spiel", "en jeu"],
    ["Etage", "étage"],
    ["Etagen", "étages"],
    ["Gruppen", "groupes"],
    ["Gruppe", "groupe"],
    ["Objektiv", "objectif"],
    ["Zielzahl", "nombre cible"],
    ["Ziel", "objectif"],
    ["Ziele", "objectifs"],
    ["Farbe", "couleur"],
    ["Sequenz", "séquence"],
    ["Runden", "tours"],
    ["Timer", "chronomètre"],
    ["Verluste", "pertes"],
    ["Engpässe", "blocages"],
    ["Rückweg", "retour"],
    ["Farmteams", "escouades de farm"],
    ["Farming", "farm"],
    ["Dunkle Aggressionskarte", "carte d’agression sombre"],
    ["dunklen Aggressionskarte", "carte d’agression sombre"],
    ["Startbereiche", "zones de départ"],
    ["Vorlagen", "modèles"],
    ["editierbar", "modifiables"]
  ]));
}
