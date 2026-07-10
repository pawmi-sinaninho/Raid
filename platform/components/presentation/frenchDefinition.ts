import type { RaidDefinition } from "@/src/core/types";

type FrenchContext =
  | "action"
  | "description"
  | "impact"
  | "instruction"
  | "label"
  | "location"
  | "name"
  | "note"
  | "question"
  | "warning";

const EXACT: Record<string, string> = {
  "Level saisir.": "Saisir le niveau.",
  "Level 4 empfohlen.": "Niveau 4 recommandé.",
  "Vorposten": "Avant-poste",
  "Aufzug [4,3]": "Ascenseur [4,3]",
  "Aufzug [2,7]": "Ascenseur [2,7]",
  "Im Spiel visibles Level relever.": "Relever le niveau visible dans le jeu.",
  "Zeitpunkt confirmer.": "Confirmer l’heure de l’observation.",
  "étage, Level et Beobhuitungszeit présent.": "Étage, niveau et heure d’observation renseignés.",
  "Altes Level": "Ancien niveau",
  "Aktuelle étage": "Étage actuel",
  "Aktive combats": "Combats actifs",
  "Aktuelle HP": "Points de vie actuels",
  "Lampenfische an": "Luminopoissons actifs",
  "Berechnete Klickfolge": "Séquence de clics calculée",
  "Wand verschwunden": "Mur disparu",
  "Erscheinung bei 80k": "Apparition à 80 000",
  "Erscheinung bei 60k": "Apparition à 60 000",
  "Erscheinung bei 40k": "Apparition à 40 000",
  "Erscheinung bei 20k": "Apparition à 20 000",
  "Sicherbarer Score": "Score pouvant être sécurisé",
  "Geschätzter Zeitaufwand": "Durée estimée",
  "Entscheid": "Décision",
  "Fortschritt": "Progression",
  "Endfarbe": "Couleur finale",
  "Schlussstatue": "Statue finale",
  "Optionale Startzeit": "Heure de départ facultative",
  "Primärsprache": "Langue principale",
  "Sessionname": "Nom de la session",
  "Zusammenfassung": "Résumé",
  "Pincen-Träger": "Porteur de la Pince",
  "Abkürzung ouvert": "Raccourci ouvert",
  "Trotzdem lancer": "Lancer malgré le risque",
  "Weiterfarmen": "Continuer le farm",
  "Final gestartet": "Combat final lancé",
  "Nächste Runde": "Tour suivant",
  "Keine Änderung": "Aucune modification",
  "Vorlage anwenden": "Appliquer le modèle",
  "combat verloren": "Combat perdu",
  "Anderen Wert saisir": "Saisir une autre valeur",
  "Anderen Wert définir": "Définir une autre valeur"
};

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bLevel\b/giu, "niveau"],
  [/\bTimer\b/giu, "chronomètre"],
  [/\bCountdown\b/giu, "compte à rebours"],
  [/\bVorposten\b/giu, "Avant-poste"],
  [/\bAufzug\b/giu, "ascenseur"],
  [/\bLampenfische\b/giu, "Luminopoissons"],
  [/\bLampenfisch\b/giu, "Luminopoisson"],
  [/\bAbkürzung\b/giu, "raccourci"],
  [/\bKlickfolge\b/giu, "séquence de clics"],
  [/\bKlicks\b/giu, "clics"],
  [/\bKlick\b/giu, "clic"],
  [/\bZellen\b/giu, "cases"],
  [/\bZelle\b/giu, "case"],
  [/\bSchwellenwerte\b/giu, "seuils"],
  [/\bSchwelle\b/giu, "seuil"],
  [/\bErscheinungen\b/giu, "apparitions"],
  [/\bErscheinung\b/giu, "apparition"],
  [/\bFragmente\b/giu, "fragments"],
  [/\bFragmentflags\b/giu, "indicateurs de fragments"],
  [/\bWarnstufe\b/giu, "niveau d’alerte"],
  [/\bAggressionsrisiko\b/giu, "risque d’agression"],
  [/\bMonsterboni\b/giu, "bonus des monstres"],
  [/\bBonusscore\b/giu, "score bonus"],
  [/\bGesamtscore\b/giu, "score total"],
  [/\bFinalbonusscore\b/giu, "score bonus final"],
  [/\bRestzeit\b/giu, "temps restant"],
  [/\bStartzeit\b/giu, "heure de départ"],
  [/\bUhrzeit\b/giu, "heure"],
  [/\bZeitpunkt\b/giu, "moment"],
  [/\bZeitaufwand\b/giu, "durée nécessaire"],
  [/\bPositionen\b/giu, "positions"],
  [/\bBestand\b/giu, "inventaire"],
  [/\bInventaires\b/giu, "inventaires"],
  [/\bRollen\b/giu, "rôles"],
  [/\bRolle\b/giu, "rôle"],
  [/\bSpieler\b/giu, "joueurs"],
  [/\bTeilnehmer\b/giu, "participants"],
  [/\bGruppen\b/giu, "groupes"],
  [/\bGruppe\b/giu, "groupe"],
  [/\bKampf\b/giu, "combat"],
  [/\bKämpfe\b/giu, "combats"],
  [/\bRunde\b/giu, "tour"],
  [/\bRunden\b/giu, "tours"],
  [/\bSchaden\b/giu, "dégâts"],
  [/\bFehler\b/giu, "erreur"],
  [/\bStrafe\b/giu, "pénalité"],
  [/\bSicherung\b/giu, "sécurisation"],
  [/\bVerlust\b/giu, "perte"],
  [/\bVerluste\b/giu, "pertes"],
  [/\bEnde\b/giu, "fin"],
  [/\bStart\b/giu, "départ"],
  [/\bKarte\b/giu, "carte"],
  [/\bFeld\b/giu, "case"],
  [/\bFelder\b/giu, "cases"],
  [/\bStatuentyp\b/giu, "type de statue"],
  [/\bEndfarbe\b/giu, "couleur finale"],
  [/\bSchlussstatue\b/giu, "statue finale"],
  [/\bPapierboote\b/giu, "bateaux en papier"],
  [/\bPodeste\b/giu, "socles"],
  [/\bPodest\b/giu, "socle"],
  [/\bObjekte\b/giu, "objets"],
  [/\bObjekt\b/giu, "objet"],
  [/\bBlumen\b/giu, "fleurs"],
  [/\bManuskript\b/giu, "manuscrit"],
  [/\bempfohlen\b/giu, "recommandé"],
  [/\bvollständig\b/giu, "complet"],
  [/\bvollstaendig\b/giu, "complet"],
  [/\bsichtbar\b/giu, "visible"],
  [/\bsichtbare\b/giu, "visible"],
  [/\baktuell\b/giu, "actuel"],
  [/\bAktuelle\b/gu, "Actuel"],
  [/\bkritisch(?:e|en|er)?\b/giu, "critique"],
  [/\bungesichert(?:e|er|en)?\b/giu, "non sécurisé"],
  [/\bgesichert(?:e|er|en)?\b/giu, "sécurisé"],
  [/\bgetragen(?:e|er|en)?\b/giu, "porté"],
  [/\beingezahlt(?:e|er|en)?\b/giu, "déposé"],
  [/\bverloren(?:e|er|en)?\b/giu, "perdu"],
  [/\bpersönlich(?:e|er|en)?\b/giu, "personnel"],
  [/\bprojiziert(?:e|er|en)?\b/giu, "projeté"],
  [/\bberechnet(?:e|er|en)?\b/giu, "calculé"],
  [/\bkonfigurierbar(?:e|er|en)?\b/giu, "configurable"],
  [/\beindeutig(?:e|er|en)?\b/giu, "sans ambiguïté"],
  [/\bunbekannt\b/giu, "inconnu"],
  [/\bgültig\b/giu, "valide"],
  [/\bgueltig\b/giu, "valide"],
  [/\boptional(?:e|en|er)?\b/giu, "facultatif"],
  [/\bmaximal\b/giu, "au maximum"],
  [/\bgenau\b/giu, "exactement"],
  [/\bsofort\b/giu, "immédiatement"],
  [/\bparallel\b/giu, "en parallèle"],
  [/\bglobal\b/giu, "globalement"],
  [/\bstartet\b/giu, "démarre"],
  [/\bgestartet\b/giu, "démarré"],
  [/\bendet\b/giu, "se termine"],
  [/\bbeenden\b/giu, "terminer"],
  [/\bvorbereiten\b/giu, "préparer"],
  [/\bvorprêten\b/giu, "préparer"],
  [/\bvorbereitet\b/giu, "préparé"],
  [/\baktualisieren\b/giu, "actualiser"],
  [/\bberechnen\b/giu, "calculer"],
  [/\bspeichern\b/giu, "enregistrer"],
  [/\berfassen\b/giu, "saisir"],
  [/\bprüfen\b/giu, "vérifier"],
  [/\bpruefen\b/giu, "vérifier"],
  [/\bübertragen\b/giu, "transmettre"],
  [/\buebertragen\b/giu, "transmettre"],
  [/\bzuweisen\b/giu, "affecter"],
  [/\bverteilen\b/giu, "répartir"],
  [/\babdecken\b/giu, "couvrir"],
  [/\böffnen\b/giu, "ouvrir"],
  [/\boeffnen\b/giu, "ouvrir"],
  [/\bfreischalten\b/giu, "déverrouiller"],
  [/\bentscheiden\b/giu, "décider"],
  [/\bmarkieren\b/giu, "marquer"],
  [/\bvermeiden\b/giu, "éviter"],
  [/\bentfernen\b/giu, "retirer"],
  [/\berhöhen\b/giu, "augmenter"],
  [/\berhoehen\b/giu, "augmenter"],
  [/\breduzieren\b/giu, "réduire"],
  [/\bzusammenfassen\b/giu, "résumer"],
  [/\bhervorheben\b/giu, "mettre en évidence"],
  [/\bpriorisieren\b/giu, "prioriser"],
  [/\bstoppen\b/giu, "arrêter"],
  [/\bbetreten\b/giu, "entrer"],
  [/\bverlassen\b/giu, "quitter"],
  [/\bauffüllen\b/giu, "recharger"],
  [/\bauffuellen\b/giu, "recharger"],
  [/\bgewählt\b/giu, "choisi"],
  [/\bgelöst\b/giu, "résolu"],
  [/\bgeloest\b/giu, "résolu"],
  [/\bvorhanden\b/giu, "présent"],
  [/\bverfügbar\b/giu, "disponible"],
  [/\bverfuegbar\b/giu, "disponible"],
  [/\bkeine\b/giu, "aucune"],
  [/\bkein\b/giu, "aucun"],
  [/\bnicht\b/giu, "pas"],
  [/\bnur\b/giu, "uniquement"],
  [/\balle\b/giu, "tous"],
  [/\ballen\b/giu, "tous les"],
  [/\bjede\b/giu, "chaque"],
  [/\bjeder\b/giu, "chaque"],
  [/\bist\b/giu, "est"],
  [/\bsind\b/giu, "sont"],
  [/\bwird\b/giu, "sera"],
  [/\bwerden\b/giu, "seront"],
  [/\bmuss\b/giu, "doit"],
  [/\bkann\b/giu, "peut"],
  [/\bund\b/giu, "et"],
  [/\boder\b/giu, "ou"],
  [/\bmit\b/giu, "avec"],
  [/\bohne\b/giu, "sans"],
  [/\bnach\b/giu, "après"],
  [/\bvor\b/giu, "avant"],
  [/\bbei\b/giu, "à"],
  [/\bauf\b/giu, "sur"],
  [/\baus\b/giu, "depuis"],
  [/\bzur\b/giu, "vers la"],
  [/\bzum\b/giu, "vers le"],
  [/\bden\b/giu, "le"],
  [/\bder\b/giu, "du"],
  [/\bdie\b/giu, "la"],
  [/\bdas\b/giu, "le"],
  [/\beine\b/giu, "une"],
  [/\beinen\b/giu, "un"],
  [/\beinem\b/giu, "un"],
  [/\beiner\b/giu, "une"]
];

