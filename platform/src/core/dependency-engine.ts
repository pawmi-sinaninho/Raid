import type { DependencyDefinition, RaidDefinition, TaskInstanceRecord, TaskStatus } from "./types";

const TERMINAL: ReadonlySet<TaskStatus> = new Set(["COMPLETED", "SKIPPED"]);

export interface DependencyEvaluation {
  taskDefinitionId: string;
  shouldBeReady: boolean;
  blockingTaskDefinitionIds: string[];
  satisfiedDependencyIds: string[];
}

export function evaluateDependencies(
  definition: RaidDefinition,
  instances: Pick<TaskInstanceRecord, "definitionId" | "status">[]
): DependencyEvaluation[] {
  const statusByDefinition = new Map(instances.map((task) => [task.definitionId, task.status]));
  const incoming = new Map<string, DependencyDefinition[]>();
  for (const dependency of definition.dependencies) {
    const list = incoming.get(dependency.toTaskId) ?? [];
    list.push(dependency);
    incoming.set(dependency.toTaskId, list);
  }

  return definition.tasks.map((task) => {
    const dependencies = incoming.get(task.id) ?? [];
    if (dependencies.length === 0) {
      return {
        taskDefinitionId: task.id,
        shouldBeReady: task.initialStatus === "READY",
        blockingTaskDefinitionIds: [],
        satisfiedDependencyIds: []
      };
    }

    const satisfiedDependencyIds: string[] = [];
    const blockers = new Set<string>();
    for (const dependency of dependencies) {
      const complete = dependency.fromTaskIds.map((id) => TERMINAL.has(statusByDefinition.get(id) ?? "LOCKED"));
      const satisfied = dependency.mode === "ALL" ? complete.every(Boolean) : complete.some(Boolean);
      if (satisfied) satisfiedDependencyIds.push(dependency.id);
      else dependency.fromTaskIds.filter((_, index) => !complete[index]).forEach((id) => blockers.add(id));
    }

    return {
      taskDefinitionId: task.id,
      shouldBeReady: satisfiedDependencyIds.length === dependencies.length,
      blockingTaskDefinitionIds: [...blockers],
      satisfiedDependencyIds
    };
  });
}
