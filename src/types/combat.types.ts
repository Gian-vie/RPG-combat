export enum CombatEventType {
  DAMAGE_TAKEN = 'DAMAGE_TAKEN', STATE_CHANGED = 'STATE_CHANGED', BUFF_APPLIED = 'BUFF_APPLIED',
  ACTION_BLOCKED = 'ACTION_BLOCKED', UNDO_EXECUTED = 'UNDO_EXECUTED', LOADOUT_CHANGED = 'LOADOUT_CHANGED', TURN_PASSED = 'TURN_PASSED',
}

export enum ArchetypeType { WARRIOR = 'WARRIOR', ALCHEMIST = 'ALCHEMIST', MERCENARY = 'MERCENARY', BOSS = 'BOSS' }
export enum StateIdentifier { NORMAL = 'NORMAL', STUNNED = 'STUNNED', FLYING = 'FLYING' }

export type TurnOwner = 'P1' | 'P2';
export type GameMode = 'PVP' | 'PVE_BOSS';
export type AppPhase = 'SETUP' | 'BATTLE';
export type PatternTag = 'Abstract Factory' | 'Decorator' | 'State' | 'Command' | 'Observer';

export interface CombatEventPayload {
  readonly id: string; readonly timestamp: string; readonly type: CombatEventType;
  readonly patternTag: PatternTag; readonly sourceName: string; readonly targetName: string;
  readonly details: string; readonly currentHp: number; readonly damageDealt?: number;
}
export type ImmutableEvent = Readonly<CombatEventPayload>;

export interface AuditMetrics {
  readonly totalEvents: number; readonly totalDamage: number;
  readonly blockedActions: number; readonly rollbacksExecuted: number;
}
