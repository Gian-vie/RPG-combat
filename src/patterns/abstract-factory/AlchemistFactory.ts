import { ArchetypeType } from '../../types/combat.types';
import type { IArmor, ILoadoutFactory, IWeapon } from './ILoadoutFactory';
export class AlchemistFactory implements ILoadoutFactory {
  public readonly factoryName = 'AlchemistFactory'; public readonly professionTitle = 'Alquimista da Peste'; public readonly archetype = ArchetypeType.ALCHEMIST; public readonly recommendedMaxHp = 120;
  public createWeapon(): IWeapon { return Object.freeze({ name: 'Lançador de Frascos Voláteis', baseDamage: 45, damageType: 'Químico / Ácido' }); }
  public createArmor(): IArmor { return Object.freeze({ name: 'Gibão de Couro Tratado', baseDefense: 10, weightClass: 'Leve' }); }
}
