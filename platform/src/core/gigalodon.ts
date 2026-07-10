import type { ParticipantRecord, RaidDefinition, SourceStatus, TaskInstanceRecord } from "./types";
import type { RaidState } from "./raid-state";

export const GIGALODON_RESOURCE_KEYS = [
  "quartz",
  "opale",
  "amazonite",
  "aventurine",
  "lapiz",
  "jais",
  "onyx",
  "uniteMureine",
  "rancuneExecrabe",
  "noirceurWillorque",
  "pinceExecrabe"
] as const;
export type GigalodonResourceKey = (typeof GIGALODON_RESOURCE_KEYS)[number];
export type GigalodonResources = Record<GigalodonResourceKey, number>;

export interface GigalodonSaltChange {
  id: string;
  kind: "COLLECTION" | "REFILL" | "CORRECTION" | "MIGRATION";
  delta: number;
  before: number;
  after: number;
  cause: string;
  actorParticipantId: string | null;
  responsibleParticipantId: string | null;
  floor: number | null;
  createdAt: string;
}

export interface GigalodonSaltPool {
  amount: number;
  lastChange: GigalodonSaltChange | null;
  history: GigalodonSaltChange[];
  collectorParticipantIds: string[];
  refillerParticipantIds: string[];
}

export interface GigalodonLightState {
  floor: number;
  level: number;
  baselineLevel: number;
  baselineSourceStatus: SourceStatus;
  observedAt: string;
  nextDecayAt: string;
  responsibleParticipantId: string | null;
  intervalSeconds: number;
  intervalSourceStatus: SourceStatus;
  saltCostSourceStatus: SourceStatus;
  updatedBy: string;
}

export interface GigalodonInventory {
  participantId: string;
  resources: GigalodonResources;
  currentFloor: number | null;
  risk: "LOW" | "MEDIUM" | "HIGH";
  lastConfirmedAt: string;
  updatedBy: string;
}

export interface GigalodonLossEntry {
  id: string;
  participantId: string;
  lostResources: Partial<GigalodonResources>;
  lostScore: number;
  uniqueResourceAffected: boolean;
  uniqueLossSourceStatus: SourceStatus;
  createdAt: string;
  actorParticipantId: string;
}

export interface GigalodonDepositEntry {
  id: string;
  participantId: string;
  resources: Partial<GigalodonResources>;
  scoreDelta: number;
  createdAt: string;
  actorParticipantId: string;
}

export interface GigalodonState {
  floorStates: Record<string, Record<string, unknown>>;
  lightStates: GigalodonLightState[];
  participantInventories: GigalodonInventory[];
  saltPool: GigalodonSaltPool;
  depositedResources: GigalodonResources;
  confirmedScore: number;
  projectedUnbankedScore: number;
  bossUniqueDrops: {
    mureine: { holderParticipantId: string | null; banked: boolean };
    execrabe: { holderParticipantId: string | null; banked: boolean };
    willorque: { holderParticipantId: string | null; banked: boolean };
  };
  pinceHolder: string | null;
  access: Record<string, boolean>;
  fragments: { first: boolean; second: boolean; third: boolean; fourth: boolean };
  finalReadiness: {
    timerAboveSafetyThreshold: boolean;
    mureineResourceCoffreed: boolean;
    execrabeResourceCoffreed: boolean;
    willorqueResourceCoffreed: boolean;
    criticalUnbankedScore: number;
    activeFights: number;
    activeFightsRuleSourceStatus: SourceStatus;
    finalTeamReady: boolean;
    captainConfirmed: boolean;
    staleInventoryParticipantIds: string[];
  };
  final: {
    startedAt: string | null;
    startedBeforeExpiry: boolean;
    preparationSeconds: number | null;
    combatRound: number;
    totalDamage: number;
    damageRounds: Array<{ round: number; cumulativeDamage: number; recordedAt: string; actorParticipantId: string }>;
    projectedBonusScore: number;
    bonusScore: number;
    result: "VICTORY" | "DEFEAT" | null;
    completedAt: string | null;
    confirmedResourceScore: number | null;
    finalBonusScore: number | null;
    totalScore: number | null;
    swallowedParticipantId: string | null;
    blackGlyphOccupied: boolean;
  };
  losses: GigalodonLossEntry[];
  deposits: GigalodonDepositEntry[];
  lightIntervalSeconds: number;
  lightIntervalSourceStatus: SourceStatus;
  saltCostSourceStatus: SourceStatus;
  floor1GroupTarget: number;
  floor1GroupTargetSourceStatus: SourceStatus;
}

