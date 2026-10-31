import type { Character } from '../../core/Character';
import { CombatEventType } from '../../types/combat.types';
import { BaseTurnCommand } from './BaseTurnCommand';
export class PassAndRecoverCommand extends BaseTurnCommand {
  public readonly label = 'PassAndRecoverCommand (Cumprir Turno & Expirar Stun)';
  constructor(character: Character) { super(character, character); }
  public execute(): boolean { this.captureSnapshots(); this.actor.notify({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type: CombatEventType.TURN_PASSED, patternTag: 'State', sourceName: this.actor.name, targetName: this.actor.name, details: `${this.actor.name} consumiu o turno para recuperar o fôlego.`, currentHp: this.actor.hp }); this.actor.processTurnEndLifecycle(); return true; }
}
