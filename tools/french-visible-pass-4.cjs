const fs = require("node:fs");

function rw(path, fn) {
  if (!fs.existsSync(path)) return;
  const before = fs.readFileSync(path, "utf8");
  const after = fn(before);
  if (after !== before) fs.writeFileSync(path, after, "utf8");
}

function applyRules(text, rules) {
  for (const [pattern, replacement] of rules) text = text.replace(pattern, replacement);
  return text;
}

const visibleRules = [
  [/Ready-Check/g, "appel de pr\u00e9paration"],
  [/Live-Modus/g, "mode direct"],
  [/Finalkampf/g, "combat final"],
  [/Finalstart/g, "lancement du combat final"],
  [/Startfreigabe/g, "autorisation de d\u00e9part"],
  [/Startsignal/g, "signal de d\u00e9part"],
  [/Startcheck/g, "contr\u00f4le de d\u00e9part"],
  [/Start blockiert/g, "D\u00e9part bloqu\u00e9"],

  [/Guide-?Baseline/g, "base du guide"],
  [/Guideangabe/g, "indication du guide"],
  [/live zu pr.{0,6}fen/g, "\u00e0 v\u00e9rifier en jeu"],
  [/live pr.{0,6}fen/g, "v\u00e9rifier en jeu"],
  [/noch nicht durch RAIDWEAVE live best.{0,6}tigt/g, "pas encore confirm\u00e9 en jeu par RAIDWEAVE"],
  [/In-Game/g, "en jeu"],
  [/im Spiel/g, "en jeu"],

  [/unbest.{0,6}tigt/gi, "non confirm\u00e9"],
  [/Best.{0,6}tigungen/g, "Confirmations"],
  [/Best.{0,6}tigung/g, "Confirmation"],
  [/best.{0,6}tigungen/g, "confirmations"],
  [/best.{0,6}tigung/g, "confirmation"],
  [/Best.{0,6}tigen/g, "Confirmer"],
  [/best.{0,6}tigen/g, "confirmer"],
  [/Best.{0,6}tigte[nmrs]?/g, "Confirm\u00e9"],
  [/best.{0,6}tigte[nmrs]?/g, "confirm\u00e9"],
  [/best.{0,6}tigt/g, "confirm\u00e9"],

  [/Teilnehmerzahl/g, "nombre de joueurs"],
  [/Teilnehmerzuweisungen/g, "affectations des joueurs"],
  [/Teilnehmer/g, "joueurs"],
  [/Spielerposition/g, "position du joueur"],
  [/Spieler ausw.{0,6}hlen/g, "choisir les joueurs"],
  [/Spieler anpingen/g, "relancer le joueur"],
  [/Spieler verschluckt/g, "joueur aval\u00e9"],
  [/Spieler/g, "joueur"],

  [/Teams/g, "escouades"],
  [/Team/g, "escouade"],
  [/Gruppe .{0,6}bernehmen/g, "prendre le groupe"],
  [/Gruppenfortschritt/g, "progression des groupes"],
  [/Gruppenverteilung/g, "r\u00e9partition des groupes"],
  [/Gruppenzahl/g, "nombre de groupes"],
  [/Gruppen/g, "groupes"],
  [/Gruppe/g, "groupe"],

  [/Sieg/g, "Victoire"],
  [/Niederlage/g, "D\u00e9faite"],
  [/K.{0,6}mpfe/g, "combats"],
  [/K.{0,6}mpfen/g, "combats"],
  [/Kampfabschluss/g, "fin du combat"],
  [/Kampfteamleiter/g, "responsable d\u2019escouade de combat"],
  [/Kampfteilnehmer/g, "combattants"],
  [/Kampftracker/g, "suivi du combat"],
  [/Kampfrisiko/g, "risque de combat"],
  [/Kampf/g, "combat"],

  [/Schadensschwelle/g, "seuil de d\u00e9g\u00e2ts"],
  [/Schadensrunden/g, "tours de d\u00e9g\u00e2ts"],
  [/Schaden aktualisieren/g, "actualiser les d\u00e9g\u00e2ts"],
  [/Schaden/g, "d\u00e9g\u00e2ts"],

  [/Fehlerwirkung/g, "effet de l\u2019erreur"],
  [/Fehler melden/g, "signaler une erreur"],
  [/Fehler/g, "erreur"],
  [/Warnungen/g, "alertes"],
  [/Warnung/g, "alerte"],
  [/Risikoengine/g, "moteur de risque"],
  [/Risiko/g, "risque"],

  [/Ressourcenscore/g, "score de ressources"],
  [/Ressourcenverlust/g, "perte de ressources"],
  [/Ressourcenhalter/g, "porteur de ressources"],
  [/Ressourcen/g, "ressources"],
  [/Best.{0,6}nde/g, "inventaires"],
  [/Inventarcheck/g, "contr\u00f4le d\u2019inventaire"],
  [/Inventar/g, "inventaire"],
  [/Score at risk/g, "score non s\u00e9curis\u00e9"],
  [/at risk/g, "non s\u00e9curis\u00e9"],

  [/Halter w.{0,6}hlen/g, "choisir le porteur"],
  [/Halter bestimmen/g, "d\u00e9signer le porteur"],
  [/Halter/g, "porteur"],
  [/Koffer/g, "coffre"],

  [/Etagenwarnung/g, "alerte d\u2019\u00e9tage"],
  [/Etagenlicht/g, "lumi\u00e8re d\u2019\u00e9tage"],
  [/Etagenzug.{0,6}nge/g, "acc\u00e8s d\u2019\u00e9tage"],
  [/Etagen/g, "\u00e9tages"],
  [/Etage/g, "\u00e9tage"],
  [/Lichtzust.{0,6}nde/g, "\u00e9tats de lumi\u00e8re"],
  [/Lichtzustand/g, "\u00e9tat de la lumi\u00e8re"],
  [/Lichtlevel/g, "niveau de lumi\u00e8re"],
  [/Lichtverfall/g, "d\u00e9clin de la lumi\u00e8re"],
  [/Licht/g, "lumi\u00e8re"],
  [/Salzverbrauch/g, "consommation de sel"],
  [/Salzmenge/g, "quantit\u00e9 de sel"],
  [/Salz/g, "sel"],

  [/Zielmonster/g, "monstre cible"],
  [/Zielzahl/g, "nombre cible"],
  [/Ziellevel/g, "niveau cible"],
  [/Zieltyp/g, "type cible"],
  [/Zielpositionen/g, "positions cibles"],
  [/Zielposition/g, "position cible"],
  [/Zielelement/g, "\u00e9l\u00e9ment cible"],
  [/Ziele/g, "objectifs"],
  [/Ziel/g, "objectif"],

  [/R.{0,6}tselresultat/g, "r\u00e9sultat d\u2019\u00e9nigme"],
  [/R.{0,6}tsel/g, "\u00e9nigme"],
  [/Sequenz/g, "s\u00e9quence"],
  [/Farbe/g, "couleur"],
  [/Figuren/g, "pi\u00e8ces"],
  [/Figur/g, "pi\u00e8ce"],
  [/Brettern/g, "plateaux"],
  [/Brett/g, "plateau"],
  [/Bootszellen/g, "cases de bateau"],
  [/R.{0,6}ume/g, "salles"],
  [/Raum/g, "salle"],
  [/G.{0,6}rten/g, "jardins"],

  [/Abgeschlossene/g, "Termin\u00e9s"],
  [/Abgeschlossen/g, "Termin\u00e9"],
  [/Abschluss/g, "cl\u00f4ture"],
  [/Aufgabe/g, "mission"],
  [/Zustand/g, "\u00e9tat"],
  [/Status/g, "\u00e9tat"],
  [/Verlust/g, "perte"],
  [/Verluste/g, "pertes"],
  [/R.{0,6}ckweg/g, "retour"],
  [/Zugang/g, "acc\u00e8s"],
  [/Zug.{0,6}nge/g, "acc\u00e8s"],
  [/freischalten/g, "d\u00e9verrouiller"],
  [/freigeben/g, "d\u00e9bloquer"],
  [/.{0,2}ffnen/g, "ouvrir"],
  [/pr.{0,6}fen/g, "v\u00e9rifier"],
  [/sehen/g, "voir"],
  [/anzeigen/g, "afficher"],
  [/erfassen/g, "saisir"],
  [/melden/g, "signaler"],
  [/f.{0,6}hren/g, "conduire"],
  [/verteilen/g, "r\u00e9partir"],
  [/verwenden/g, "utiliser"],
  [/.{0,2}bernehmen/g, "prendre"],
  [/einzahlen/g, "d\u00e9poser"]
];

