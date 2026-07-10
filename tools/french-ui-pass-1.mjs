import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, text) {
  fs.writeFileSync(path, text, { encoding: "utf8" });
}

function replaceAll(path, replacements) {
  let text = read(path);
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  write(path, text);
}

function replaceRegex(path, replacements) {
  let text = read(path);
  for (const [from, to] of replacements) {
    text = text.replace(from, to);
  }
  write(path, text);
}

// 1) Wow Layer: visible labels
replaceRegex("platform/components/wow/WowLayerPanel.tsx", [
  [
    /const STATUS_LABELS: Record<string, string> = \{([\s\S]*?)\};/,
    `const STATUS_LABELS: Record<string, string> = {$1};

const RISK_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  ATTENTION: "Attention",
  HIGH: "Élevé",
  CRITICAL: "Critique"
};`
  ]
]);

replaceAll("platform/components/wow/WowLayerPanel.tsx", [
  ['Phase 9B · Wow Layer', 'Phase 9B · Couche tactique'],
  ['Action intelligente', 'Prochaine action conseillée'],
  ['Aucune action prioritaire', 'Aucune priorité immédiate'],
  ['Le raid ne signale aucune priorité calculable.', 'Aucune priorité fiable ne ressort de l’état actuel du raid.'],
  ['Carte de workflow, pas une capture de la carte du jeu.', 'Carte de progression, pas une capture de la carte du jeu.'],
  ['Responsabilité non confirmée', 'Responsable non confirmé'],
  ['Risques calculés', 'Risques détectés']
]);

replaceRegex("platform/components/wow/WowLayerPanel.tsx", [
  [/<span>\{risk\.level\}<\/span>/g, '<span>{RISK_LABELS[risk.level] ?? risk.level}</span>']
]);

// 2) Wow Layer core: remove English-ish wording in generated labels
replaceAll("platform/src/core/wow-layer.ts", [
  ['Carte de plongée vivante', 'Carte de plongée dynamique'],
  ['Carte de route vivante', 'Plan de raid dynamique'],
  ['Carte de workflow, pas une capture de la carte du jeu.', 'Carte de progression, pas une capture de la carte du jeu.'],
  ['Ordre structurel calculé depuis les statuts et dépendances. Aucune durée restante n’est inventée.', 'Ordre critique déduit des statuts et des dépendances. Aucune durée restante n’est inventée.'],
  ['Replay partiel', 'Résumé partiel']
]);

// 3) SessionApp: visible non-French leftovers
replaceAll("platform/components/SessionApp.tsx", [
  ['throw new Error("SSE unavailable")', 'throw new Error("Flux de synchronisation indisponible")'],
  ['Solo-Test konnte nicht gestartet werden.', 'Le test solo n’a pas pu démarrer.'],
  ['Team overview', 'Vue des escouades'],
  ['Score', 'Score'],
  ['Alertes', 'Alertes']
]);

// 4) Solo-test button: German error fallback
replaceAll("platform/components/solo-test/SoloTestButton.tsx", [
  ['Solo-Test konnte nicht gestartet werden.', 'Le test solo n’a pas pu démarrer.'],
  ['Solo-Test', 'Test solo']
]);

// 5) Gigalodon UI: button labels and raw status/source fragments
replaceAll("platform/components/GigalodonCommandCenter.tsx", [
  ['>VICTORY</button>', '>Victoire</button>'],
  ['>DEFEAT</button>', '>Défaite</button>'],
  ['18 ou 20 · LIVE_REQUIRED', '18 ou 20 · non confirmé en jeu'],
  ['<StatusStamp tone="source">LIVE_REQUIRED</StatusStamp>', '<StatusStamp tone="source">Non confirmé en jeu</StatusStamp>'],
  ['COMBAT FINAL', 'Combat final'],
  ['EN COURS', 'En cours'],
  ['Baseline', 'Base'],
  ['Score ressources', 'Score des ressources'],
  ['Score total', 'Score total'],
  ['Bonus final', 'Bonus final']
]);

