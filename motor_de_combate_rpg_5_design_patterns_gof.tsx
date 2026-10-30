import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sword,
  Shield,
  Zap,
  RotateCcw,
  Play,
  Terminal,
  Activity,
  Layers,
  Box,
  Cpu,
  AlertTriangle,
  Feather,
  Flame,
  Skull,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  Users,
  Bot,
  Settings,
  Swords,
  Clock,
  Trophy,
  UserCheck
} from 'lucide-react';

// ============================================================================
// 1. TYPES, ENUMS & UTILITY TYPES (Aproveitamento de Recursos TypeScript)
// ============================================================================

export enum CombatEventType {
  DAMAGE_TAKEN = 'DAMAGE_TAKEN',
  STATE_CHANGED = 'STATE_CHANGED',
  BUFF_APPLIED = 'BUFF_APPLIED',
  ACTION_BLOCKED = 'ACTION_BLOCKED',
  UNDO_EXECUTED = 'UNDO_EXECUTED',
  LOADOUT_CHANGED = 'LOADOUT_CHANGED',
  TURN_PASSED = 'TURN_PASSED',
}

export enum ArchetypeType {
  WARRIOR = 'WARRIOR',
  ALCHEMIST = 'ALCHEMIST',
  MERCENARY = 'MERCENARY',
  BOSS = 'BOSS',
}

export type TurnOwner = 'P1' | 'P2';
export type GameMode = 'PVP' | 'PVE_BOSS';
export type AppPhase = 'SETUP' | 'BATTLE';

export interface CombatEventPayload {
  readonly id: string;
  readonly timestamp: string;
  readonly type: CombatEventType;
  readonly patternTag: 'Abstract Factory' | 'Decorator' | 'State' | 'Command' | 'Observer';
  readonly sourceName: string;
  readonly targetName: string;
  readonly details: string;
  readonly currentHp: number;
  readonly damageDealt?: number;
}

// Utility Type Readonly garantindo integridade e confidencialidade do payload
export type ImmutableEvent = Readonly<CombatEventPayload>;

export interface AuditMetrics {
  readonly totalEvents: number;
  readonly totalDamage: number;
  readonly blockedActions: number;
  readonly rollbacksExecuted: number;
}

// ============================================================================
// 2. OBSERVER PATTERN [Comportamental]
// ============================================================================

export interface IObserver<T> {
  update(event: T): void;
}

export interface ISubject<T> {
  attach(observer: IObserver<T>): void;
  detach(observer: IObserver<T>): void;
  notify(event: T): void;
}

export class DOMCombatLogObserver implements IObserver<ImmutableEvent> {
  private logs: ImmutableEvent[] = [];
  private readonly onUpdateCallback: (logs: ImmutableEvent[]) => void;

  constructor(onUpdateCallback: (logs: ImmutableEvent[]) => void) {
    this.onUpdateCallback = onUpdateCallback;
  }

  public update(event: ImmutableEvent): void {
    // Limite de 120 registros para preservar disponibilidade de memória
    this.logs = [event, ...this.logs].slice(0, 120);
    this.onUpdateCallback([...this.logs]);
  }

  public clear(): void {
    this.logs = [];
    this.onUpdateCallback([]);
  }
}

export class MetricsAuditorObserver implements IObserver<ImmutableEvent> {
  private totalEvents = 0;
  private totalDamage = 0;
  private blockedActions = 0;
  private rollbacksExecuted = 0;
  private readonly onMetricsCallback: (metrics: Readonly<AuditMetrics>) => void;

  constructor(onMetricsCallback: (metrics: Readonly<AuditMetrics>) => void) {
    this.onMetricsCallback = onMetricsCallback;
  }

  public update(event: ImmutableEvent): void {
    this.totalEvents += 1;

    if (event.type === CombatEventType.DAMAGE_TAKEN && typeof event.damageDealt === 'number') {
      this.totalDamage += Math.max(0, event.damageDealt);
    } else if (event.type === CombatEventType.ACTION_BLOCKED) {
      this.blockedActions += 1;
    } else if (event.type === CombatEventType.UNDO_EXECUTED) {
      this.rollbacksExecuted += 1;
    }

    this.onMetricsCallback(
      Object.freeze({
        totalEvents: this.totalEvents,
        totalDamage: this.totalDamage,
        blockedActions: this.blockedActions,
        rollbacksExecuted: this.rollbacksExecuted,
      })
    );
  }

  public reset(): void {
    this.totalEvents = 0;
    this.totalDamage = 0;
    this.blockedActions = 0;
    this.rollbacksExecuted = 0;
    this.onMetricsCallback(
      Object.freeze({
        totalEvents: 0,
        totalDamage: 0,
        blockedActions: 0,
        rollbacksExecuted: 0,
      })
    );
  }
}

// ============================================================================
// 3. ABSTRACT FACTORY PATTERN [Criacional]
// ============================================================================

export interface IWeapon {
  readonly name: string;
  readonly baseDamage: number;
  readonly damageType: string;
}

export interface IArmor {
  readonly name: string;
  readonly baseDefense: number;
  readonly weightClass: string;
}

export interface ILoadoutFactory {
  readonly factoryName: string;
  readonly professionTitle: string;
  readonly archetype: ArchetypeType;
  readonly recommendedMaxHp: number;
  createWeapon(): IWeapon;
  createArmor(): IArmor;
}

export class WarriorFactory implements ILoadoutFactory {
  public readonly factoryName = 'WarriorFactory';
  public readonly professionTitle = 'Guerreiro Real';
  public readonly archetype = ArchetypeType.WARRIOR;
  public readonly recommendedMaxHp = 160;

  public createWeapon(): IWeapon {
    return Object.freeze({
      name: 'Espada Bastarda de Aço',
      baseDamage: 35,
      damageType: 'Físico Cortante',
    });
  }

  public createArmor(): IArmor {
    return Object.freeze({
      name: 'Armadura de Placas Real',
      baseDefense: 20,
      weightClass: 'Pesada',
    });
  }
}

export class AlchemistFactory implements ILoadoutFactory {
  public readonly factoryName = 'AlchemistFactory';
  public readonly professionTitle = 'Alquimista da Peste';
  public readonly archetype = ArchetypeType.ALCHEMIST;
  public readonly recommendedMaxHp = 120;

  public createWeapon(): IWeapon {
    return Object.freeze({
      name: 'Lançador de Frascos Voláteis',
      baseDamage: 45,
      damageType: 'Químico / Ácido',
    });
  }

  public createArmor(): IArmor {
    return Object.freeze({
      name: 'Gibão de Couro Tratado',
      baseDefense: 10,
      weightClass: 'Leve',
    });
  }
}

export class CyberMercenaryFactory implements ILoadoutFactory {
  public readonly factoryName = 'CyberMercenaryFactory';
  public readonly professionTitle = 'Mercenário Arcano';
  public readonly archetype = ArchetypeType.MERCENARY;
  public readonly recommendedMaxHp = 140;

  public createWeapon(): IWeapon {
    return Object.freeze({
      name: 'Lâmina de Plasma Rúnica',
      baseDamage: 40,
      damageType: 'Energia Pura',
    });
  }

  public createArmor(): IArmor {
    return Object.freeze({
      name: 'Exoesqueleto Tático',
      baseDefense: 15,
      weightClass: 'Média',
    });
  }
}

export class BossOverlordFactory implements ILoadoutFactory {
  public readonly factoryName = 'BossOverlordFactory';
  public readonly professionTitle = 'Overlord Abissal (Boss IA)';
  public readonly archetype = ArchetypeType.BOSS;
  public readonly recommendedMaxHp = 220;

  public createWeapon(): IWeapon {
    return Object.freeze({
      name: 'Martelo da Ruína Abissal',
      baseDamage: 48,
      damageType: 'Caos / Esmagamento',
    });
  }

  public createArmor(): IArmor {
    return Object.freeze({
      name: 'Couraça de Obsidiana Viva',
      baseDefense: 22,
      weightClass: 'Colossal',
    });
  }
}

export function createFactoryByArchetype(archetype: ArchetypeType): ILoadoutFactory {
  switch (archetype) {
    case ArchetypeType.WARRIOR:
      return new WarriorFactory();
    case ArchetypeType.ALCHEMIST:
      return new AlchemistFactory();
    case ArchetypeType.MERCENARY:
      return new CyberMercenaryFactory();
    case ArchetypeType.BOSS:
      return new BossOverlordFactory();
  }
}