const ZERO_RESOURCES: GigalodonResources = {
  quartz: 0,
  opale: 0,
  amazonite: 0,
  aventurine: 0,
  lapiz: 0,
  jais: 0,
  onyx: 0,
  uniteMureine: 0,
  rancuneExecrabe: 0,
  noirceurWillorque: 0,
  pinceExecrabe: 0
};

export function isGigalodon(definition: RaidDefinition): boolean {
  return definition.id === "gouffre-gigalodon" || definition.slug.includes("gigalodon");
}

export function normalizeGigalodonResources(value: unknown): GigalodonResources {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(GIGALODON_RESOURCE_KEYS.map((key) => [key, Math.max(0, Number.isFinite(Number(raw[key])) ? Math.trunc(Number(raw[key])) : 0)])) as GigalodonResources;
}

function normalizeSourceStatus(value: unknown, fallback: SourceStatus = "GUIDE_CONFIRMED"): SourceStatus {
  if (["OFFICIAL_CONFIRMED", "GUIDE_CONFIRMED", "LIVE_CONFIRMED", "LIVE_REQUIRED", "PLAYER_CORRECTED"].includes(String(value))) {
    return value as SourceStatus;
  }
  if (value === true || value === "LIVE_TESTED") return "LIVE_CONFIRMED";
  if (value === false || value === "UNCONFIRMED") return "GUIDE_CONFIRMED";
  return fallback;
}

function normalizeSaltPool(value: unknown): GigalodonSaltPool {
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Partial<GigalodonSaltPool> : {};
  const history = Array.isArray(raw.history) ? raw.history : [];
  return {
    amount: Number.isFinite(raw.amount) ? Math.max(0, Math.trunc(Number(raw.amount))) : 0,
    lastChange: raw.lastChange && typeof raw.lastChange === "object" ? raw.lastChange : history.at(-1) ?? null,
    history,
    collectorParticipantIds: Array.isArray(raw.collectorParticipantIds) ? [...new Set(raw.collectorParticipantIds.filter((id): id is string => typeof id === "string"))] : [],
    refillerParticipantIds: Array.isArray(raw.refillerParticipantIds) ? [...new Set(raw.refillerParticipantIds.filter((id): id is string => typeof id === "string"))] : []
  };
}

