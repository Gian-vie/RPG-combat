import type { Character } from '../../core/Character';
import { StateIdentifier } from '../../types/combat.types';
export abstract class CombatState {
  public abstract readonly id: StateIdentifier; public abstract readonly name: string; public abstract readonly badgeColor: string; public abstract readonly ruleDescription: string; public abstract readonly remainingTurns: number | null;
  public canAct(): boolean { return true; } public modifyIncomingDamage(rawDamage: number): number { return rawDamage; }
  public onTurnEnd(_character: Character): void {}
  public abstract clone(): CombatState;
}
