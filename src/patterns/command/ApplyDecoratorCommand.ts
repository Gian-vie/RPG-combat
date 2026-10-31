import type { Character } from '../../core/Character';
import type { ICombatStats } from '../decorator/ICombatStats';
import { CombatEventType } from '../../types/combat.types';
import { BaseTurnCommand } from './BaseTurnCommand';
export class ApplyDecoratorCommand extends BaseTurnCommand {
  public readonly label: string;
  constructor(character: Character, private readonly decoratorName: string, private readonly builder: (stats: ICombatStats) => ICombatStats) { super(character, character); this.label = `ApplyBuff (${decoratorName})`; }
  public execute(): boolean { if (!this.actor.state.canAct()) { this.actor.notify({ id: crypto.randomUUID(), timestamp: new Date().toLocaleTimeString(), type: CombatEventType.ACTION_BLOCKED, patternTag: 'State', sourceName: this.actor.name, targetName: this.actor.name, details: `Bloqueado! Não pode aplicar [${this.decoratorName}].`, currentHp: this.actor.hp }); return false; } this.captureSnapshots(); this.actor.applyStatsDecorator(this.builder, this.decoratorName); this.actor.processTurnEndLifecycle(); return true; }
}
