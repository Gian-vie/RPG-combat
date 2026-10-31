import type { ArchetypeType } from '../../types/combat.types';
export interface IWeapon { readonly name: string; readonly baseDamage: number; readonly damageType: string; }
export interface IArmor { readonly name: string; readonly baseDefense: number; readonly weightClass: string; }
export interface ILoadoutFactory {
  readonly factoryName: string; readonly professionTitle: string; readonly archetype: ArchetypeType; readonly recommendedMaxHp: number;
  createWeapon(): IWeapon; createArmor(): IArmor;
}