export function getGigalodonState(raidState: RaidState): GigalodonState {
  const raw = (raidState.gigalodon ?? {}) as Partial<GigalodonState>;
  const unique = raw.bossUniqueDrops ?? {} as GigalodonState["bossUniqueDrops"];
  const readiness = raw.finalReadiness ?? {} as GigalodonState["finalReadiness"];
  const final = raw.final ?? {} as GigalodonState["final"];
  const fragments = raw.fragments ?? {} as GigalodonState["fragments"];
  return {
    floorStates: raw.floorStates && typeof raw.floorStates === "object" ? raw.floorStates : {},
    lightStates: Array.isArray(raw.lightStates) ? raw.lightStates.map((item) => {
      const legacy = item as GigalodonLightState & { intervalConfirmedInGame?: boolean; saltCostSemanticsConfirmedInGame?: boolean };
      return {
        floor: Number(legacy.floor),
        level: Math.max(0, Math.min(4, Number(legacy.level) || 0)),
        baselineLevel: Number.isFinite(legacy.baselineLevel) ? Number(legacy.baselineLevel) : legacy.floor === -1 ? 4 : 1,
        baselineSourceStatus: normalizeSourceStatus(legacy.baselineSourceStatus),
        observedAt: legacy.observedAt,
        nextDecayAt: legacy.nextDecayAt,
        responsibleParticipantId: legacy.responsibleParticipantId ?? null,
        intervalSeconds: Math.max(1, Number(legacy.intervalSeconds) || 120),
        intervalSourceStatus: normalizeSourceStatus(legacy.intervalSourceStatus ?? legacy.intervalConfirmedInGame),
        saltCostSourceStatus: normalizeSourceStatus(legacy.saltCostSourceStatus ?? legacy.saltCostSemanticsConfirmedInGame),
        updatedBy: legacy.updatedBy
      };
    }) : [],
    participantInventories: Array.isArray(raw.participantInventories) ? raw.participantInventories.map((item) => ({ ...item, resources: normalizeGigalodonResources(item.resources) })) : [],
    saltPool: normalizeSaltPool(raw.saltPool),
    depositedResources: normalizeGigalodonResources(raw.depositedResources),
    confirmedScore: Number.isFinite(raw.confirmedScore) ? Math.max(0, Number(raw.confirmedScore)) : 0,
    projectedUnbankedScore: Number.isFinite(raw.projectedUnbankedScore) ? Math.max(0, Number(raw.projectedUnbankedScore)) : 0,
    bossUniqueDrops: {
      mureine: unique.mureine ?? { holderParticipantId: null, banked: false },
      execrabe: unique.execrabe ?? { holderParticipantId: null, banked: false },
      willorque: unique.willorque ?? { holderParticipantId: null, banked: false }
    },
    pinceHolder: typeof raw.pinceHolder === "string" ? raw.pinceHolder : null,
    access: raw.access && typeof raw.access === "object" ? raw.access : { floor2: false, floor3: false, floor4: false, floor5: false, floor6: false },
    fragments: {
      first: fragments.first === true,
      second: fragments.second === true,
      third: fragments.third === true,
      fourth: fragments.fourth === true
    },
    finalReadiness: {
      timerAboveSafetyThreshold: readiness.timerAboveSafetyThreshold === true,
      mureineResourceCoffreed: readiness.mureineResourceCoffreed === true,
      execrabeResourceCoffreed: readiness.execrabeResourceCoffreed === true,
      willorqueResourceCoffreed: readiness.willorqueResourceCoffreed === true,
      criticalUnbankedScore: Number.isFinite(readiness.criticalUnbankedScore) ? Number(readiness.criticalUnbankedScore) : 0,
      activeFights: Number.isFinite(readiness.activeFights) ? Number(readiness.activeFights) : 0,
      activeFightsRuleSourceStatus: normalizeSourceStatus(readiness.activeFightsRuleSourceStatus ?? (readiness as typeof readiness & { activeFightsRuleConfirmedInGame?: boolean }).activeFightsRuleConfirmedInGame, "LIVE_REQUIRED"),
      finalTeamReady: readiness.finalTeamReady === true,
      captainConfirmed: readiness.captainConfirmed === true,
      staleInventoryParticipantIds: Array.isArray(readiness.staleInventoryParticipantIds) ? readiness.staleInventoryParticipantIds : []
    },
    final: {
      startedAt: typeof final.startedAt === "string" ? final.startedAt : null,
      startedBeforeExpiry: final.startedBeforeExpiry === true,
      preparationSeconds: Number.isFinite(final.preparationSeconds) ? Number(final.preparationSeconds) : null,
      combatRound: Number.isFinite(final.combatRound) ? Math.max(1, Math.min(3, Number(final.combatRound))) : 1,
      totalDamage: Number.isFinite(final.totalDamage) ? Math.max(0, Number(final.totalDamage)) : 0,
      damageRounds: Array.isArray(final.damageRounds) ? final.damageRounds : [],
      projectedBonusScore: Number.isFinite(final.projectedBonusScore) ? Math.max(0, Number(final.projectedBonusScore)) : 0,
      bonusScore: Number.isFinite(final.bonusScore) ? Math.max(0, Number(final.bonusScore)) : 0,
      result: final.result === "VICTORY" || final.result === "DEFEAT" ? final.result : null,
      completedAt: typeof final.completedAt === "string" ? final.completedAt : null,
      confirmedResourceScore: Number.isFinite(final.confirmedResourceScore) ? Number(final.confirmedResourceScore) : null,
      finalBonusScore: Number.isFinite(final.finalBonusScore) ? Number(final.finalBonusScore) : null,
      totalScore: Number.isFinite(final.totalScore) ? Number(final.totalScore) : null,
      swallowedParticipantId: typeof final.swallowedParticipantId === "string" ? final.swallowedParticipantId : null,
      blackGlyphOccupied: final.blackGlyphOccupied === true
    },
    losses: Array.isArray(raw.losses) ? raw.losses : [],
    deposits: Array.isArray(raw.deposits) ? raw.deposits : [],
    lightIntervalSeconds: Number.isFinite(raw.lightIntervalSeconds) ? Math.max(1, Number(raw.lightIntervalSeconds)) : 120,
    lightIntervalSourceStatus: normalizeSourceStatus(raw.lightIntervalSourceStatus ?? (raw as typeof raw & { lightIntervalConfirmedInGame?: boolean }).lightIntervalConfirmedInGame),
    saltCostSourceStatus: normalizeSourceStatus(raw.saltCostSourceStatus ?? (raw as typeof raw & { saltCostSemanticsConfirmedInGame?: boolean }).saltCostSemanticsConfirmedInGame),
    floor1GroupTarget: Number.isFinite(raw.floor1GroupTarget) ? Math.max(1, Number(raw.floor1GroupTarget)) : 18,
    floor1GroupTargetSourceStatus: normalizeSourceStatus(raw.floor1GroupTargetSourceStatus ?? (raw as typeof raw & { floor1GroupTargetConfirmedInGame?: boolean }).floor1GroupTargetConfirmedInGame, "LIVE_REQUIRED")
  };
}