const skipKeys = new Set([
  "id", "slug", "version", "path", "sourcePath", "target", "source",
  "completionTaskId", "fromTaskIds", "toTaskId", "taskId", "definitionId",
  "sourceTaskDefinitionId", "targetTaskDefinitionId", "eventType", "status",
  "initialStatus", "sourceStatus", "permission", "role", "enum"
]);

function isTechnicalValue(value) {
  if (/^[A-Z0-9_]+$/.test(value)) return true;
  if (/^[A-Z0-9]+-[A-Z0-9-]+$/.test(value)) return true;
  if (/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_[\]-]+)+$/.test(value)) return true;
  return false;
}

function translateValue(value, key) {
  if (skipKeys.has(key) || isTechnicalValue(value)) return value;
  return applyRules(value, visibleRules);
}

function visit(value, key = "") {
  if (typeof value === "string") return translateValue(value, key);
  if (Array.isArray(value)) return value.map((item) => visit(item, key));
  if (value && typeof value === "object") {
    for (const childKey of Object.keys(value)) value[childKey] = visit(value[childKey], childKey);
  }
  return value;
}

for (const file of [
  "platform/contracts/sanctuaire.v0.2.json",
  "platform/contracts/gigalodon.v0.2.json"
]) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  visit(data);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

// remaining visible server errors only
rw("platform/src/server/platform-store.ts", (text) => applyRules(text, [
  [/Mindestens \$\{definition\.participation\.minimum\} Teilnehmer erforderlich\./g, "${definition.participation.minimum} joueurs minimum requis."],
  [/Etagenfortschritt ist noch nicht verf.{0,6}gbar\./g, "La progression des \u00e9tages n\u2019est pas encore disponible."],
  [/Ung.{0,6}ltige Etage\./g, "\u00c9tage invalide."],
  [/Das Etagenlicht beginnt erst mit der Freischaltung der Etage\./g, "La lumi\u00e8re d\u2019\u00e9tage commence seulement apr\u00e8s le d\u00e9verrouillage de l\u2019\u00e9tage."],
  [/Ziellevel muss zwischen 1 und 4 liegen\./g, "Le niveau cible doit \u00eatre compris entre 1 et 4."],
  [/Das Etagenlicht wurde noch nicht freigeschaltet\./g, "La lumi\u00e8re d\u2019\u00e9tage n\u2019est pas encore d\u00e9verrouill\u00e9e."],
  [/Das Ziellevel muss .{0,8}ber dem aktuellen Lichtlevel liegen\./g, "Le niveau cible doit \u00eatre sup\u00e9rieur au niveau de lumi\u00e8re actuel."],
  [/Zuschauer d.{0,8}rfen Inventare nicht .{0,8}ndern\./g, "Les spectateurs ne peuvent pas modifier les inventaires."],
  [/Teilnehmer d.{0,8}rfen nur ihr eigenes Inventar .{0,8}ndern\./g, "Les joueurs ne peuvent modifier que leur propre inventaire."],
  [/Salz ist eine gemeinsame Raidressource und darf nicht im pers.{0,8}nlichen Inventar gespeichert werden\./g, "Le sel est une ressource commune du raid et ne doit pas \u00eatre stock\u00e9 dans l\u2019inventaire personnel."],
  [/Best.{0,8}tigungszeit ist ung.{0,8}ltig\./g, "L\u2019heure de confirmation est invalide."],
  [/Zuschauer d.{0,8}rfen keine Einzahlung best.{0,8}tigen\./g, "Les spectateurs ne peuvent pas confirmer un d\u00e9p\u00f4t."],
  [/Teilnehmer d.{0,8}rfen nur das eigene Inventar einzahlen\./g, "Les joueurs ne peuvent d\u00e9poser que leur propre inventaire."],
  [/F.{0,8}r diesen Teilnehmer wurde noch kein Inventar best.{0,8}tigt\./g, "Aucun inventaire n\u2019a encore \u00e9t\u00e9 confirm\u00e9 pour ce joueur."],
  [/Inventar wurde nicht gefunden\./g, "Inventaire introuvable."],
  [/Es sind keine scoref.{0,8}higen Ressourcen vorhanden\./g, "Aucune ressource comptant pour le score n\u2019est disponible."],
  [/Ung.{0,8}ltige Zahl aktiver K.{0,8}mpfe\./g, "Nombre de combats actifs invalide."],
  [/Der Finalstartcheck wurde nicht best.{0,8}tigt\./g, "Le contr\u00f4le de d\u00e9part final n\u2019a pas \u00e9t\u00e9 confirm\u00e9."],
  [/Aktive K.{0,8}mpfe blockieren den live best.{0,8}tigten Finalstart\./g, "Les combats actifs bloquent le lancement final confirm\u00e9 en jeu."],
  [/Schaden ist ung.{0,8}ltig\./g, "Les d\u00e9g\u00e2ts sont invalides."],
  [/PLAYER_CORRECTED ben.{0,8}tigt eine Best.{0,8}tigungsnotiz\./g, "La correction joueur n\u00e9cessite une note de confirmation."],
  [/Diese Korrektur wurde bereits best.{0,8}tigt\./g, "Cette correction a d\u00e9j\u00e0 \u00e9t\u00e9 confirm\u00e9e."],
  [/Editor darf diese Aufgabe nicht verwalten\./g, "L\u2019\u00e9diteur ne peut pas g\u00e9rer cette mission."]
]));

rw("platform/src/server/solo-test.ts", (text) => applyRules(text, [
  [/Solo-Testmodus ist nicht verf.{0,8}gbar\./g, "Le mode test solo n\u2019est pas disponible."],
  [/Solo-Test/g, "Test solo"],
  [/Nur der Captain darf den Test solo starten\./g, "Seul le capitaine peut lancer le test solo."],
  [/Nur der Captain darf den Solo-Test starten\./g, "Seul le capitaine peut lancer le test solo."]
]));
