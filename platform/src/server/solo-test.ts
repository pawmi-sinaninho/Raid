import type { ActorContext, ParticipantRecord, RaidDefinition, Role, TeamRecord } from "@/src/core/types";
import { DomainError } from "./errors";
import type { PlatformStore } from "./platform-store";

interface SoloTestEnvironment {
  NODE_ENV?: string;
  NEXT_PUBLIC_ENABLE_SOLO_TEST?: string;
  RAIDWEAVE_ALLOW_PRODUCTION_SOLO_TEST?: string;
}

interface TeamTemplate {
  participantCount: number;
  teams: Array<{ name: string; recommendedSize: number }>;
}

export interface SoloTestResult {
  syntheticParticipantsCreated: number;
  participantCount: number;
  teamCount: number;
}

export function isSoloTestEnabled(environment: SoloTestEnvironment = process.env): boolean {
  return environment.NEXT_PUBLIC_ENABLE_SOLO_TEST === "true" && (environment.NODE_ENV !== "production" || environment.RAIDWEAVE_ALLOW_PRODUCTION_SOLO_TEST === "true");
}

export function assertSoloTestEnabled(environment: SoloTestEnvironment = process.env): void {
  if (!isSoloTestEnabled(environment)) {
    throw new DomainError("SOLO_TEST_DISABLED", 404, "Le mode test solo n’est pas disponible.");
  }
}

function teamTemplates(definition: RaidDefinition): TeamTemplate[] {
  const participation = definition.participation as RaidDefinition["participation"] & {
    teamTemplates?: TeamTemplate[];
  };
  return participation.teamTemplates ?? [];
}

function selectTeamTemplate(definition: RaidDefinition, participantCount: number): TeamTemplate | null {
  return teamTemplates(definition)
    .slice()
    .sort((left, right) => {
      const distance = Math.abs(left.participantCount - participantCount)
        - Math.abs(right.participantCount - participantCount);
      return distance || left.participantCount - right.participantCount;
    })[0] ?? null;
}

function nextTestName(usedNames: Set<string>, startAt: number): { name: string; nextIndex: number } {
  let index = startAt;
  let name = "";
  do {
    name = `Test ${String(index).padStart(2, "0")}`;
    index += 1;
  } while (usedNames.has(name));
  usedNames.add(name);
  return { name, nextIndex: index };
}

async function createSyntheticParticipants(
  store: PlatformStore,
  actor: ActorContext,
  participants: ParticipantRecord[],
  minimum: number,
  maximum: number
): Promise<number> {
  const active = participants.filter((participant) => participant.role !== "SPECTATOR");
  const needsEditor = !active.some((participant) => participant.role === "EDITOR");
  let count = Math.max(0, minimum - active.length);
  if (needsEditor && active.length + count < maximum) count = Math.max(count, 1);

  const roles: Role[] = Array.from({ length: count }, (_, index) =>
    needsEditor && index === 0 ? "EDITOR" : "PARTICIPANT"
  );
  const usedNames = new Set(participants.map((participant) => participant.displayName));
  let nameIndex = 1;

  for (const role of ["EDITOR", "PARTICIPANT"] as const) {
    const roleCount = roles.filter((candidate) => candidate === role).length;
    if (!roleCount) continue;
    const invite = await store.rotateInvite(actor, role, {});
    for (let index = 0; index < roleCount; index += 1) {
      const generated = nextTestName(usedNames, nameIndex);
      nameIndex = generated.nextIndex;
      await store.joinByInvite(invite.token, generated.name);
    }
  }

  return count;
}

async function ensureTeams(
  store: PlatformStore,
  actor: ActorContext,
  definition: RaidDefinition,
  participantCount: number,
  existingTeams: TeamRecord[]
): Promise<{ teams: TeamRecord[]; capacities: Map<string, number> }> {
  if (existingTeams.length) return { teams: existingTeams, capacities: new Map() };

  const template = selectTeamTemplate(definition, participantCount);
  const desiredTeams = template?.teams ?? Array.from(
    { length: Math.max(1, Math.ceil(participantCount / 4)) },
    (_, index) => ({ name: `Test solo ${index + 1}`, recommendedSize: 4 })
  );
  const teams: TeamRecord[] = [];
  const capacities = new Map<string, number>();
  for (const desired of desiredTeams) {
    const team = await store.createTeam(actor, desired.name);
    teams.push(team);
    capacities.set(team.id, desired.recommendedSize);
  }
  return { teams, capacities };
}

async function distributeRoster(
  store: PlatformStore,
  actor: ActorContext,
  participants: ParticipantRecord[],
  teams: TeamRecord[],
  capacities: Map<string, number>
): Promise<void> {
  if (!teams.length) return;
  const loads = new Map(teams.map((team) => [
    team.id,
    participants.filter((participant) => participant.teamId === team.id).length
  ]));

  for (const participant of participants.filter((candidate) => candidate.role !== "SPECTATOR" && !candidate.teamId)) {
    const team = teams.slice().sort((left, right) => {
      const leftLoad = loads.get(left.id) ?? 0;
      const rightLoad = loads.get(right.id) ?? 0;
      const leftCapacity = capacities.get(left.id) ?? 1;
      const rightCapacity = capacities.get(right.id) ?? 1;
      return leftLoad / leftCapacity - rightLoad / rightCapacity || leftLoad - rightLoad;
    })[0]!;
    await store.assignParticipantToTeam(actor, participant.id, team.id);
    loads.set(team.id, (loads.get(team.id) ?? 0) + 1);
  }
}

export async function startSoloTest(store: PlatformStore, actor: ActorContext): Promise<SoloTestResult> {
  assertSoloTestEnabled();
  if (actor.role !== "CAPTAIN") {
    throw new DomainError("FORBIDDEN", 403, "Seul le capitaine peut lancer le test solo.");
  }

  let snapshot = await store.getSnapshot(actor.sessionId);
  if (snapshot.session.status !== "LOBBY") {
    throw new DomainError("SESSION_NOT_IN_LOBBY", 409, "Session ist nicht mehr in der Lobby.");
  }

  const created = await createSyntheticParticipants(
    store,
    actor,
    snapshot.participants,
    snapshot.definition.participation.minimum,
    snapshot.definition.participation.maximum
  );
  snapshot = await store.getSnapshot(actor.sessionId);

  const activeParticipants = snapshot.participants.filter((participant) => participant.role !== "SPECTATOR");
  const formation = await ensureTeams(
    store,
    actor,
    snapshot.definition,
    activeParticipants.length,
    snapshot.teams
  );
  await distributeRoster(store, actor, activeParticipants, formation.teams, formation.capacities);

  for (const participant of activeParticipants) {
    await store.setReady(actor, participant.id, true);
  }

  await store.startSession(actor);
  return {
    syntheticParticipantsCreated: created,
    participantCount: activeParticipants.length,
    teamCount: formation.teams.length
  };
}
