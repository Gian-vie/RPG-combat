import { CombatEventType } from '../../types/combat.types';
import { BaseTurnCommand } from './BaseTurnCommand';
export class AttackCommand extends BaseTurnCommand {
  public readonly label = 'AttackCommand (Ataque Padrão)';
  public execute(): boolean { if (!this.actor.state.canAct()) { this.actor.notify({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type: CombatEventType.ACTION_BLOCKED, patternTag: 'State', sourceName: this.actor.name, targetName: this.target.name, details: `Ação [AttackCommand] bloqueada! ${this.actor.name} está em ${this.actor.state.name}.`, currentHp: this.actor.hp }); return false; } this.captureSnapshots(); this.target.receiveDamage(this.actor.stats.getAttack(), this.actor.name); this.actor.processTurnEndLifecycle(); return true; }
}