// ============================================================================
// 4. DECORATOR PATTERN [Estrutural]
// ============================================================================

export interface ICombatStats {
  getAttack(): number;
  getDefense(): number;
  getWeapon(): IWeapon;
  getArmor(): IArmor;
  getDecoratorChain(): string[];
  getFormulaChain(): string;
}

export class BaseStats implements ICombatStats {
  private readonly weapon: IWeapon;
  private readonly armor: IArmor;

  constructor(factory: ILoadoutFactory) {
    this.weapon = factory.createWeapon();
    this.armor = factory.createArmor();
  }

  public getAttack(): number {
    return this.weapon.baseDamage;
  }

  public getDefense(): number {
    return this.armor.baseDefense;
  }

  public getWeapon(): IWeapon {
    return this.weapon;
  }

  public getArmor(): IArmor {
    return this.armor;
  }

  public getDecoratorChain(): string[] {
    return ['BaseStats'];
  }

  public getFormulaChain(): string {
    return 'BaseStats';
  }
}

export abstract class StatsDecorator implements ICombatStats {
  protected readonly wrapped: ICombatStats;

  constructor(wrapped: ICombatStats) {
    this.wrapped = wrapped;
  }

  public getAttack(): number {
    return this.wrapped.getAttack();
  }

  public getDefense(): number {
    return this.wrapped.getDefense();
  }

  public getWeapon(): IWeapon {
    return this.wrapped.getWeapon();
  }

  public getArmor(): IArmor {
    return this.wrapped.getArmor();
  }

  public getDecoratorChain(): string[] {
    return this.wrapped.getDecoratorChain();
  }

  public getFormulaChain(): string {
    return this.wrapped.getFormulaChain();
  }
}

export class BerserkDecorator extends StatsDecorator {
  public override getAttack(): number {
    return Math.round(super.getAttack() * 1.5);
  }

  public override getDefense(): number {
    return Math.max(0, super.getDefense() - 10);
  }

  public override getDecoratorChain(): string[] {
    return [...super.getDecoratorChain(), 'BerserkDecorator (+50% ATK, -10 DEF)'];
  }

  public override getFormulaChain(): string {
    return `BerserkDecorator(${super.getFormulaChain()})`;
  }
}

export class ShieldedDecorator extends StatsDecorator {
  public override getDefense(): number {
    return super.getDefense() + 25;
  }

  public override getDecoratorChain(): string[] {
    return [...super.getDecoratorChain(), 'ShieldedDecorator (+25 DEF)'];
  }

  public override getFormulaChain(): string {
    return `ShieldedDecorator(${super.getFormulaChain()})`;
  }
}

export class VenomCoatingDecorator extends StatsDecorator {
  public override getAttack(): number {
    return super.getAttack() + 15;
  }

  public override getDecoratorChain(): string[] {
    return [...super.getDecoratorChain(), 'VenomCoatingDecorator (+15 ATK)'];
  }

  public override getFormulaChain(): string {
    return `VenomCoating(${super.getFormulaChain()})`;
  }
}

// ============================================================================
// 5. STATE PATTERN [Comportamental] (Com Duração de Turnos e Auto-Transição)
// ============================================================================

export enum StateIdentifier {
  NORMAL = 'NORMAL',
  STUNNED = 'STUNNED',
  FLYING = 'FLYING',
}

export abstract class CombatState {
  public abstract readonly id: StateIdentifier;
  public abstract readonly name: string;
  public abstract readonly badgeColor: string;
  public abstract readonly ruleDescription: string;
  public abstract readonly remainingTurns: number | null;

  public canAct(): boolean {
    return true;
  }

  public modifyIncomingDamage(rawDamage: number): number {
    return rawDamage;
  }

  // Hook de ciclo de turno: permite que o próprio Estado controle sua expiração
  public onTurnEnd(_character: Character): void {
    // NormalState não expira
  }

  public abstract clone(): CombatState;
}

export class NormalState extends CombatState {
  public readonly id = StateIdentifier.NORMAL;
  public readonly name = 'NormalState';
  public readonly badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  public readonly ruleDescription = 'Ações liberadas (100% Dano Recebido)';
  public readonly remainingTurns = null;

  public override clone(): CombatState {
    return new NormalState();
  }
}

export class StunnedState extends CombatState {
  public readonly id = StateIdentifier.STUNNED;
  public readonly badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse';
  private turnsLeft: number;

  constructor(turns: number = 1) {
    super();
    this.turnsLeft = Math.max(1, turns);
  }

  public get name(): string {
    return `StunnedState (${this.turnsLeft}t)`;
  }

  public get remainingTurns(): number {
    return this.turnsLeft;
  }

  public get ruleDescription(): string {
    return `canAct() = false | Vulnerável (+25% Dano) | Expira ao consumir ${this.turnsLeft} turno(s)`;
  }

  public override canAct(): boolean {
    return false;
  }

  public override modifyIncomingDamage(rawDamage: number): number {
    return Math.round(rawDamage * 1.25);
  }

  public override onTurnEnd(character: Character): void {
    this.turnsLeft -= 1;
    if (this.turnsLeft <= 0) {
      character.changeState(new NormalState(), 'Expiração de Stun (State Lifecycle)');
    }
  }

  public override clone(): CombatState {
    return new StunnedState(this.turnsLeft);
  }
}

export class FlyingState extends CombatState {
  public readonly id = StateIdentifier.FLYING;
  public readonly badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
  private turnsLeft: number;

  constructor(turns: number = 2) {
    super();
    this.turnsLeft = Math.max(1, turns);
  }

  public get name(): string {
    return `FlyingState (${this.turnsLeft}t)`;
  }

  public get remainingTurns(): number {
    return this.turnsLeft;
  }

  public get ruleDescription(): string {
    return `Evasão Aérea: Reduz dano em 50% | Dura mais ${this.turnsLeft} turno(s)`;
  }

  public override modifyIncomingDamage(rawDamage: number): number {
    return Math.round(rawDamage * 0.5);
  }

  public override onTurnEnd(character: Character): void {
    this.turnsLeft -= 1;
    if (this.turnsLeft <= 0) {
      character.changeState(new NormalState(), 'Pouso Automático (Fim do Voo)');
    }
  }

  public override clone(): CombatState {
    return new FlyingState(this.turnsLeft);
  }
}

// ============================================================================
// 6. CORE ENTITY: CHARACTER (Contexto do State e Subject do Observer)
// ============================================================================

export interface CharacterSnapshot {
  readonly name: string;
  readonly maxHp: number;
  readonly hp: number;
  readonly state: CombatState;
  readonly stats: ICombatStats;
  readonly factory: ILoadoutFactory;
}

export class Character implements ISubject<ImmutableEvent> {
  public readonly id: TurnOwner;
  private characterName: string;
  private maxHpValue: number;
  private hpValue: number;
  private currentState: CombatState;
  private currentStats: ICombatStats;
  private currentFactory: ILoadoutFactory;
  private readonly observers: Set<IObserver<ImmutableEvent>> = new Set();

  constructor(id: TurnOwner, name: string, factory: ILoadoutFactory) {
    this.id = id;
    this.characterName = name.trim() || 'Combatente';
    this.currentFactory = factory;
    this.maxHpValue = factory.recommendedMaxHp;
    this.hpValue = this.maxHpValue;
    this.currentState = new NormalState();
    this.currentStats = new BaseStats(factory);
  }

  public get name(): string {
    return this.characterName;
  }

  public get maxHp(): number {
    return this.maxHpValue;
  }

  public get hp(): number {
    return this.hpValue;
  }

  public get state(): CombatState {
    return this.currentState;
  }

  public get stats(): ICombatStats {
    return this.currentStats;
  }

  public get factory(): ILoadoutFactory {
    return this.currentFactory;
  }

