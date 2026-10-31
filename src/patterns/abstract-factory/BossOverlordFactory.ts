import { ArchetypeType } from '../../types/combat.types';
import type { IArmor, ILoadoutFactory, IWeapon } from './ILoadoutFactory';
export class BossOverlordFactory implements ILoadoutFactory {
  public readonly factoryName = 'BossOverlordFactory'; public readonly professionTitle = 'Overlord Abissal (Boss IA)'; public readonly archetype = ArchetypeType.BOSS; public readonly recommendedMaxHp = 220;
  public createWeapon(): IWeapon { return Object.freeze({ name: 'Martelo da Ruína Abissal', baseDamage: 48, damageType: 'Caos / Esmagamento' }); }
  public createArmor(): IArmor { return Object.freeze({ name: 'Couraça de Obsidiana Viva', baseDefense: 22, weightClass: 'Colossal' }); }
}
