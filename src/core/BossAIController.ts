import { ApplyDecoratorCommand } from '../patterns/command/ApplyDecoratorCommand';
import { AttackCommand } from '../patterns/command/AttackCommand';
import { ConcussiveBombCommand } from '../patterns/command/ConcussiveBombCommand';
import { EnterFlyingStateCommand } from '../patterns/command/EnterFlyingStateCommand';
import type { ICommand } from '../patterns/command/ICommand';
import { PassAndRecoverCommand } from '../patterns/command/PassAndRecoverCommand';
import { BerserkDecorator } from '../patterns/decorator/BerserkDecorator';
import { ShieldedDecorator } from '../patterns/decorator/ShieldedDecorator';
import { StateIdentifier } from '../types/combat.types';
import type { Character } from './Character';

export class BossAIController {
  public chooseCommand(boss: Character, player: Character, random = Math.random()): ICommand {
    if (!boss.state.canAct()) return new PassAndRecoverCommand(boss);
    const decoratorCount = boss.stats.getDecoratorChain().length - 1;
    if (boss.hp < boss.maxHp * 0.45 && decoratorCount < 2 && random < 0.5) return new ApplyDecoratorCommand(boss, 'ShieldedDecorator', stats => new ShieldedDecorator(stats));
    if (decoratorCount === 0 && random < 0.35) return new ApplyDecoratorCommand(boss, 'BerserkDecorator', stats => new BerserkDecorator(stats));
    if (player.state.id === StateIdentifier.NORMAL && random < 0.35) return new ConcussiveBombCommand(boss, player);
    if (boss.state.id === StateIdentifier.NORMAL && random > 0.82) return new EnterFlyingStateCommand(boss);
    return new AttackCommand(boss, player);
  }
}
