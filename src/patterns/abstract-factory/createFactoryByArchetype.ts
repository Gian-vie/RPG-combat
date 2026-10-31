import { ArchetypeType } from '../../types/combat.types';
import { AlchemistFactory } from './AlchemistFactory';
import { BossOverlordFactory } from './BossOverlordFactory';
import { CyberMercenaryFactory } from './CyberMercenaryFactory';
import type { ILoadoutFactory } from './ILoadoutFactory';
import { WarriorFactory } from './WarriorFactory';
export function createFactoryByArchetype(archetype: ArchetypeType): ILoadoutFactory {
  switch (archetype) { case ArchetypeType.WARRIOR: return new WarriorFactory(); case ArchetypeType.ALCHEMIST: return new AlchemistFactory(); case ArchetypeType.MERCENARY: return new CyberMercenaryFactory(); case ArchetypeType.BOSS: return new BossOverlordFactory(); }
}