// 6) LightBay: show source statuses in French instead of raw enum
let lightBay = read("platform/components/gigalodon/LightBay.tsx");

if (!lightBay.includes("function sourceStatusLabel")) {
  lightBay = lightBay.replace(
    'import type { SourceStatus } from "@/src/core/types";',
    `import type { SourceStatus } from "@/src/core/types";

function sourceStatusLabel(status: SourceStatus) {
  if (status === "LIVE_CONFIRMED") return "Confirmé en jeu";
  if (status === "LIVE_REQUIRED") return "Non confirmé en jeu";
  if (status === "GUIDE_CONFIRMED") return "Guide confirmé";
  if (status === "OFFICIAL_CONFIRMED") return "Source officielle";
  if (status === "PLAYER_CORRECTED") return "Corrigé par les joueurs";
  return status;
}`
  );
}

lightBay = lightBay
  .split("Baseline").join("Base")
  .replace(/\{reading\.sourceStatus\}/g, "{sourceStatusLabel(reading.sourceStatus)}");

write("platform/components/gigalodon/LightBay.tsx", lightBay);

// 7) Common contract/user-visible German quick actions.
// Do not touch enum keys, sourceStatus values, command types, or internal IDs.
for (const path of [
  "platform/contracts/sanctuaire.v0.2.json",
  "platform/contracts/gigalodon.v0.2.json"
]) {
  if (!fs.existsSync(path)) continue;

  replaceAll(path, [
    ["Session erstellen", "Créer une session"],
    ["Session beitreten", "Rejoindre la session"],
    ["Bereit", "Prêt"],
    ["Abgeschlossen", "Terminé"],
    ["Status bestätigen", "Confirmer l’état"],
    ["Gruppe übernehmen", "Prendre un groupe"],
    ["Sieg bestätigen", "Confirmer la victoire"],
    ["Sieg", "Victoire"],
    ["Niederlage", "Défaite"],
    ["Start blockiert", "Départ bloqué"],
    ["Schaden aktualisieren", "Actualiser les dégâts"],
    ["Spieler verschluckt", "Joueur avalé"],
    ["Spieler anpingen", "Relancer le joueur"],
    ["Captain entscheidet.", "Le capitaine décide."],
    ["Team bereit", "Équipe prête"],
    ["Bestätigten Score verwenden.", "Utiliser le score confirmé."],
    ["Bestätigten Score prüfen.", "Vérifier le score confirmé."],
    ["Score und Zeit bis Finalstart speichern.", "Enregistrer le score et le temps avant le lancement du combat final."],
    ["Verluste, Warnungen und Engpässe zusammenfassen.", "Résumer les pertes, les alertes et les blocages."],
    ["Endzustand und Score bestätigt.", "État final et score confirmés."],
    ["Finalstart ausführen.", "Lancer le combat final."],
    ["Farming abbrechen und Finalstart ausführen.", "Arrêter le farm et lancer le combat final."],
    ["Halter sofort zum Koffer führen.", "Amener immédiatement le porteur au coffre."],
    ["Salzverantwortlichen aktivieren.", "Activer le responsable du sel."],
    ["Vier Schwellenwerte zweitbestätigen.", "Faire confirmer les quatre seuils par une deuxième personne."],
    ["Halter bestimmen; Handel ist deaktiviert.", "Identifier le porteur ; l’échange est désactivé."],
    ["Kämpfe beenden oder kontrollierten Startversuch dokumentieren.", "Terminer les combats ou documenter une tentative de départ contrôlée."],
    ["Bestand und Position aktualisieren.", "Actualiser l’inventaire et la position."],
    ["Zwischeneinzahlung oder sicheren Rückweg priorisieren.", "Prioriser un dépôt intermédiaire ou un retour sécurisé."],
    ["Hoher Score ist ungesichert unterwegs.", "Un score élevé circule sans être sécurisé."],
    ["Guide-Baseline", "Base guide"],
    ["Score at risk", "score non sécurisé"],
    ["at risk", "non sécurisé"]
  ]);
}
