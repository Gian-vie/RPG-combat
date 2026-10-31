import { StatsDecorator } from './StatsDecorator';
export class ShieldedDecorator extends StatsDecorator {
  public override getDefense(): number { return super.getDefense() + 25; }
  public override getDecoratorChain(): string[] { return [...super.getDecoratorChain(), 'ShieldedDecorator (+25 DEF)']; }
  public override getFormulaChain(): string { return `ShieldedDecorator(${super.getFormulaChain()})`; }
}