function lookupValues(definition: RaidDefinition, id: string): unknown {
  const tables = (definition.lookupTables ?? []) as Array<{ id: string; values: unknown }>;
  return tables.find((table) => table.id === id)?.values;
}

export function getGigalodonFloorLocation(definition: RaidDefinition, floor: number): Record<string, unknown> | null {
  const values = lookupValues(definition, "GIG-FLOOR-LOCATIONS");
  if (!values || typeof values !== "object" || Array.isArray(values)) return null;
  const entry = (values as Record<string, unknown>)[String(floor)];
  return entry && typeof entry === "object" && !Array.isArray(entry) ? entry as Record<string, unknown> : null;
}

export function calculateLightRefillCost(definition: RaidDefinition, fromLevel: number, toLevel: number): number {
  if (!Number.isInteger(fromLevel) || !Number.isInteger(toLevel) || fromLevel < 0 || toLevel > 4 || toLevel <= fromLevel) return 0;
  const values = lookupValues(definition, "GIG-LIGHT-COST-TO-LEVEL");
  if (!values || typeof values !== "object" || Array.isArray(values)) return 0;
  const costs = values as Record<string, unknown>;
  let total = 0;
  for (let level = fromLevel + 1; level <= toLevel; level += 1) total += Math.max(0, Math.trunc(Number(costs[String(level)]) || 0));
  return total;
}

export function createGuideBaselineLight(
  floor: number,
  observedAt: string,
  updatedBy: string,
  responsibleParticipantId: string | null,
  intervalSeconds = 120
): GigalodonLightState {
  const baselineLevel = floor === -1 ? 4 : 1;
  return {
    floor,
    level: baselineLevel,
    baselineLevel,
    baselineSourceStatus: "GUIDE_CONFIRMED",
    observedAt,
    nextDecayAt: new Date(new Date(observedAt).getTime() + intervalSeconds * 1000).toISOString(),
    responsibleParticipantId,
    intervalSeconds,
    intervalSourceStatus: "GUIDE_CONFIRMED",
    saltCostSourceStatus: "GUIDE_CONFIRMED",
    updatedBy
  };
}

export function resourceScoreValues(definition: RaidDefinition): Record<string, number> {
  const values = lookupValues(definition, "GIG-RESOURCE-SCORE");
  if (!values || typeof values !== "object" || Array.isArray(values)) return {};
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value) || 0]));
}

export function calculateResourceScore(definition: RaidDefinition, resources: Partial<GigalodonResources>): number {
  const values = resourceScoreValues(definition);
  return GIGALODON_RESOURCE_KEYS.reduce((total, key) => total + Math.max(0, Math.trunc(Number(resources[key] ?? 0))) * (values[key] ?? 0), 0);
}

export function calculateProjectedUnbankedScore(definition: RaidDefinition, inventories: GigalodonInventory[]): number {
  return inventories.reduce((total, inventory) => total + calculateResourceScore(definition, inventory.resources), 0);
}

export function calculateDamageBonus(definition: RaidDefinition, totalDamage: number): number {
  const values = lookupValues(definition, "GIG-FINAL-DAMAGE-SCORE");
  if (!Array.isArray(values)) return 0;
  let score = 0;
  for (const entry of values) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [threshold, bonus] = entry.map(Number);
    if (totalDamage >= threshold) score = Math.max(score, bonus);
  }
  return score;
}