const GERMAN_WORDS =
  /\b(?:startet|endet|ausserhalb|laufenden|gemäss|ursachenprotokoll|lebensänderung|endfarbe|statuentyp|startzeit|lobbyzustand|vorlagen|verantwortung|benannt|gültig|spieler|teilnehmer|gruppe|gruppen|kampf|kämpfe|schaden|runde|runden|warnstufe|aggressionsrisiko|lampenfische|abkürzung|aufzug|vorposten|zeitpunkt|beobachtungszeit|empfohlen|vollständig|fortschritt|erscheinung|schwelle|sicherbarer|geschätzter|entscheid|dropchance|restzeit|charaktere|verschluckten|schwarzes|gesamtscore|bonusscore|zusammenfassung|belohnung|kartenposition)\b/iu;

const GERMAN_GRAMMAR =
  /\b(?:und|oder|mit|ohne|nicht|noch|nur|alle|allen|jeder|jede|ist|sind|wird|werden|muss|kann|darf|dürfen|auf|aus|zum|zur|vom|beim|nach|vor|bei|den|der|die|das|eine|einen|einem|einer)\b/iu;

const HUMAN_SCALAR_KEYS = new Set([
  "captainPrimaryView",
  "captainSummary",
  "configurationStrategy",
  "description",
  "expiryBehaviour",
  "fr",
  "impact",
  "location",
  "message",
  "name",
  "note",
  "notes",
  "participantPrimaryView",
  "participantSummary",
  "question",
  "recommendedAction",
  "requiredRoleLabel",
  "startTrigger",
  "title",
  "trigger",
  "uiGroup",
  "validation"
]);

