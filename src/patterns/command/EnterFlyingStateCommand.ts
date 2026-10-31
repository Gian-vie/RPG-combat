import type { Character } from '../../core/Character';
import { FlyingState } from '../state/FlyingState';
import { CombatEventType } from '../../types/combat.types';
import { BaseTurnCommand } from './BaseTurnCommand';
export class EnterFlyingStateCommand extends BaseTurnCommand {
  public readonly label = 'EnterFlyingState (Voo Evasivo 2 Turnos)';
  constructor(character: Character) { super(character, character); }
  public execute(): boolean { if (!this.actor.state.canAct()) { this.actor.notify({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type: CombatEventType.ACTION_BLOCKED, patternTag: 'State', sourceName: this.actor.name, targetName: this.actor.name, details: 'Transição negada: personagem atordoado.', currentHp: this.actor.hp }); return false; } this.captureSnapshots(); this.actor.changeState(new FlyingState(2), this.actor.name); return true; }
}