export function calculateFragmentChance(definition: RaidDefinition, confirmedScore: number): number {
  const values = lookupValues(definition, "GIG-FRAGMENT-DROP-CHANCE");
  if (!Array.isArray(values)) return 1;
  const match = values.find((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    const row = entry as { minScore?: number; maxScoreExclusive?: number | null };
    return confirmedScore >= Number(row.minScore ?? 0) && (row.maxScoreExclusive == null || confirmedScore < Number(row.maxScoreExclusive));
  }) as { percent?: number } | undefined;
  return Number(match?.percent ?? 1);
}

export function effectiveLightLevel(light: GigalodonLightState, now = Date.now()): number {
  const next = new Date(light.nextDecayAt).getTime();
  if (!Number.isFinite(next) || now < next) return light.level;
  const elapsedSteps = 1 + Math.floor((now - next) / (Math.max(1, light.intervalSeconds) * 1000));
  return Math.max(0, light.level - elapsedSteps);
}

export function staleInventoryIds(inventories: GigalodonInventory[], now = Date.now(), thresholdMs = 300_000): string[] {
  return inventories.filter((inventory) => now - new Date(inventory.lastConfirmedAt).getTime() > thresholdMs).map((inventory) => inventory.participantId);
}

export function uniqueResourceAtRisk(state: GigalodonState): boolean {
  return [state.bossUniqueDrops.mureine, state.bossUniqueDrops.execrabe, state.bossUniqueDrops.willorque].some((item) => item.holderParticipantId && !item.banked);
}

export function finalReadinessSummary(state: GigalodonState): { blocked: string[]; unconfirmed: string[]; ready: string[] } {
  const blocked: string[] = [];
  const unconfirmed: string[] = [];
  const ready: string[] = [];
  const checks: Array<[boolean, string]> = [
    [state.finalReadiness.timerAboveSafetyThreshold, "Temps de sécurité"],
    [state.finalReadiness.mureineResourceCoffreed, "Unité de Mureine déposée"],
    [state.finalReadiness.execrabeResourceCoffreed, "Rancune d’Exécrabe déposée"],
    [state.finalReadiness.willorqueResourceCoffreed, "Noirceur de Willorque déposée"],
    [state.finalReadiness.finalTeamReady, "Équipe finale prête"],
    [state.finalReadiness.captainConfirmed, "Confirmation du capitaine"]
  ];
  for (const [ok, label] of checks) (ok ? ready : blocked).push(label);
  if (state.finalReadiness.activeFights > 0) {
    (state.finalReadiness.activeFightsRuleSourceStatus === "LIVE_CONFIRMED" ? blocked : unconfirmed).push(
      `D’autres combats pourraient empêcher le départ du Gigalodon · vérifier en jeu (${state.finalReadiness.activeFights})`
    );
  } else ready.push("Aucun combat actif signalé");
  if (state.finalReadiness.criticalUnbankedScore > 0) blocked.push(`${state.finalReadiness.criticalUnbankedScore} points non sécurisés`);
  return { blocked, unconfirmed, ready };
}

export function deriveGigalodonMissionContext(participant: ParticipantRecord, state: GigalodonState): string[] {
  const inventory = state.participantInventories.find((item) => item.participantId === participant.id);
  const context: string[] = [];
  if (inventory) {
    context.push(`Étage ${inventory.currentFloor ?? "?"}`);
    const atRisk = Object.values(inventory.resources).some((value) => value > 0);
    if (atRisk) context.push("Butin non sécurisé");
  }
  if (state.pinceHolder === participant.id) context.push("Porteur de la Pince");
  for (const [name, item] of Object.entries(state.bossUniqueDrops)) {
    if (item.holderParticipantId === participant.id && !item.banked) context.push(`${name} à déposer`);
  }
  return context;
}

export const GIGALODON_PHASE_TASKS = {
  floors: ["G1-040", "G2-040", "G3-030", "G4-050", "G5-040"],
  bosses: ["G2-030", "G4-040", "G6-030"],
  final: ["GG-010", "GG-020", "GG-040", "GG-050"]
} as const;

export function taskByDefinition(tasks: TaskInstanceRecord[], id: string): TaskInstanceRecord | undefined {
  return tasks.find((task) => task.definitionId === id);
}