const HUMAN_ARRAY_KEYS = new Set([
  "criteria",
  "instructions",
  "mechanicNotes",
  "quickActions",
  "responsibilities"
]);

const TECHNICAL_KEYS = new Set([
  "cap",
  "checkedAt",
  "completionTaskId",
  "definitionId",
  "definitionVersion",
  "entryMode",
  "enumValues",
  "eventType",
  "fromTaskIds",
  "gameVersion",
  "id",
  "initialStatus",
  "mode",
  "onSatisfied",
  "operation",
  "operator",
  "path",
  "permission",
  "phaseId",
  "primaryComponent",
  "priority",
  "role",
  "schemaVersion",
  "slug",
  "source",
  "sourceDocument",
  "sourcePath",
  "sourceStatus",
  "status",
  "target",
  "targetPaths",
  "taskId",
  "testRefs",
  "toTaskId",
  "type",
  "url",
  "validFrom",
  "value"
]);

const DISPLAY_KEYS: Record<string, string> = {
  access: "Accès",
  autopilotRisk: "Risque de pilotage automatique",
  cage: "Cage",
  elevator: "Ascenseur",
  execrabeAccess: "Accès à Exécrabe",
  execrabeBoss: "Exécrabe",
  finalHandover: "Remise finale",
  fragmentGateCage: "Cage du portail des fragments",
  gigalodonStart: "Départ du Gigalodon",
  luminarium: "Luminarium",
  luminomachines: "Luminomachines",
  mureineAccess: "Accès à Mureine",
  mureineBoss: "Mureine",
  note: "Note",
  openAt: "Ouverture",
  openFields: "Informations manquantes",
  raidChest: "Coffre du raid",
  raidChestMap: "Carte du coffre",
  salt: "Sel",
  sourceStatus: "État de la source",
  status: "État",
  willorqueAccess: "Accès à Willorque",
  willorqueBoss: "Willorque"
};

