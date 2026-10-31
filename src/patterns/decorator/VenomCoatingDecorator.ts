import { StatsDecorator } from './StatsDecorator';
export class VenomCoatingDecorator extends StatsDecorator {
  public override getAttack(): number { return super.getAttack() + 15; }
  public override getDecoratorChain(): string[] { return [...super.getDecoratorChain(), 'VenomCoatingDecorator (+15 ATK)']; }
  public override getFormulaChain(): string { return `VenomCoating(${super.getFormulaChain()})`; }
}
