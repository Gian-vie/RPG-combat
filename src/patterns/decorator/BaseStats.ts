import type { ILoadoutFactory } from '../abstract-factory/ILoadoutFactory';
import type { ICombatStats } from './ICombatStats';
export class BaseStats implements ICombatStats {
  private readonly weapon; private readonly armor;
  constructor(factory: ILoadoutFactory) { this.weapon = factory.createWeapon(); this.armor = factory.createArmor(); }
  public getAttack(): number { return this.weapon.baseDamage; } public getDefense(): number { return this.armor.baseDefense; }
  public getWeapon() { return this.weapon; } public getArmor() { return this.armor; }
  public getDecoratorChain(): string[] { return ['BaseStats']; } public getFormulaChain(): string { return 'BaseStats'; }
}
