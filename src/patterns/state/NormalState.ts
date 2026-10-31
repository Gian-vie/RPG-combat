import { StateIdentifier } from '../../types/combat.types';
import { CombatState } from './CombatState';
export class NormalState extends CombatState {
  public readonly id = StateIdentifier.NORMAL; public readonly name = 'NormalState'; public readonly badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'; public readonly ruleDescription = 'Ações liberadas (100% Dano Recebido)'; public readonly remainingTurns = null;
  public override clone(): CombatState { return new NormalState(); }
}