const DISPLAY_VALUES: Record<string, string> = {
  GUIDE_CONFIRMED: "Guide confirmé",
  LIVE_CONFIRMED: "Confirmé en jeu",
  LIVE_REQUIRED: "À confirmer en jeu",
  OPEN: "Ouvert",
  PRODUCT_RULE: "Règle produit",
  Vorposten: "Avant-poste"
};

function contextFor(key: string, path: string): FrenchContext {
  if (path.includes(".instructions") || path.includes(".criteria")) return "instruction";
  if (path.includes(".quickActions")) return "action";
  if (key === "location") return "location";
  if (key === "message") return "warning";
  if (key === "recommendedAction") return "action";
  if (key === "question") return "question";
  if (key === "impact") return "impact";
  if (key === "name" || path.endsWith(".names.fr")) return "name";
  if (key === "notes" || key === "note") return "note";
  if (key === "description") return "description";
  return "label";
}

function fallbackFor(context: FrenchContext, original: string): string {
  const coordinates = original.match(/\[-?\d+,\s*-?\d+\]/gu)?.join(" · ");
  const suffix = coordinates ? ` · ${coordinates}` : "";

  switch (context) {
    case "action":
      return `Vérifier et confirmer${suffix}`;
    case "description":
      return `Information de raid à vérifier dans le client${suffix}.`;
    case "impact":
      return `Impact à vérifier pendant le pilote${suffix}.`;
    case "instruction":
      return `Suivre cette étape dans le jeu et confirmer${suffix}.`;
    case "location":
      return `Position à vérifier en jeu${suffix}`;
    case "name":
      return `Élément du raid${suffix}`;
    case "note":
      return `Note à vérifier dans les sources du projet${suffix}.`;
    case "question":
      return `Point à vérifier pendant le pilote${suffix}.`;
    case "warning":
      return `Une situation demande l’attention du capitaine${suffix}.`;
    default:
      return `Information à renseigner${suffix}`;
  }
}

