import type { Character } from '../../core/Character';
import { StateIdentifier } from '../../types/combat.types';
import { CombatState } from './CombatState';
import { NormalState } from './NormalState';
export class StunnedState extends CombatState {
  public readonly id = StateIdentifier.STUNNED; public readonly badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'; private turnsLeft: number;
  constructor(turns = 1) { super(); this.turnsLeft = Math.max(1, turns); }
  public get name(): string { return `StunnedState (${this.turnsLeft}t)`; } public get remainingTurns(): number { return this.turnsLeft; }
  public get ruleDescription(): string { return `canAct() = false | Vulnerável (+25% Dano) | Expira ao consumir ${this.turnsLeft} turno(s)`; }
  public override canAct(): boolean { return false; } public override modifyIncomingDamage(rawDamage: number): number { return Math.round(rawDamage * 1.25); }
  public override onTurnEnd(character: Character): void { this.turnsLeft -= 1; if (this.turnsLeft <= 0) character.changeState(new NormalState(), 'Expiração de Stun (State Lifecycle)'); }
  public override clone(): CombatState { return new StunnedState(this.turnsLeft); }
}
