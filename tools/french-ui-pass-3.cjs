const fs = require("node:fs");

function rw(path, fn) {
  if (!fs.existsSync(path)) return;
  const before = fs.readFileSync(path, "utf8");
  const after = fn(before);
  if (after !== before) fs.writeFileSync(path, after, "utf8");
}

function replaceAll(text, pairs) {
  for (const [from, to] of pairs) {
    text = text.split(from).join(to);
  }
  return text;
}

// 1) Visible source-status enum labels in UI
rw("platform/components/SessionApp.tsx", (text) => {
  if (!text.includes("function sourceStatusLabel")) {
    text = text.replace(
      /const STATUS_LABELS: Record<TaskStatus, string> = \{[\s\S]*?\};/,
      (match) => `${match}

function sourceStatusLabel(status: string) {
  if (status === "LIVE_CONFIRMED") return "Confirm\u00e9 en jeu";
  if (status === "LIVE_REQUIRED") return "Non confirm\u00e9 en jeu";
  if (status === "GUIDE_CONFIRMED") return "Guide confirm\u00e9";
  if (status === "OFFICIAL_CONFIRMED") return "Source officielle";
  if (status === "PLAYER_CORRECTED") return "Corrig\u00e9 par les joueurs";
  return status;
}`
    );
  }

  text = text.replace(
    /<span className="source-label">\{report\.sourceStatus\}<\/span>/g,
    '<span className="source-label">{sourceStatusLabel(report.sourceStatus)}</span>'
  );

  return text;
});

// 2) Remaining visible server/build error strings
rw("platform/src/server/platform-store.ts", (text) => {
  return text.replace(
    /`Mindestens \$\{definition\.participation\.minimum\} Teilnehmer erforderlich\.`/g,
    '`${definition.participation.minimum} joueurs minimum requis.`'
  );
});

rw("platform/src/core/definition-loader.ts", (text) => replaceAll(text, [
  ["Task-IDs sind nicht eindeutig", "Les identifiants de mission ne sont pas uniques"],
  ["unbekanntes Ziel", "destination inconnue"],
  ["unbekannte Quelle", "source inconnue"],
  ["Zyklische Abh\u00e4ngigkeit bei", "D\u00e9pendance cyclique sur"]
]));

