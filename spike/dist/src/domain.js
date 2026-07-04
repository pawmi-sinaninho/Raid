const TRANSITIONS = {
    LOCKED: ['READY'],
    READY: ['CLAIMED', 'ACTIVE', 'SKIPPED'],
    CLAIMED: ['ACTIVE', 'READY'],
    ACTIVE: ['WAITING', 'BLOCKED', 'FAILED', 'COMPLETED'],
    WAITING: ['ACTIVE', 'FAILED'],
    BLOCKED: ['ACTIVE', 'FAILED'],
    FAILED: ['READY'],
    COMPLETED: ['ACTIVE'],
    SKIPPED: ['READY']
};
export function canTransition(from, to) {
    return TRANSITIONS[from]?.includes(to) ?? false;
}
export function canMutate(role) {
    return role === 'CAPTAIN' || role === 'PARTICIPANT';
}
//# sourceMappingURL=domain.js.map