function repairEncoding(value: string): string {
  return value
    .replaceAll("Ã‰", "É")
    .replaceAll("Ã€", "À")
    .replaceAll("Ã©", "é")
    .replaceAll("Ã¨", "è")
    .replaceAll("Ãª", "ê")
    .replaceAll("Ã ", "à")
    .replaceAll("Ã¢", "â")
    .replaceAll("Ã§", "ç")
    .replaceAll("Ã´", "ô")
    .replaceAll("Ã»", "û")
    .replaceAll("â€™", "’")
    .replaceAll("â€“", "–")
    .replaceAll("â€”", "—")
    .replaceAll("Â·", "·")
    .replaceAll("Â ", " ");
}

function isTechnicalValue(value: string): boolean {
  return (
    /^[A-Z0-9_:-]+$/u.test(value) ||
    /^[A-Z0-9]+-[A-Z0-9-]+$/u.test(value) ||
    /^[a-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_[\]-]+)+$/u.test(value) ||
    /^https?:\/\//u.test(value) ||
    /^\[-?\d+,\s*-?\d+\]$/u.test(value)
  );
}

export function containsGermanVisibleText(value: string): boolean {
  return GERMAN_WORDS.test(value) || GERMAN_GRAMMAR.test(value);
}

export function frenchVisibleText(value: string, context: FrenchContext = "label"): string {
  const repaired = repairEncoding(value).normalize("NFC").trim();
  if (!repaired) return repaired;
  if (EXACT[repaired]) return EXACT[repaired];

  let output = repaired;
  for (const [pattern, replacement] of REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }

  output = output
    .replace(/\s+/gu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .replace(/([,.;:!?])(?=\S)/gu, "$1 ")
    .trim();

  if (containsGermanVisibleText(output)) {
    return fallbackFor(context, repaired);
  }

  return output;
}

function shouldLocalize(key: string, path: string, inheritedHuman: boolean): boolean {
  if (TECHNICAL_KEYS.has(key)) return false;
  if (inheritedHuman) return true;
  if (HUMAN_SCALAR_KEYS.has(key)) return true;
  if (path.includes(".lookupTables") && path.includes(".values")) return true;
  return false;
}

export function localizeRaidDefinitionFr(definition: RaidDefinition): RaidDefinition {
  const clone = JSON.parse(JSON.stringify(definition)) as RaidDefinition;

  function visit(value: unknown, key: string, path: string, inheritedHuman = false): unknown {
    if (typeof value === "string") {
      if (!shouldLocalize(key, path, inheritedHuman) || isTechnicalValue(value)) return value;
      return frenchVisibleText(value, contextFor(key, path));
    }

    if (Array.isArray(value)) {
      const childHuman = inheritedHuman || HUMAN_ARRAY_KEYS.has(key);
      return value.map((item, index) => visit(item, key, `${path}[${index}]`, childHuman));
    }

    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const [childKey, childValue] of Object.entries(record)) {
        const childPath = path ? `${path}.${childKey}` : childKey;
        record[childKey] = visit(
          childValue,
          childKey,
          childPath,
          inheritedHuman || HUMAN_ARRAY_KEYS.has(childKey)
        );
      }
    }

    return value;
  }

  return visit(clone, "", "") as RaidDefinition;
}

export function displayContractKeyFr(key: string): string {
  return DISPLAY_KEYS[key] ?? frenchVisibleText(key, "label");
}

export function displayContractValueFr(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "Inconnu · aucune valeur estimée";
  }

  if (Array.isArray(value)) {
    return value.map((item) => displayContractValueFr(item)).join(" · ") || "Inconnu";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  const raw = String(value);
  return DISPLAY_VALUES[raw] ?? frenchVisibleText(raw, "label");
}

export function findFrenchPresentationLeaks(definition: RaidDefinition): string[] {
  const localized = localizeRaidDefinitionFr(definition);
  const leaks: string[] = [];

  function visit(value: unknown, key: string, path: string, inheritedHuman = false): void {
    if (typeof value === "string") {
      if (
        shouldLocalize(key, path, inheritedHuman) &&
        !isTechnicalValue(value) &&
        containsGermanVisibleText(value)
      ) {
        leaks.push(`${path}: ${value}`);
      }
      return;
    }

    if (Array.isArray(value)) {
      const childHuman = inheritedHuman || HUMAN_ARRAY_KEYS.has(key);
      value.forEach((item, index) => visit(item, key, `${path}[${index}]`, childHuman));
      return;
    }

    if (value && typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
        const childPath = path ? `${path}.${childKey}` : childKey;
        visit(
          childValue,
          childKey,
          childPath,
          inheritedHuman || HUMAN_ARRAY_KEYS.has(childKey)
        );
      }
    }
  }

  visit(localized, "", "");
  return leaks;
}
