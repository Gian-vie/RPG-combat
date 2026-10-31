import { StatsDecorator } from './StatsDecorator';
export class BerserkDecorator extends StatsDecorator {
  public override getAttack(): number { return Math.round(super.getAttack() * 1.5); }
  public override getDefense(): number { return Math.max(0, super.getDefense() - 10); }
  public override getDecoratorChain(): string[] { return [...super.getDecoratorChain(), 'BerserkDecorator (+50% ATK, -10 DEF)']; }
  public override getFormulaChain(): string { return `BerserkDecorator(${super.getFormulaChain()})`; }
}