// 3) Contract translations: human-facing values only.
// Internal keys, paths, IDs and enum values stay untouched.
const pairs = [
  ["Captain best\u00e4tigt", "Le capitaine confirme"],
  ["Captain entscheidet.", "Le capitaine d\u00e9cide."],
  ["Captain und Ersatzeditor online best\u00e4tigen.", "Confirmer que le capitaine et l\u2019\u00e9diteur de secours sont en ligne."],
  ["Captain-, Teilnehmer- und optional Zuschauerlink erzeugen.", "G\u00e9n\u00e9rer les liens capitaine, joueur et spectateur optionnel."],
  ["Ready-Check starten", "Lancer l\u2019appel de pr\u00e9paration"],
  ["Ready-Check und Abgleich mit dem In-Game-Raid.", "Appel de pr\u00e9paration et comparaison avec le raid en jeu."],
  ["Live-Modus", "mode direct"],
  ["Finalkampf", "combat final"],
  ["Finalstart", "lancement du combat final"],
  ["Startfreigabe", "autorisation de d\u00e9part"],
  ["Startsignal", "signal de d\u00e9part"],
  ["Startcheck", "contr\u00f4le de d\u00e9part"],
  ["Start blockiert", "D\u00e9part bloqu\u00e9"],
  ["Starten", "D\u00e9marrer"],
  ["Start", "D\u00e9part"],

  ["Teilnehmerzahl g\u00fcltig.", "Nombre de joueurs valide."],
  ["Teilnehmer", "joueurs"],
  ["Spielerposition", "position du joueur"],
  ["Spieler ausw\u00e4hlen", "Choisir les joueurs"],
  ["Spieler anpingen", "Relancer le joueur"],
  ["Spieler verschluckt", "Joueur aval\u00e9"],
  ["Spieler", "joueur"],

  ["Team bereit", "Escouade pr\u00eate"],
  ["Team best\u00e4tigen", "Confirmer l\u2019escouade"],
  ["Team vervollst\u00e4ndigen", "Compl\u00e9ter l\u2019escouade"],
  ["Teams verteilen", "R\u00e9partir les escouades"],
  ["Teams", "escouades"],
  ["Team", "escouade"],

  ["Bereitschaft best\u00e4tigen", "Confirmer la pr\u00e9paration"],
  ["Bereite Teilnehmer", "Joueurs pr\u00eats"],
  ["Bereit", "Pr\u00eat"],
  ["Best\u00e4tigung", "confirmation"],
  ["Best\u00e4tigungen", "confirmations"],
  ["best\u00e4tigen", "confirmer"],
  ["Best\u00e4tigen", "Confirmer"],
  ["best\u00e4tigt", "confirm\u00e9"],
  ["Best\u00e4tigt", "Confirm\u00e9"],
  ["best\u00e4tigte", "confirm\u00e9e"],
  ["best\u00e4tigter", "confirm\u00e9"],
  ["best\u00e4tigtem", "confirm\u00e9"],
  ["best\u00e4tigten", "confirm\u00e9"],
  ["unbest\u00e4tigt", "non confirm\u00e9"],
  ["Unbest\u00e4tigte", "Non confirm\u00e9s"],
  ["Zweitbest\u00e4tigung", "Deuxi\u00e8me confirmation"],
  ["zweitbest\u00e4tigt", "confirm\u00e9 par une deuxi\u00e8me personne"],

  ["Niederlage", "D\u00e9faite"],
  ["Sieg", "Victoire"],
  ["Kampf starten", "Lancer le combat"],
  ["Kampf verloren", "Combat perdu"],
  ["Kampf beendet", "Combat termin\u00e9"],
  ["Kampf aktiv", "Combat actif"],
  ["Kampfabschluss", "fin du combat"],
  ["Kampfteilnehmer", "combattants"],
  ["K\u00e4mpfe", "combats"],
  ["Kampf", "combat"],

  ["Schadensschwelle", "seuil de d\u00e9g\u00e2ts"],
  ["Schadensrunden", "tours de d\u00e9g\u00e2ts"],
  ["Schaden aktualisieren", "Actualiser les d\u00e9g\u00e2ts"],
  ["Schaden", "d\u00e9g\u00e2ts"],
  ["Runden", "tours"],
  ["Runde", "tour"],

  ["Fehler melden", "Signaler une erreur"],
  ["Fehlerwirkung", "effet de l\u2019erreur"],
  ["Fehler", "erreur"],
  ["Warnungen", "alertes"],
  ["Warnung", "alerte"],
  ["Risikoengine", "moteur de risque"],
  ["Risiko", "risque"],
  ["Riskante", "Risqu\u00e9s"],

  ["Ressourcenscore", "score de ressources"],
  ["Ressourcenverlust", "perte de ressources"],
  ["Ressourcenhalter", "porteur de ressources"],
  ["Ressourcen", "ressources"],
  ["Inventarcheck", "contr\u00f4le d\u2019inventaire"],
  ["Inventarbest\u00e4tigung", "confirmation d\u2019inventaire"],
  ["Inventar", "inventaire"],
  ["Best\u00e4nde", "inventaires"],
  ["Score at risk", "score non s\u00e9curis\u00e9"],
  ["at risk", "non s\u00e9curis\u00e9"],
  ["ungesichert", "non s\u00e9curis\u00e9"],
  ["sichern", "s\u00e9curiser"],
  ["einzahlen", "d\u00e9poser"],
  ["Einzahlung", "d\u00e9p\u00f4t"],

  ["Halter sofort zum Koffer f\u00fchren.", "Conduire imm\u00e9diatement le porteur au coffre."],
  ["Halter w\u00e4hlen", "Choisir le porteur"],
  ["Halter bestimmen", "D\u00e9signer le porteur"],
  ["Halter", "porteur"],
  ["Koffer", "coffre"],

  ["Etagenlicht", "lumi\u00e8re d\u2019\u00e9tage"],
  ["Etagenwarnung", "alerte d\u2019\u00e9tage"],
  ["Etagen", "\u00e9tages"],
  ["Etage", "\u00e9tage"],
  ["Lichtlevel", "niveau de lumi\u00e8re"],
  ["Lichtzustand", "\u00e9tat de la lumi\u00e8re"],
  ["Lichtstufen", "niveaux de lumi\u00e8re"],
  ["Licht", "lumi\u00e8re"],
  ["Salzverbrauch", "consommation de sel"],
  ["Salzmenge", "quantit\u00e9 de sel"],
  ["Salz", "sel"],

  ["Gruppenzahl", "nombre de groupes"],
  ["Gruppenfortschritt", "progression des groupes"],
  ["Gruppenverteilung", "r\u00e9partition des groupes"],
  ["Gruppen", "groupes"],
  ["Gruppe", "groupe"],

  ["Zielmonster", "monstre cible"],
  ["Zielzahl", "nombre cible"],
  ["Zieltyp", "type cible"],
  ["Zielpositionen", "positions cibles"],
  ["Zielposition", "position cible"],
  ["Zielelement", "\u00e9l\u00e9ment cible"],
  ["Ziel", "objectif"],
  ["Ziele", "objectifs"],

  ["R\u00e4tselresultat", "r\u00e9sultat d\u2019\u00e9nigme"],
  ["R\u00e4tsel", "\u00e9nigme"],
  ["Sequenz", "s\u00e9quence"],
  ["Farbe", "couleur"],
  ["Figuren", "pi\u00e8ces"],
  ["Figur", "pi\u00e8ce"],
  ["Brett", "plateau"],
  ["Brettern", "plateaux"],
  ["Bootszellen", "cases de bateau"],
  ["R\u00e4ume", "salles"],
  ["Raum", "salle"],
  ["G\u00e4rten", "jardins"],

  ["Guide-Baseline", "base du guide"],
  ["Guidebasierte Baseline", "base issue du guide"],
  ["Baseline", "base"],
  ["live pr\u00fcfen", "v\u00e9rifier en jeu"],
  ["live zu pr\u00fcfen", "\u00e0 v\u00e9rifier en jeu"],
  ["noch nicht durch RAIDWEAVE live best\u00e4tigt", "pas encore confirm\u00e9 en jeu par RAIDWEAVE"],
  ["In-Game", "en jeu"],
  ["im Spiel", "en jeu"],

  ["Abschluss", "cl\u00f4ture"],
  ["Abgeschlossen", "Termin\u00e9"],
  ["Aufgabe", "mission"],
  ["Mission", "mission"],
  ["offenes", "ouvert"],
  ["offene", "ouverte"],
  ["Warte", "Attente"],
  ["Blockade", "blocage"],
  ["blockiert", "bloqu\u00e9"],
  ["freischalten", "d\u00e9verrouiller"],
  ["freigeben", "d\u00e9bloquer"],
  ["\u00f6ffnen", "ouvrir"],
  ["pr\u00fcfen", "v\u00e9rifier"],
  ["anzeigen", "afficher"],
  ["sehen", "voir"],
  ["melden", "signaler"],
  ["erfassen", "saisir"],
  ["verwenden", "utiliser"],
  ["verteilen", "r\u00e9partir"]
];

