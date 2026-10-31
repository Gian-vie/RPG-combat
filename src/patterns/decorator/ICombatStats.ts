import type { IArmor, IWeapon } from '../abstract-factory/ILoadoutFactory';
export interface ICombatStats { getAttack(): number; getDefense(): number; getWeapon(): IWeapon; getArmor(): IArmor; getDecoratorChain(): string[]; getFormulaChain(): string; }