  public configureCharacter(newName: string, newFactory: ILoadoutFactory): void {
    const sanitized = newName.trim().slice(0, 32) || 'Combatente';
    this.characterName = sanitized;
    this.currentFactory = newFactory;
    this.maxHpValue = newFactory.recommendedMaxHp;
    this.hpValue = this.maxHpValue;
    this.currentState = new NormalState();
    this.currentStats = new BaseStats(newFactory);

    this.notify({
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type: CombatEventType.LOADOUT_CHANGED,
      patternTag: 'Abstract Factory',
      sourceName: newFactory.factoryName,
      targetName: this.characterName,
      details: `[${newFactory.professionTitle}] equipado com ${this.currentStats.getWeapon().name} (ATK ${this.currentStats.getAttack()}) & ${this.currentStats.getArmor().name} (DEF ${this.currentStats.getDefense()})`,
      currentHp: this.hpValue,
    });
  }

  public applyStatsDecorator(
    decoratorBuilder: (current: ICombatStats) => ICombatStats,
    decoratorName: string
  ): void {
    this.currentStats = decoratorBuilder(this.currentStats);
    this.notify({
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type: CombatEventType.BUFF_APPLIED,
      patternTag: 'Decorator',
      sourceName: this.characterName,
      targetName: this.characterName,
      details: `Aplicou [${decoratorName}] -> ${this.currentStats.getFormulaChain()} (ATK: ${this.currentStats.getAttack()}, DEF: ${this.currentStats.getDefense()})`,
      currentHp: this.hpValue,
    });
  }

  public changeState(newState: CombatState, sourceName: string = this.characterName): void {
    this.currentState = newState;
    this.notify({
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type: CombatEventType.STATE_CHANGED,
      patternTag: 'State',
      sourceName,
      targetName: this.characterName,
      details: `Transição de Estado para [${newState.name}] — ${newState.ruleDescription}`,
      currentHp: this.hpValue,
    });
  }

  public processTurnEndLifecycle(): void {
    this.currentState.onTurnEnd(this);
  }

  public receiveDamage(rawAttack: number, attackerName: string): number {
    const defense = this.currentStats.getDefense();
    const mitigated = Math.max(1, rawAttack - defense);
    const finalDamage = Math.max(0, this.currentState.modifyIncomingDamage(mitigated));

    this.hpValue = Math.max(0, Math.min(this.maxHpValue, this.hpValue - finalDamage));

    this.notify({
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type: CombatEventType.DAMAGE_TAKEN,
      patternTag: 'Observer',
      sourceName: attackerName,
      targetName: this.characterName,
      details: `Sofreu ${finalDamage} de dano! [Bruto: ${rawAttack} - DEF: ${defense} = ${mitigated} | Estado ${this.currentState.name}: ${finalDamage}]`,
      currentHp: this.hpValue,
      damageDealt: finalDamage,
    });

    return finalDamage;
  }

  public createSnapshot(): Readonly<CharacterSnapshot> {
    return Object.freeze({
      name: this.characterName,
      maxHp: this.maxHpValue,
      hp: this.hpValue,
      state: this.currentState.clone(),
      stats: this.currentStats,
      factory: this.currentFactory,
    });
  }

  public restoreSnapshot(snapshot: Readonly<CharacterSnapshot>, actionLabel: string): void {
    this.characterName = snapshot.name;
    this.maxHpValue = snapshot.maxHp;
    this.hpValue = Math.min(this.maxHpValue, Math.max(0, snapshot.hp));
    this.currentState = snapshot.state.clone();
    this.currentStats = snapshot.stats;
    this.currentFactory = snapshot.factory;

    this.notify({
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type: CombatEventType.UNDO_EXECUTED,
      patternTag: 'Command',
      sourceName: 'BattleArena.undo()',
      targetName: this.characterName,
      details: `Rollback [${actionLabel}] -> HP: ${this.hpValue}, Estado: ${this.currentState.name}`,
      currentHp: this.hpValue,
    });
  }

  public attach(observer: IObserver<ImmutableEvent>): void {
    this.observers.add(observer);
  }

  public detach(observer: IObserver<ImmutableEvent>): void {
    this.observers.delete(observer);
  }

  public notify(event: ImmutableEvent): void {
    const frozenPayload = Object.freeze({ ...event });
    for (const observer of this.observers) {
      observer.update(frozenPayload);
    }
  }
}

// ============================================================================
// 7. COMMAND PATTERN [Comportamental] (Com suporte a Turn-Based Snapshot)
// ============================================================================

export interface ICommand {
  readonly id: string;
  readonly label: string;
  readonly actor: Character;
  readonly target: Character;
  readonly timestamp: string;
  execute(): boolean;
  undo(): void;
}

abstract class BaseTurnCommand implements ICommand {
  public readonly id = crypto.randomUUID();
  public abstract readonly label: string;
  public readonly actor: Character;
  public readonly target: Character;
  public readonly timestamp: string;

  protected actorSnapshot?: Readonly<CharacterSnapshot>;
  protected targetSnapshot?: Readonly<CharacterSnapshot>;

  constructor(actor: Character, target: Character) {
    this.actor = actor;
    this.target = target;
    this.timestamp = new Date().toLocaleTimeString();
  }

  protected captureSnapshots(): void {
    this.actorSnapshot = this.actor.createSnapshot();
    this.targetSnapshot = this.target.createSnapshot();
  }

  public abstract execute(): boolean;

  public undo(): void {
    if (this.targetSnapshot && this.target !== this.actor) {
      this.target.restoreSnapshot(this.targetSnapshot, this.label);
    }
    if (this.actorSnapshot) {
      this.actor.restoreSnapshot(this.actorSnapshot, this.label);
    }
  }
}

export class AttackCommand extends BaseTurnCommand {
  public readonly label = 'AttackCommand (Ataque Padrão)';

  public execute(): boolean {
    if (!this.actor.state.canAct()) {
      this.actor.notify({
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: CombatEventType.ACTION_BLOCKED,
        patternTag: 'State',
        sourceName: this.actor.name,
        targetName: this.target.name,
        details: `Ação [AttackCommand] bloqueada! ${this.actor.name} está em ${this.actor.state.name}. Use "Recuperar do Stun" para consumir o turno.`,
        currentHp: this.actor.hp,
      });
      return false;
    }

    this.captureSnapshots();
    const attackPower = this.actor.stats.getAttack();
    this.target.receiveDamage(attackPower, this.actor.name);
    // Processa expiração de estados ativos do atacante (ex.: reduz 1 turno de FlyingState)
    this.actor.processTurnEndLifecycle();
    return true;
  }
}

export class ConcussiveBombCommand extends BaseTurnCommand {
  public readonly label = 'ConcussiveBombCommand (Dano + Stun 1t)';

  public execute(): boolean {
    if (!this.actor.state.canAct()) {
      this.actor.notify({
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: CombatEventType.ACTION_BLOCKED,
        patternTag: 'State',
        sourceName: this.actor.name,
        targetName: this.target.name,
        details: `Ação [ConcussiveBombCommand] bloqueada! ${this.actor.name} está em ${this.actor.state.name}.`,
        currentHp: this.actor.hp,
      });
      return false;
    }

    this.captureSnapshots();
    this.target.receiveDamage(24, this.actor.name);
    this.target.changeState(new StunnedState(1), this.actor.name);
    this.actor.processTurnEndLifecycle();
    return true;
  }
}

export class ApplyDecoratorCommand extends BaseTurnCommand {
  public readonly label: string;
  private readonly decoratorName: string;
  private readonly builder: (stats: ICombatStats) => ICombatStats;

  constructor(
    character: Character,
    decoratorName: string,
    builder: (stats: ICombatStats) => ICombatStats
  ) {
    super(character, character);
    this.decoratorName = decoratorName;
    this.builder = builder;
    this.label = `ApplyBuff (${decoratorName})`;
  }

  public execute(): boolean {
    if (!this.actor.state.canAct()) {
      this.actor.notify({
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: CombatEventType.ACTION_BLOCKED,
        patternTag: 'State',
        sourceName: this.actor.name,
        targetName: this.actor.name,
        details: `Bloqueado! Não pode aplicar Decorator [${this.decoratorName}] enquanto estiver em ${this.actor.state.name}.`,
        currentHp: this.actor.hp,
      });
      return false;
    }

    this.captureSnapshots();
    this.actor.applyStatsDecorator(this.builder, this.decoratorName);
    this.actor.processTurnEndLifecycle();
    return true;
  }
}

export class EnterFlyingStateCommand extends BaseTurnCommand {
  public readonly label = 'EnterFlyingState (Voo Evasivo 2 Turnos)';