const technicalKeys = new Set([
  "id", "slug", "version", "type", "path", "sourcePath", "target", "source",
  "completionTaskId", "fromTaskIds", "toTaskId", "taskId", "definitionId",
  "sourceTaskDefinitionId", "targetTaskDefinitionId", "eventType", "status",
  "initialStatus", "sourceStatus", "permission", "role", "enum"
]);

function isTechnicalString(value) {
  if (/^[A-Z0-9_]+$/.test(value)) return true;
  if (/^[A-Z0-9]+-[A-Z0-9-]+$/.test(value)) return true;
  if (/^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9_[\]-]+)+$/.test(value)) return true;
  if (/^[A-Za-z0-9_]+\[\]$/.test(value)) return true;
  return false;
}

function translateString(value, key) {
  if (technicalKeys.has(key) || isTechnicalString(value)) return value;
  return replaceAll(value, pairs);
}

function visit(value, key = "") {
  if (typeof value === "string") return translateString(value, key);
  if (Array.isArray(value)) return value.map((item) => visit(item, key));
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) {
      value[childKey] = visit(childValue, childKey);
    }
  }
  return value;
}

for (const file of [
  "platform/contracts/sanctuaire.v0.2.json",
  "platform/contracts/gigalodon.v0.2.json"
]) {
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  visit(data);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
