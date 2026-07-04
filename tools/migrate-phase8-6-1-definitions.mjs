import { readFile, writeFile } from "node:fs/promises";

const files = ["gigalodon.v0.2.json", "sanctuaire.v0.2.json"];

function migrateTrust(value) {
  if (Array.isArray(value)) return value.map(migrateTrust);
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "verificationStatus") continue;
    if (key === "sourceStatus") {
      output[key] = nested === "OFFICIAL" ? "OFFICIAL_CONFIRMED"
        : nested === "GUIDE" || nested === "MIXED" ? "GUIDE_CONFIRMED"
        : nested;
    } else output[key] = migrateTrust(nested);
  }
  return output;
}

for (const file of files) {
  const source = JSON.parse(await readFile(file, "utf8"));
  const definition = migrateTrust(source);
  definition.definitionVersion = "0.2.1";

  if (file.startsWith("gigalodon")) {
    const fields = definition.stateModel.raidSpecificFields;
    const inventories = fields.find((field) => field.path === "gigalodon.participantInventories");
    inventories.description = "Persönliche getragene Score- und Unique-Ressourcen; Salz ist ausdrücklich ausgeschlossen";
    if (!fields.some((field) => field.path === "gigalodon.saltPool")) fields.splice(fields.indexOf(inventories), 0, {
      path: "gigalodon.saltPool",
      type: "object",
      description: "Serverautoritärer gemeinsamer Salzpool mit unveränderlichem Änderungsledger",
      sourceStatus: "GUIDE_CONFIRMED",
      default: { amount: 0, lastChange: null, history: [], collectorParticipantIds: [], refillerParticipantIds: [] }
    });
    const additionalFields = [
      { path: "gigalodon.lightIntervalSeconds", type: "integer", description: "Guide-Baseline des Lichtverfalls", sourceStatus: "GUIDE_CONFIRMED", default: 120, minimum: 30, maximum: 600 },
      { path: "gigalodon.lightIntervalSourceStatus", type: "string", description: "Vertrauensstatus des Lichtintervalls", sourceStatus: "GUIDE_CONFIRMED", default: "GUIDE_CONFIRMED" },
      { path: "gigalodon.saltCostSourceStatus", type: "string", description: "Vertrauensstatus der Salzkosten", sourceStatus: "GUIDE_CONFIRMED", default: "GUIDE_CONFIRMED" },
      { path: "gigalodon.floor1GroupTargetSourceStatus", type: "string", description: "Vertrauensstatus der Etage--1-Gruppenzahl", sourceStatus: "LIVE_REQUIRED", default: "LIVE_REQUIRED" }
    ];
    fields.push(...additionalFields.filter((field) => !fields.some((existing) => existing.path === field.path)));

    const cost = definition.lookupTables.find((table) => table.id === "GIG-LIGHT-COST-TO-LEVEL");
    cost.description = "Kumulative Einzelschritte 0→1, 1→2, 2→3 und 3→4; Guide-Baseline, noch nicht RAIDWEAVE-live-bestätigt.";
    cost.sourceStatus = "GUIDE_CONFIRMED";

    const score = definition.lookupTables.find((table) => table.id === "GIG-RESOURCE-SCORE");
    score.description = "Punkte pro eingezahlter persönlicher Ressource; Salz bleibt gemeinsame Raidressource mit 0 Punkten.";

    const locations = definition.lookupTables.find((table) => table.id === "GIG-FLOOR-LOCATIONS");
    locations.description = "Vollständiger Lookup der eindeutig projektbelegten Positionen; unbekannte Werte bleiben null und werden nie geschätzt.";
    locations.values["-1"].sourceStatus = "GUIDE_CONFIRMED";
    locations.values["-2"] = {
      ...locations.values["-2"], salt: null, mureineBoss: null,
      sourceStatus: "GUIDE_CONFIRMED", openFields: ["salt", "mureineBoss"]
    };
    locations.values["-3"].sourceStatus = "GUIDE_CONFIRMED";
    locations.values["-4"] = {
      luminomachines: null, salt: null, execrabeAccess: null, execrabeBoss: null, fragmentHandover: null,
      sourceStatus: "LIVE_REQUIRED", status: "OPEN", note: "Keine eindeutige Kartenposition in den bestehenden Projektquellen."
    };
    locations.values["-5"] = {
      ...locations.values["-5"], fragmentGateCage: "[10,14]", willorqueAccess: null,
      sourceStatus: "GUIDE_CONFIRMED", openFields: ["willorqueAccess"]
    };
    locations.values["-6"] = {
      willorqueBoss: null, access: null, sourceStatus: "LIVE_REQUIRED", status: "OPEN",
      note: "Etage -6 ist dokumentiert, aber ohne eindeutige Kartenkoordinate."
    };
    locations.values["0"] = {
      raidChest: "Vorposten", raidChestMap: null, gigalodonStart: null, finalHandover: null,
      sourceStatus: "LIVE_REQUIRED", status: "OPEN", note: "Funktionsort bekannt, Kartenwert nicht eindeutig belegt."
    };
    locations.values.shortcut.sourceStatus = "GUIDE_CONFIRMED";

    const saltRule = definition.scoreRules.find((rule) => rule.id === "GIG-SCORE-SALT");
    saltRule.trigger = "Gemeinsames Salz gesammelt oder für Licht verbraucht.";
    saltRule.value = 0;
    saltRule.sourceStatus = "GUIDE_CONFIRMED";

    const finalTask = definition.tasks.find((task) => task.id === "GG-050");
    const resultField = {
      path: "gigalodon.final.result", type: "enum", description: "Explizites Finalergebnis",
      sourceStatus: "PRODUCT_RULE", required: true, enumValues: ["VICTORY", "DEFEAT"]
    };
    if (!finalTask.inputFields.some((field) => field.path === resultField.path)) finalTask.inputFields.unshift(resultField);
    if (!finalTask.completion.resultFields.some((field) => field.path === resultField.path)) finalTask.completion.resultFields.unshift(resultField);

    for (const question of definition.openQuestions) {
      if (["GIG-Q-LIGHT-INTERVAL", "GIG-Q-SALT-COST"].includes(question.id)) {
        question.status = "CONFIGURABLE_UNTIL_VERIFIED";
      }
    }
  } else {
    const fields = definition.stateModel.raidSpecificFields;
    const target = fields.find((field) => field.path === "sanctuaire.corridorTarget");
    target.description = "Konfigurierbares Korridorziel: Guide-Baseline 10 Räume × 6 Monster = 60";
    target.sourceStatus = "GUIDE_CONFIRMED";
    target.default = 60;
    const targetIndex = fields.indexOf(target);
    if (!fields.some((field) => field.path === "sanctuaire.corridorTargetSourceStatus")) fields.splice(targetIndex + 1, 0, {
      path: "sanctuaire.corridorTargetSourceStatus", type: "string",
      description: "Guide bestätigt; noch nicht durch RAIDWEAVE live bestätigt",
      sourceStatus: "GUIDE_CONFIRMED", default: "GUIDE_CONFIRMED"
    });
    const corridor = definition.lookupTables.find((table) => table.id === "SAN-CORRIDOR-DEFAULT");
    corridor.description = "Guidebasierte Baseline: 10 Räume mit je 6 Monstern; noch nicht durch RAIDWEAVE live bestätigt.";
    corridor.sourceStatus = "GUIDE_CONFIRMED";
    corridor.values = { rooms: 10, monstersPerRoom: 6, target: 60, raidweaveLiveConfirmed: false };
    const question = definition.openQuestions.find((entry) => entry.id?.includes("CORRIDOR"));
    if (question) {
      question.question = "Bestätigt ein eigener RAIDWEAVE-Live-Test die Guide-Baseline von 10 × 6 = 60 Korridormonstern?";
      question.status = "CONFIGURABLE_UNTIL_VERIFIED";
    }
  }

  await writeFile(file, `${JSON.stringify(definition, null, 2)}\n`, "utf8");
}

const schema = JSON.parse(await readFile("raid-definition.schema.json", "utf8"));
function migrateSchema(value) {
  if (Array.isArray(value)) return value.forEach(migrateSchema);
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (key === "sourceStatus" && nested && typeof nested === "object" && Array.isArray(nested.enum)) {
      nested.enum = ["OFFICIAL_CONFIRMED", "GUIDE_CONFIRMED", "LIVE_CONFIRMED", "LIVE_REQUIRED", "PLAYER_CORRECTED", "PRODUCT_RULE"];
    }
    migrateSchema(nested);
  }
}
migrateSchema(schema);
await writeFile("raid-definition.schema.json", `${JSON.stringify(schema, null, 2)}\n`, "utf8");
