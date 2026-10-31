import { ArchetypeType } from '../../types/combat.types';
import type { IArmor, ILoadoutFactory, IWeapon } from './ILoadoutFactory';
export class WarriorFactory implements ILoadoutFactory {
  public readonly factoryName = 'WarriorFactory'; public readonly professionTitle = 'Guerreiro Real'; public readonly archetype = ArchetypeType.WARRIOR; public readonly recommendedMaxHp = 160;
  public createWeapon(): IWeapon { return Object.freeze({ name: 'Espada Bastarda de Aço', baseDamage: 35, damageType: 'Físico Cortante' }); }
  public createArmor(): IArmor { return Object.freeze({ name: 'Armadura de Placas Real', baseDefense: 20, weightClass: 'Pesada' }); }
}
