import type { Character } from '../../core/Character';
import { StateIdentifier } from '../../types/combat.types';
import { CombatState } from './CombatState';
import { NormalState } from './NormalState';
export class FlyingState extends CombatState {
  public readonly id = StateIdentifier.FLYING; public readonly badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40'; private turnsLeft: number;
  constructor(turns = 2) { super(); this.turnsLeft = Math.max(1, turns); }
  public get name(): string { return `FlyingState (${this.turnsLeft}t)`; } public get remainingTurns(): number { return this.turnsLeft; }
  public get ruleDescription(): string { return `Evasão Aérea: Reduz dano em 50% | Dura mais ${this.turnsLeft} turno(s)`; }
  public override modifyIncomingDamage(rawDamage: number): number { return Math.round(rawDamage * 0.5); }
  public override onTurnEnd(character: Character): void { this.turnsLeft -= 1; if (this.turnsLeft <= 0) character.changeState(new NormalState(), 'Pouso Automático (Fim do Voo)'); }
  public override clone(): CombatState { return new FlyingState(this.turnsLeft); }
}