  constructor(character: Character) {
    super(character, character);
  }

  public execute(): boolean {
    if (!this.actor.state.canAct()) {
      this.actor.notify({
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString(),
        type: CombatEventType.ACTION_BLOCKED,
        patternTag: 'State',
        sourceName: this.actor.name,
        targetName: this.actor.name,
        details: `Transição negada! ${this.actor.name} está atordoado e não pode alçar voo.`,
        currentHp: this.actor.hp,
      });
      return false;
    }

    this.captureSnapshots();
    this.actor.changeState(new FlyingState(2), this.actor.name);
    return true;
  }
}

// Comando específico para consumir o turno quando Stunned e disparar a recuperação do Estado
export class PassAndRecoverCommand extends BaseTurnCommand {
  public readonly label = 'PassAndRecoverCommand (Cumprir Turno & Expirar Stun)';

  constructor(character: Character) {
    super(character, character);
  }

  public execute(): boolean {
    this.captureSnapshots();
    this.actor.notify({
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleTimeString(),
      type: CombatEventType.TURN_PASSED,
      patternTag: 'State',
      sourceName: this.actor.name,
      targetName: this.actor.name,
      details: `${this.actor.name} consumiu o turno para recuperar o fôlego.`,
      currentHp: this.actor.hp,
    });
    // Aciona o hook onTurnEnd do State atual (fazendo StunnedState decrementar e voltar para NormalState)
    this.actor.processTurnEndLifecycle();
    return true;
  }
}

// Registro de Turno no Invoker BattleArena
export interface TurnHistoryRecord {
  readonly command: ICommand;
  readonly previousTurnOwner: TurnOwner;
  readonly previousTurnNumber: number;
}

export class BattleArena {
  private history: TurnHistoryRecord[] = [];
  private activeTurnOwner: TurnOwner = 'P1';
  private turnCounter = 1;

  public get activeTurn(): TurnOwner {
    return this.activeTurnOwner;
  }

  public get turnNumber(): number {
    return this.turnCounter;
  }

  public dispatchTurnCommand(command: ICommand): boolean {
    // Validação de integridade de turno: apenas o dono do turno atual pode agir
    if (command.actor.id !== this.activeTurnOwner) {
      return false;
    }

    const prevOwner = this.activeTurnOwner;
    const prevTurnNum = this.turnCounter;

    const executed = command.execute();
    if (executed) {
      this.history.push(
        Object.freeze({
          command,
          previousTurnOwner: prevOwner,
          previousTurnNumber: prevTurnNum,
        })
      );
      // Passa a vez para o próximo combatente
      this.activeTurnOwner = this.activeTurnOwner === 'P1' ? 'P2' : 'P1';
      this.turnCounter += 1;
    }
    return executed;
  }

  public undoLastTurn(): TurnHistoryRecord | null {
    const lastRecord = this.history.pop();
    if (!lastRecord) return null;

    lastRecord.command.undo();
    this.activeTurnOwner = lastRecord.previousTurnOwner;
    this.turnCounter = lastRecord.previousTurnNumber;
    return lastRecord;
  }

  public getHistory(): ReadonlyArray<TurnHistoryRecord> {
    return [...this.history];
  }

  public resetArena(): void {
    this.history = [];
    this.activeTurnOwner = 'P1';
    this.turnCounter = 1;
  }
}

// ============================================================================
// 8. COMPONENTE PRINCIPAL REACT (INTERFACE TÁTICA WEB)
// ============================================================================

