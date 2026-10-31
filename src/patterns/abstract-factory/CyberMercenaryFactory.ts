import { ArchetypeType } from '../../types/combat.types';
import type { IArmor, ILoadoutFactory, IWeapon } from './ILoadoutFactory';
export class CyberMercenaryFactory implements ILoadoutFactory {
  public readonly factoryName = 'CyberMercenaryFactory'; public readonly professionTitle = 'Mercenário Arcano'; public readonly archetype = ArchetypeType.MERCENARY; public readonly recommendedMaxHp = 140;
  public createWeapon(): IWeapon { return Object.freeze({ name: 'Lâmina de Plasma Rúnica', baseDamage: 40, damageType: 'Energia Pura' }); }
  public createArmor(): IArmor { return Object.freeze({ name: 'Exoesqueleto Tático', baseDefense: 15, weightClass: 'Média' }); }
}
