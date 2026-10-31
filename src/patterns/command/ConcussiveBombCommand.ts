import { StunnedState } from '../state/StunnedState';
import { CombatEventType } from '../../types/combat.types';
import { BaseTurnCommand } from './BaseTurnCommand';
export class ConcussiveBombCommand extends BaseTurnCommand {
  public readonly label = 'ConcussiveBombCommand (Dano + Stun 1t)';
  public execute(): boolean { if (!this.actor.state.canAct()) { this.actor.notify({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type: CombatEventType.ACTION_BLOCKED, patternTag: 'State', sourceName: this.actor.name, targetName: this.target.name, details: `Ação [ConcussiveBombCommand] bloqueada!`, currentHp: this.actor.hp }); return false; } this.captureSnapshots(); this.target.receiveDamage(24, this.actor.name); this.target.changeState(new StunnedState(1), this.actor.name); this.actor.processTurnEndLifecycle(); return true; }
}