export default function App() {
  // Instâncias centrais do domínio
  const arenaRef = useRef<BattleArena>(new BattleArena());
  const p1Ref = useRef<Character>(
    new Character('P1', 'Aldric', new WarriorFactory())
  );
  const p2Ref = useRef<Character>(
    new Character('P2', 'Overlord Malakor', new BossOverlordFactory())
  );

  // Estado de Modo de Jogo e Fase (Edição vs Batalha)
  const [appPhase, setAppPhase] = useState<AppPhase>('SETUP');
  const [gameMode, setGameMode] = useState<GameMode>('PVE_BOSS');

  // Estados de configuração (Modo de Edição)
  const [p1NameInput, setP1NameInput] = useState<string>('Aldric');
  const [p1Archetype, setP1Archetype] = useState<ArchetypeType>(ArchetypeType.WARRIOR);
  const [p2NameInput, setP2NameInput] = useState<string>('Vex');
  const [p2Archetype, setP2Archetype] = useState<ArchetypeType>(ArchetypeType.ALCHEMIST);

  // Estados reativos para sincronizar a UI com as classes OO
  const [, setRenderTick] = useState<number>(0);
  const [logs, setLogs] = useState<ImmutableEvent[]>([]);
  const [metrics, setMetrics] = useState<Readonly<AuditMetrics>>({
    totalEvents: 0,
    totalDamage: 0,
    blockedActions: 0,
    rollbacksExecuted: 0,
  });
  const [turnHistory, setTurnHistory] = useState<ReadonlyArray<TurnHistoryRecord>>([]);
  const [activeTab, setActiveTab] = useState<'arena' | 'patterns'>('arena');
  const [highlightedPattern, setHighlightedPattern] = useState<string | null>(null);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [isBossThinking, setIsBossThinking] = useState<boolean>(false);

  const logObserverRef = useRef<DOMCombatLogObserver | null>(null);
  const metricsObserverRef = useRef<MetricsAuditorObserver | null>(null);

  const syncUI = useCallback(() => {
    setRenderTick((t) => t + 1);
    setTurnHistory(arenaRef.current.getHistory());
  }, []);

  // Registro dos Observers na inicialização
  useEffect(() => {
    const logObs = new DOMCombatLogObserver((updatedLogs) => {
      setLogs(updatedLogs);
    });
    const metricsObs = new MetricsAuditorObserver((updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    logObserverRef.current = logObs;
    metricsObserverRef.current = metricsObs;

    const p1 = p1Ref.current;
    const p2 = p2Ref.current;

    p1.attach(logObs);
    p1.attach(metricsObs);
    p2.attach(logObs);
    p2.attach(metricsObs);

    p1.configureCharacter('Aldric', new WarriorFactory());
    p2.configureCharacter('Overlord Malakor', new BossOverlordFactory());
    syncUI();

    return () => {
      p1.detach(logObs);
      p1.detach(metricsObs);
      p2.detach(logObs);
      p2.detach(metricsObs);
    };
  }, [syncUI]);

  // Atualiza preview imediato dos personagens durante o Modo de Edição (SETUP)
  const handleApplySetupPreview = useCallback(
    (
      nextMode: GameMode,
      nextP1Name: string,
      nextP1Arch: ArchetypeType,
      nextP2Name: string,
      nextP2Arch: ArchetypeType
    ) => {
      const f1 = createFactoryByArchetype(nextP1Arch);
      p1Ref.current.configureCharacter(nextP1Name, f1);

      if (nextMode === 'PVE_BOSS') {
        p2Ref.current.configureCharacter('Overlord Malakor (Boss)', new BossOverlordFactory());
      } else {
        const f2 = createFactoryByArchetype(nextP2Arch);
        p2Ref.current.configureCharacter(nextP2Name, f2);
      }
      arenaRef.current.resetArena();
      syncUI();
    },
    [syncUI]
  );

  // Iniciar Batalha (Trava edição de personagens)
  const handleStartBattle = () => {
    logObserverRef.current?.clear();
    metricsObserverRef.current?.reset();
    handleApplySetupPreview(gameMode, p1NameInput, p1Archetype, p2NameInput, p2Archetype);
    setAppPhase('BATTLE');
    syncUI();
  };

  // Voltar ao Modo de Edição (Destrava fábricas e configurações)
  const handleUnlockAndReturnToSetup = () => {
    setIsAutoRunning(false);
    setIsBossThinking(false);
    setAppPhase('SETUP');
    arenaRef.current.resetArena();
    handleApplySetupPreview(gameMode, p1NameInput, p1Archetype, p2NameInput, p2Archetype);
    syncUI();
  };

  const p1 = p1Ref.current;
  const p2 = p2Ref.current;
  const arena = arenaRef.current;
  const winner: Character | null = p1.hp <= 0 ? p2 : p2.hp <= 0 ? p1 : null;

  // Execução de comando no turno atual
  const executeCommand = useCallback(
    (cmd: ICommand) => {
      if (winner) return;
      arenaRef.current.dispatchTurnCommand(cmd);
      syncUI();
    },
    [syncUI, winner]
  );

  // Desfazer Turno (No modo Boss, se for a vez do P1, desfaz a jogada do Boss e a do P1 para voltar à vez do P1)
  const handleUndo = () => {
    if (isBossThinking || isAutoRunning) return;
    if (gameMode === 'PVE_BOSS' && arena.activeTurn === 'P1' && arena.getHistory().length >= 2) {
      arena.undoLastTurn(); // Desfaz turno do Boss
      arena.undoLastTurn(); // Desfaz turno do Player 1
    } else {
      arena.undoLastTurn();
    }
    syncUI();
  };

  // IA Autônoma do Boss quando está no modo PVE_BOSS e o turno passa para P2
  useEffect(() => {
    if (
      appPhase !== 'BATTLE' ||
      gameMode !== 'PVE_BOSS' ||
      arena.activeTurn !== 'P2' ||
      winner !== null ||
      isAutoRunning
    ) {
      return;
    }

    setIsBossThinking(true);
    const timer = setTimeout(() => {
      const boss = p2Ref.current;
      const player = p1Ref.current;

      let chosenCommand: ICommand;

      // 1. Se o Boss estiver Stunned, ele é obrigado a usar PassAndRecoverCommand para sair do Stun
      if (!boss.state.canAct()) {
        chosenCommand = new PassAndRecoverCommand(boss);
      } else {
        const decoratorCount = boss.stats.getDecoratorChain().length - 1;
        const roll = Math.random();

        // 2. Decisão tática inteligente do Boss
        if (boss.hp < boss.maxHp * 0.45 && decoratorCount < 2 && roll < 0.5) {
          chosenCommand = new ApplyDecoratorCommand(
            boss,
            'ShieldedDecorator',
            (s) => new ShieldedDecorator(s)
          );
        } else if (decoratorCount === 0 && roll < 0.35) {
          chosenCommand = new ApplyDecoratorCommand(
            boss,
            'BerserkDecorator',
            (s) => new BerserkDecorator(s)
          );
        } else if (player.state.id === StateIdentifier.NORMAL && roll < 0.35) {
          chosenCommand = new ConcussiveBombCommand(boss, player);
        } else if (boss.state.id === StateIdentifier.NORMAL && roll > 0.82) {
          chosenCommand = new EnterFlyingStateCommand(boss);
        } else {
          chosenCommand = new AttackCommand(boss, player);
        }
      }

      arenaRef.current.dispatchTurnCommand(chosenCommand);
      setIsBossThinking(false);
      syncUI();
    }, 950);

    return () => clearTimeout(timer);
  }, [appPhase, gameMode, arena.activeTurn, arena.turnNumber, winner, isAutoRunning, syncUI]);

  // Roteiro Guiado Automático (Demonstração completa dos 5 Padrões respeitando os turnos)
  const runGuidedSimulation = async () => {
    if (isAutoRunning) return;
    setIsAutoRunning(true);
    setIsBossThinking(false);

    logObserverRef.current?.clear();
    metricsObserverRef.current?.reset();
    p1Ref.current.configureCharacter('Aldric (Guerreiro)', new WarriorFactory());
    p2Ref.current.configureCharacter('Vex (Alquimista)', new AlchemistFactory());
    arenaRef.current.resetArena();
    setAppPhase('BATTLE');
    syncUI();

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const w = p1Ref.current;
    const a = p2Ref.current;

    await delay(650);
    // Turno 1 (P1 - Guerreiro): Aplica BerserkDecorator
    arenaRef.current.dispatchTurnCommand(
      new ApplyDecoratorCommand(w, 'BerserkDecorator', (s) => new BerserkDecorator(s))
    );
    syncUI();

    await delay(850);
    // Turno 2 (P2 - Alquimista): Entra em FlyingState (2 turnos)
    arenaRef.current.dispatchTurnCommand(new EnterFlyingStateCommand(a));
    syncUI();

    await delay(850);
    // Turno 3 (P1 - Guerreiro): Ataca Alquimista voando (Dano reduzido em 50% pelo FlyingState)
    arenaRef.current.dispatchTurnCommand(new AttackCommand(w, a));
    syncUI();

    await delay(950);
    // Turno 4 (P2 - Alquimista): Lança Bomba Concussiva no Guerreiro (Causa dano e aplica StunnedState 1t)
    arenaRef.current.dispatchTurnCommand(new ConcussiveBombCommand(a, w));
    syncUI();

    await delay(950);
    // Turno 5 (P1 - Guerreiro): Tenta atacar mesmo Stunned -> State bloqueia a ação (Continua no Turno 5!)
    arenaRef.current.dispatchTurnCommand(new AttackCommand(w, a));
    syncUI();

    await delay(950);
    // Turno 5 ainda (P1 - Guerreiro): Usa PassAndRecoverCommand para consumir seu turno e sair do Stun!
    arenaRef.current.dispatchTurnCommand(new PassAndRecoverCommand(w));
    syncUI();

    await delay(950);
    // Demonstração de Rollback via Command.undo()
    arenaRef.current.undoLastTurn();
    syncUI();

    setIsAutoRunning(false);
  };

  const getHighlightRing = (patternName: string) =>
    highlightedPattern === patternName
      ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/20 transition-all duration-300'
      : 'transition-all duration-300';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* HEADER BAR */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  RPG Turn-Based Combat Engine
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold border ${
                    appPhase === 'SETUP'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {appPhase === 'SETUP' ? 'MODO DE EDIÇÃO' : 'MODO DE BATALHA (TRAVADO)'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Abstract Factory • Decorator • State (Auto-Expire) • Command (Undo) • Observer
              </p>
            </div>
          </div>

          {/* CONTROLES GLOBAIS */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={runGuidedSimulation}
              disabled={isAutoRunning || isBossThinking}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {isAutoRunning ? 'Simulando Roteiro...' : 'Demo Automática'}
            </button>

            {appPhase === 'BATTLE' && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={turnHistory.length === 0 || isAutoRunning || isBossThinking}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/40 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Undo Turno ({turnHistory.length})
                </button>

                <button
                  onClick={handleUnlockAndReturnToSetup}
                  disabled={isAutoRunning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  Editar Personagens
                </button>
              </>
            )}

            <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setActiveTab('arena')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  activeTab === 'arena'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sword className="w-3.5 h-3.5" />
                Arena & Setup
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                  activeTab === 'patterns'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Mapeamento GoF (README)
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE INSPEÇÃO DE PADRÕES */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Inspecionar Padrão GoF na Interface:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'Abstract Factory', cat: 'Criacional' },
                { id: 'Decorator', cat: 'Estrutural' },
                { id: 'State', cat: 'Comportamental' },
                { id: 'Command', cat: 'Comportamental' },
                { id: 'Observer', cat: 'Comportamental' },
              ].map((pat) => (
                <button
                  key={pat.id}
                  onClick={() =>
                    setHighlightedPattern(highlightedPattern === pat.id ? null : pat.id)
                  }
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] border transition cursor-pointer ${
                    highlightedPattern === pat.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {pat.id} <span className="opacity-60">({pat.cat})</span>
                </button>
              ))}
              {highlightedPattern && (
                <button
                  onClick={() => setHighlightedPattern(null)}
                  className="px-2 py-1 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'patterns' ? (
          <PatternDocumentationView />
        ) : (
          <div className="space-y-6">
            {/* PAINEL DE EDIÇÃO DE PERSONAGENS & ESCOLHA DE MODO (EXIBIDO NO MODO SETUP) */}
            {appPhase === 'SETUP' ? (
              <div
                className={`rounded-2xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-6 ${getHighlightRing(
                  'Abstract Factory'
                )}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Settings className="w-4 h-4" /> Fase 1: Preparação & Abstract Factory
                    </span>
                    <h2 className="text-xl font-bold text-white mt-0.5">
                      Configuração da Partida e Seleção de Profissões
                    </h2>
                    <p className="text-xs text-slate-400">
                      Escolha o modo de jogo e selecione a fábrica abstrata (<code className="text-indigo-300">ILoadoutFactory</code>) de cada combatente. Ao iniciar o combate, as edições serão travadas.
                    </p>
                  </div>

                  {/* SELETOR DE MODO: PVP vs BOSS */}
                  <div className="flex rounded-xl bg-slate-950 p-1.5 border border-slate-800 shrink-0">
                    <button
                      onClick={() => {
                        setGameMode('PVE_BOSS');
                        handleApplySetupPreview(
                          'PVE_BOSS',
                          p1NameInput,
                          p1Archetype,
                          p2NameInput,
                          p2Archetype
                        );
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        gameMode === 'PVE_BOSS'
                          ? 'bg-rose-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                      Modo vs. Boss (IA)
                    </button>
                    <button
                      onClick={() => {
                        setGameMode('PVP');
                        handleApplySetupPreview(
                          'PVP',
                          p1NameInput,
                          p1Archetype,
                          p2NameInput,
                          p2Archetype
                        );
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        gameMode === 'PVP'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Modo PvP (2 Players)
                    </button>
                  </div>
                </div>

                {/* FORMULÁRIOS DE CUSTOMIZAÇÃO P1 & P2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* EDIÇÃO PLAYER 1 */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" /> Jogador 1 (Inicia no Turno 1)
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {p1.factory.factoryName}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Nome do Personagem:
                      </label>
                      <input
                        type="text"
                        value={p1NameInput}
                        onChange={(e) => {
                          setP1NameInput(e.target.value);
                          handleApplySetupPreview(
                            gameMode,
                            e.target.value,
                            p1Archetype,
                            p2NameInput,
                            p2Archetype
                          );
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Ex.: Aldric"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        Profissão / Abstract Factory (<code className="text-indigo-300">ILoadoutFactory</code>):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          {
                            arch: ArchetypeType.WARRIOR,
                            title: 'Guerreiro Real',
                            factory: 'WarriorFactory',
                            stats: 'HP 160 | ATK 35 | DEF 20',
                          },
                          {
                            arch: ArchetypeType.ALCHEMIST,
                            title: 'Alquimista',
                            factory: 'AlchemistFactory',
                            stats: 'HP 120 | ATK 45 | DEF 10',
                          },
                          {
                            arch: ArchetypeType.MERCENARY,
                            title: 'Mercenário',
                            factory: 'CyberMercenaryFactory',
                            stats: 'HP 140 | ATK 40 | DEF 15',
                          },
                        ].map((opt) => (
                          <button
                            key={opt.arch}
                            type="button"
                            onClick={() => {
                              setP1Archetype(opt.arch);
                              handleApplySetupPreview(
                                gameMode,
                                p1NameInput,
                                opt.arch,
                                p2NameInput,
                                p2Archetype
                              );
                            }}
                            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                              p1Archetype === opt.arch
                                ? 'bg-indigo-600/20 border-indigo-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold text-white">{opt.title}</div>
                            <div className="text-[10px] font-mono text-indigo-300">{opt.factory}</div>
                            <div className="text-[10px] text-slate-400 mt-1">{opt.stats}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* EDIÇÃO PLAYER 2 OU CARD DO BOSS PRÉ-PRONTO */}
                  {gameMode === 'PVE_BOSS' ? (
                    <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                            <Bot className="w-4 h-4" /> Oponente Controlado pela IA (Boss)
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            BossOverlordFactory
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white">Overlord Malakor (Boss)</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Personagem pré-construído via <code className="text-rose-300">BossOverlordFactory</code>. No turno dele, toma decisões autônomas avaliando seu HP, empilhando Decorators, lançando Bombas Concussivas ou recuperando o fôlego caso seja atordoado.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 font-mono text-xs">
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">HP MÁXIMO</span>
                          <strong className="text-emerald-400">220 HP</strong>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">ARMA (ATK 48)</span>
                          <strong className="text-rose-400 truncate block">Martelo Abissal</strong>
                        </div>
                        <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">ARMADURA (DEF 22)</span>
                          <strong className="text-sky-400 truncate block">Obsidiana Viva</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> Jogador 2 (Age nos Turnos Pares)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {p2.factory.factoryName}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">
                          Nome do Personagem 2:
                        </label>
                        <input
                          type="text"
                          value={p2NameInput}
                          onChange={(e) => {
                            setP2NameInput(e.target.value);
                            handleApplySetupPreview(
                              gameMode,
                              p1NameInput,
                              p1Archetype,
                              e.target.value,
                              p2Archetype
                            );
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Ex.: Vex"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-2">
                          Profissão / Abstract Factory (<code className="text-emerald-300">ILoadoutFactory</code>):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            {
                              arch: ArchetypeType.WARRIOR,
                              title: 'Guerreiro Real',
                              factory: 'WarriorFactory',
                              stats: 'HP 160 | ATK 35 | DEF 20',
                            },
                            {
                              arch: ArchetypeType.ALCHEMIST,
                              title: 'Alquimista',
                              factory: 'AlchemistFactory',
                              stats: 'HP 120 | ATK 45 | DEF 10',
                            },
                            {
                              arch: ArchetypeType.MERCENARY,
                              title: 'Mercenário',
                              factory: 'CyberMercenaryFactory',
                              stats: 'HP 140 | ATK 40 | DEF 15',
                            },
                          ].map((opt) => (
                            <button
                              key={opt.arch}
                              type="button"
                              onClick={() => {
                                setP2Archetype(opt.arch);
                                handleApplySetupPreview(
                                  gameMode,
                                  p1NameInput,
                                  p1Archetype,
                                  p2NameInput,
                                  opt.arch
                                );
                              }}
                              className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                                p2Archetype === opt.arch
                                  ? 'bg-emerald-600/20 border-emerald-500 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <div className="text-xs font-bold text-white">{opt.title}</div>
                              <div className="text-[10px] font-mono text-emerald-300">
                                {opt.factory}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">{opt.stats}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleStartBattle}
                    className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Swords className="w-5 h-5" />
                    Travar Edição e Iniciar Combate em Turnos
                  </button>
                </div>
              </div>
            ) : (
              /* BANNER DE STATUS DE TURNO (EXIBIDO NO MODO DE BATALHA) */
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 font-mono text-sm font-bold text-indigo-300">
                    TURNO #{arena.turnNumber}
                  </div>
                  {winner ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      Vitória de {winner.name}! Fim de Combate.
                    </div>
                  ) : isBossThinking ? (
                    <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm animate-pulse">
                      <Bot className="w-5 h-5" />
                      Turno do Boss: {p2.name} está calculando sua ação...
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Vez de jogar:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                          arena.activeTurn === 'P1'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {arena.activeTurn === 'P1' ? p1.name : p2.name} ({arena.activeTurn})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Factories travadas durante o combate</span>
                </div>
              </div>
            )}

            {/* GRID PRINCIPAL DA ARENA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* COLUNA ESQUERDA + CENTRAL: COMBATENTES E LOGS (8 Colunas) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FighterCard
                    character={p1}
                    opponent={p2}
                    accentColor="indigo"
                    appPhase={appPhase}
                    isCurrentTurn={appPhase === 'BATTLE' && arena.activeTurn === 'P1' && !winner}
                    isAIControlled={false}
                    isAutoRunning={isAutoRunning || isBossThinking}
                    highlightedPattern={highlightedPattern}
                    onExecuteCommand={executeCommand}
                  />

                  <FighterCard
                    character={p2}
                    opponent={p1}
                    accentColor={gameMode === 'PVE_BOSS' ? 'rose' : 'emerald'}
                    appPhase={appPhase}
                    isCurrentTurn={appPhase === 'BATTLE' && arena.activeTurn === 'P2' && !winner}
                    isAIControlled={gameMode === 'PVE_BOSS'}
                    isAutoRunning={isAutoRunning || isBossThinking}
                    highlightedPattern={highlightedPattern}
                    onExecuteCommand={executeCommand}
                  />
                </div>

                {/* TERMINAL DE LOGS EM TEMPO REAL (OBSERVER 1) */}
                <div
                  className={`rounded-xl bg-slate-900 border border-slate-800 overflow-hidden ${getHighlightRing(
                    'Observer'
                  )}`}
                >
                  <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        DOMCombatLogObserver — Event Stream Imutável
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Observer Pattern • Object.freeze(payload)
                    </span>
                  </div>

                  <div className="p-4 h-72 overflow-y-auto font-mono text-xs space-y-2 bg-slate-950/60">
                    {logs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        Nenhum evento registrado. Inicie o combate para observar as notificações.
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                              <EventBadge type={log.type} />
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {log.patternTag}
                              </span>
                              <span className="text-slate-300 font-semibold">
                                {log.sourceName}{' '}
                                <ChevronRight className="inline w-3 h-3 text-slate-500" />{' '}
                                {log.targetName}
                              </span>
                            </div>
                            <p className="text-slate-300 leading-relaxed pl-1">{log.details}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-[11px] px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">
                              HP Alvo: <strong className="text-white">{log.currentHp}</strong>
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA: AUDITORIA DE MÉTRICAS E PILHA DE COMANDOS (4 Colunas) */}
              <div className="lg:col-span-4 space-y-6">
                {/* OBSERVER 2: METRICS AUDITOR DASHBOARD */}
                <div
                  className={`rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4 ${getHighlightRing(
                    'Observer'
                  )}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        MetricsAuditorObserver
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Observer #2
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Eventos Auditados</span>
                      <span className="text-xl font-bold font-mono text-white">
                        {metrics.totalEvents}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Dano Total Causado</span>
                      <span className="text-xl font-bold font-mono text-rose-400">
                        {metrics.totalDamage}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Bloqueios (State)</span>
                      <span className="text-xl font-bold font-mono text-amber-400">
                        {metrics.blockedActions}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                      <span className="text-[11px] text-slate-400 block">Rollbacks (Undo)</span>
                      <span className="text-xl font-bold font-mono text-sky-400">
                        {metrics.rollbacksExecuted}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Integridade Ativa: Payloads congelados via{' '}
                      <code className="text-slate-200">Readonly&lt;T&gt;</code> e validação estrita de turno.
                    </span>
                  </div>
                </div>

                {/* COMMAND PATTERN: PILHA DE HISTÓRICO & SNAPSHOT ROLLBACK */}
                <div
                  className={`rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col h-[460px] ${getHighlightRing(
                    'Command'
                  )}`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Histórico de Turnos (Command)
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Command Pattern
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-3">
                    Cada turno executado armazena o comando e um{' '}
                    <code className="text-amber-300">CharacterSnapshot</code> completo (incluindo o dono do turno) para reversão atômica:
                  </p>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
                    {turnHistory.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                        <Layers className="w-6 h-6 mb-2 opacity-40" />
                        <span>Nenhum turno executado ainda.</span>
                        <span className="text-[11px] mt-1">
                          Nota: Ações bloqueadas por <code className="text-rose-400">StunnedState</code> retornam{' '}
                          <code>false</code>, não passam o turno e não entram na pilha.
                        </span>
                      </div>
                    ) : (
                      [...turnHistory].reverse().map((record, idx) => {
                        const isTop = idx === 0;
                        const cmd = record.command;
                        return (
                          <div
                            key={cmd.id}
                            className={`p-3 rounded-lg border ${
                              isTop
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-100'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                              <span className="font-bold text-amber-400">
                                Turno #{record.previousTurnNumber} ({record.previousTurnOwner}){' '}
                                {isTop && '• Topo'}
                              </span>
                              <span>{cmd.timestamp}</span>
                            </div>
                            <div className="font-semibold text-xs text-white">{cmd.label}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {cmd.actor.name} → {cmd.target.name}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={handleUndo}
                    disabled={
                      appPhase !== 'BATTLE' ||
                      turnHistory.length === 0 ||
                      isAutoRunning ||
                      isBossThinking
                    }
                    className="mt-4 w-full py-2.5 px-4 rounded-lg font-semibold text-xs bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Desfazer Última Jogada (command.undo)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 9. SUBCOMPONENTE: CARD DO COMBATENTE
// ============================================================================

interface FighterCardProps {
  character: Character;
  opponent: Character;
  accentColor: 'indigo' | 'emerald' | 'rose';
  appPhase: AppPhase;
  isCurrentTurn: boolean;
  isAIControlled: boolean;
  isAutoRunning: boolean;
  highlightedPattern: string | null;
  onExecuteCommand: (cmd: ICommand) => void;
}

function FighterCard({
  character,
  opponent,
  accentColor,
  appPhase,
  isCurrentTurn,
  isAIControlled,
  isAutoRunning,
  highlightedPattern,
  onExecuteCommand,
}: FighterCardProps) {
  const hpPercent = Math.round((character.hp / character.maxHp) * 100);
  const canAct = character.state.canAct();
  const isStunned = character.state.id === StateIdentifier.STUNNED;
  const weapon = character.stats.getWeapon();
  const armor = character.stats.getArmor();
  const decoratorChain = character.stats.getDecoratorChain();

  const ringClass = (pat: string) =>
    highlightedPattern === pat
      ? 'ring-2 ring-amber-400 bg-amber-500/5 transition-all'
      : 'transition-all';

  const activeTurnBorder = isCurrentTurn
    ? accentColor === 'indigo'
      ? 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-indigo-500/10'
      : accentColor === 'rose'
      ? 'border-rose-400 ring-2 ring-rose-500/40 shadow-rose-500/10'
      : 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-emerald-500/10'
    : 'border-slate-800 opacity-90';

  const canPlayerClickActions =
    appPhase === 'BATTLE' && isCurrentTurn && !isAIControlled && !isAutoRunning;

  return (
    <div
      className={`rounded-xl bg-slate-900 border ${activeTurnBorder} shadow-xl flex flex-col justify-between overflow-hidden transition-all duration-300`}
    >
      {/* CABEÇALHO DO PERSONAGEM + INDICADOR DE TURNO */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                {character.id}
              </span>
              <h3 className="text-base font-bold text-white">{character.name}</h3>
            </div>
            <div className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 p-1 rounded ${ringClass('Abstract Factory')}`}>
              <Box className="w-3.5 h-3.5 text-indigo-400" />
              <span>{character.factory.professionTitle}</span>
              <span className="text-slate-600">•</span>
              <strong className="text-slate-200">{character.factory.factoryName}</strong>
            </div>
          </div>

          {/* BADGE DE VEZ DO TURNO */}
          <div>
            {appPhase === 'SETUP' ? (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                Em Preparação
              </span>
            ) : isCurrentTurn ? (
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 animate-pulse">
                <Swords className="w-3 h-3" /> SEU TURNO
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900 text-slate-500 border border-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Aguardando Vez
              </span>
            )}
          </div>
        </div>

        {/* BARRA DE HP */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">INTEGRIDADE (HP)</span>
            <span className="font-bold text-white">
              {character.hp} / {character.maxHp} ({hpPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50
                  ? 'bg-emerald-500'
                  : hpPercent > 25
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* CORPO DO CARD: STATE E DECORATOR STACK */}
      <div className="p-4 space-y-4 flex-1">
        {/* STATE PATTERN */}
        <div
          className={`p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-2 ${ringClass(
            'State'
          )}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> State Pattern Atual
            </span>
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${character.state.badgeColor}`}
            >
              {character.state.name}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">{character.state.ruleDescription}</p>
        </div>

        {/* DECORATOR PATTERN + ITENS DA FACTORY */}
        <div
          className={`p-3 rounded-lg bg-slate-950 border border-slate-800/90 space-y-3 ${ringClass(
            'Decorator'
          )}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" /> Decorator Stack & Atributos
            </span>
            <span className="text-[10px] font-mono text-purple-300">
              {decoratorChain.length - 1} Buff(s) Ativos
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Sword className="w-3.5 h-3.5 text-rose-400" /> ATAQUE
                </span>
                <span className="text-[10px] font-mono">Base: {weapon.baseDamage}</span>
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {character.stats.getAttack()}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={weapon.name}>
                {weapon.name}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-sky-400" /> DEFESA
                </span>
                <span className="text-[10px] font-mono">Base: {armor.baseDefense}</span>
              </div>
              <div className="text-lg font-bold font-mono text-white">
                {character.stats.getDefense()}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5" title={armor.name}>
                {armor.name}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 block">
              Cadeia de Envelopamento (Decorator Wrapping):
            </span>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-purple-300 break-all">
              {character.stats.getFormulaChain()}
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ DO CARD: AÇÕES DO TURNO (COMMAND PATTERN) */}
      <div
        className={`p-4 bg-slate-950 border-t border-slate-800 space-y-2.5 ${ringClass('Command')}`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Comandos de Turno (Consomem a Vez)
          </span>
          {appPhase === 'SETUP' && (
            <span className="text-[11px] font-mono text-amber-400">
              Inicie a batalha para habilitar ações
            </span>
          )}
          {appPhase === 'BATTLE' && isAIControlled && (
            <span className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> Controlado pela IA no turno do Boss
            </span>
          )}
        </div>

        {/* ALERTA E BOTÃO DE RECUPERAÇÃO QUANDO ESTUNADO */}
        {isStunned && (
          <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/50 space-y-2">
            <div className="text-[11px] text-rose-200 flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Personagem Atordoado! Ataques são bloqueados pelo{' '}
                <code className="text-rose-300">StunnedState</code>. Para sair deste estado, cumpra o turno recuperando o fôlego:
              </span>
            </div>
            <button
              onClick={() => onExecuteCommand(new PassAndRecoverCommand(character))}
              disabled={!canPlayerClickActions}
              className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recuperar Fôlego / Passar Turno (Remove Stun)
            </button>
          </div>
        )}

        {/* ATAQUES PRINCIPAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => onExecuteCommand(new AttackCommand(character, opponent))}
            disabled={!canPlayerClickActions}
            className={`py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              canAct
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500'
                : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-700/60'
            }`}
          >
            {canAct ? <Sword className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
            {canAct ? `Atacar ${opponent.name.split(' ')[0]}` : 'Tentar Atacar (Bloqueado)'}
          </button>

          <button
            onClick={() => onExecuteCommand(new ConcussiveBombCommand(character, opponent))}
            disabled={!canPlayerClickActions}
            className={`py-2.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              canAct
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                : 'bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border-rose-700/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            Bomba Concussiva (Stun 1t)
          </button>
        </div>

        {/* HABILIDADES TÁTICAS DE TURNO (DECORATORS E VOO) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() =>
              onExecuteCommand(
                new ApplyDecoratorCommand(
                  character,
                  'BerserkDecorator',
                  (s) => new BerserkDecorator(s)
                )
              )
            }
            disabled={!canPlayerClickActions}
            className="py-1.5 px-2 rounded text-[11px] font-medium bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 text-rose-300 border border-rose-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
            title="Aumenta Ataque em 50% e reduz Defesa em 10"
          >
            <Flame className="w-3 h-3" /> +Berserk
          </button>

          <button
            onClick={() =>
              onExecuteCommand(
                new ApplyDecoratorCommand(
                  character,
                  'ShieldedDecorator',
                  (s) => new ShieldedDecorator(s)
                )
              )
            }
            disabled={!canPlayerClickActions}
            className="py-1.5 px-2 rounded text-[11px] font-medium bg-sky-500/15 hover:bg-sky-500/25 disabled:opacity-40 text-sky-300 border border-sky-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
            title="Adiciona +25 de Defesa"
          >
            <Shield className="w-3 h-3" /> +Escudo
          </button>

          <button
            onClick={() =>
              onExecuteCommand(
                new ApplyDecoratorCommand(
                  character,
                  'VenomCoatingDecorator',
                  (s) => new VenomCoatingDecorator(s)
                )
              )
            }
            disabled={!canPlayerClickActions}
            className="py-1.5 px-2 rounded text-[11px] font-medium bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
            title="Adiciona +15 de Ataque Químico"
          >
            <Skull className="w-3 h-3" /> +Veneno
          </button>

          <button
            onClick={() => onExecuteCommand(new EnterFlyingStateCommand(character))}
            disabled={!canPlayerClickActions || character.state.id === StateIdentifier.FLYING}
            className="py-1.5 px-2 rounded text-[11px] font-medium bg-indigo-500/15 hover:bg-indigo-500/25 disabled:opacity-40 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-1 cursor-pointer"
            title="Entra em FlyingState por 2 turnos (50% evasão)"
          >
            <Feather className="w-3 h-3" /> Voar (2t)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 10. SUBCOMPONENTE: BADGES DE EVENTOS DO TERMINAL
// ============================================================================

function EventBadge({ type }: { type: CombatEventType }) {
  switch (type) {
    case CombatEventType.DAMAGE_TAKEN:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          DAMAGE_TAKEN
        </span>
      );
    case CombatEventType.BUFF_APPLIED:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          BUFF_APPLIED
        </span>
      );
    case CombatEventType.STATE_CHANGED:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
          STATE_CHANGED
        </span>
      );
    case CombatEventType.ACTION_BLOCKED:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          ACTION_BLOCKED
        </span>
      );
    case CombatEventType.UNDO_EXECUTED:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          UNDO_EXECUTED
        </span>
      );
    case CombatEventType.LOADOUT_CHANGED:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          LOADOUT_CHANGED
        </span>
      );
    case CombatEventType.TURN_PASSED:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
          TURN_PASSED
        </span>
      );
  }
}

// ============================================================================
// 11. SUBCOMPONENTE: ABA DE DOCUMENTAÇÃO ACADÊMICA (README MAPEADO)
// ============================================================================

function PatternDocumentationView() {
  const patterns = [
    {
      name: '1. Abstract Factory',
      category: 'Criacional',
      where:
        'Interface ILoadoutFactory e classes WarriorFactory, AlchemistFactory, CyberMercenaryFactory e BossOverlordFactory.',
      justification:
        'Utilizado no Modo de Edição de Personagem para instanciar famílias completas e coerentes de equipamentos (Arma + Armadura + HP base da profissão) sem acoplar a classe Character às implementações concretas dos itens.',
    },
    {
      name: '2. Decorator',
      category: 'Estrutural',
      where:
        'Interface ICombatStats, classe BaseStats, classe abstrata StatsDecorator e decoradores BerserkDecorator, ShieldedDecorator e VenomCoatingDecorator.',
      justification:
        'Permite empilhar buffs de ataque e defesa dinamicamente durante os turnos da partida envolvendo o objeto de atributos em memória sem usar herança estática.',
    },
    {
      name: '3. State',
      category: 'Comportamental',
      where:
        'Classe abstrata CombatState e estados concretos NormalState, StunnedState (duração de 1 turno) e FlyingState (duração de 2 turnos).',
      justification:
        'Gerencia tanto as permissões de ação (canAct()) quanto o próprio ciclo de vida de expiração (onTurnEnd()). Quando em StunnedState, ataques são bloqueados e o jogador consome seu turno para decrementar o contador e retornar automaticamente ao NormalState.',
    },
    {
      name: '4. Command',
      category: 'Comportamental',
      where:
        'Interface ICommand, classe abstrata BaseTurnCommand, comandos AttackCommand, ConcussiveBombCommand, ApplyDecoratorCommand, EnterFlyingStateCommand, PassAndRecoverCommand e o Invoker BattleArena.',
      justification:
        'Cada turno válido é encapsulado em um objeto de comando que registra snapshots imutáveis de ambos os combatentes e de quem era a vez de jogar, permitindo reverter turnos inteiros via undo().',
    },
    {
      name: '5. Observer',
      category: 'Comportamental',
      where:
        'Interfaces genéricas ISubject<ImmutableEvent> e IObserver<ImmutableEvent>, implementadas por Character, DOMCombatLogObserver e MetricsAuditorObserver.',
      justification:
        'Notifica em tempo real tanto o feed de eventos da interface quanto o painel auditor de métricas sempre que danos, bloqueios de estado, trocas de fábrica ou rollbacks acontecem.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-lg font-bold text-white">
          Mapeamento Fundamentado dos 5 Padrões de Projeto (Requisito README.md)
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Esta documentação reflete diretamente as classes em execução nesta interface web. O código
          aplica recursos avançados de TypeScript (<code className="text-indigo-300">enum</code>,{' '}
          <code className="text-indigo-300">interface</code>,{' '}
          <code className="text-indigo-300">abstract class</code>,{' '}
          <code className="text-indigo-300">Generics &lt;T&gt;</code>,{' '}
          <code className="text-indigo-300">Readonly&lt;T&gt;</code> e{' '}
          <code className="text-indigo-300">override</code>) aliados a práticas de integridade de
          dados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((p) => (
          <div
            key={p.name}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{p.name}</h3>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {p.category}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              <strong className="text-slate-200">Onde foi aplicado:</strong> {p.where}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-slate-200">Justificativa Arquitetural:</strong>{' '}
              {p.justification}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}