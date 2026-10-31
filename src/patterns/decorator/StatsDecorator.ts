import type { ICombatStats } from './ICombatStats';
export abstract class StatsDecorator implements ICombatStats {
  constructor(protected readonly wrapped: ICombatStats) {}
  public getAttack(): number { return this.wrapped.getAttack(); } public getDefense(): number { return this.wrapped.getDefense(); }
  public getWeapon() { return this.wrapped.getWeapon(); } public getArmor() { return this.wrapped.getArmor(); }
  public getDecoratorChain(): string[] { return this.wrapped.getDecoratorChain(); } public getFormulaChain(): string { return this.wrapped.getFormulaChain(); }
}
