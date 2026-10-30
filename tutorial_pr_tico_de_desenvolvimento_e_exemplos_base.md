# Guia Prático de Desenvolvimento — Motor de Combate RPG (Passo a Passo)

Este guia segue exatamente o mesmo mapeamento do arquivo `ARQUITETURA_DO_SISTEMA.md`, funcionando como um roteiro de construção para você programar cada camada na unha, aplicando boas práticas de Engenharia de Software, TypeScript avançado e Cibersegurança (CIA Triad).

---

## Boas Práticas Obrigatórias no Projeto

1. **Zero `any` e `strict: true`:** Ative todas as flags estritas no `tsconfig.json` (`strict`, `noImplicitOverride`, `noImplicitReturns`).
2. **Encapsulamento Real (Confidencialidade):** Nunca deixe propriedades como `hp`, `state` ou `history` como `public` mutáveis. Use campos privados (`#hp` ou `private hp`) e exponha apenas leituras seguras.
3. **Imutabilidade Defensiva (Integridade):** Qualquer objeto enviado para fora da classe (eventos para Observers ou Snapshots para Commands) deve usar `Readonly<T>` na assinatura e `Object.freeze()` no retorno em *runtime*.
4. **Sanitização e Limites Matemáticos (Integridade & Disponibilidade):**
   * Dano e defesa nunca podem gerar números negativos inesperados (*underflow*). Use sempre `Math.max(0, valor)`.
   * O HP restaurado ou curado nunca pode ultrapassar `maxHp` (*overflow*). Use `Math.min(this.#maxHp, Math.max(0, novoHp))`.
   * Listas de logs devem ter teto máximo em memória (ex.: `.slice(0, 100)`) para evitar exaustão de memória (DoS local).

---

## Módulo 1: Tipagem Forte e Contratos Imutáveis (`src/types/combat.types.ts`)

### O que você deve construir:
1. Crie um `enum CombatEventType` com todos os tipos de eventos do sistema (`DAMAGE_TAKEN`, `STATE_CHANGED`, `BUFF_APPLIED`, `ACTION_BLOCKED`, `UNDO_EXECUTED`, `LOADOUT_CHANGED`, `TURN_PASSED`).
2. Crie os tipos literais `TurnOwner = 'P1' | 'P2'`, `GameMode = 'PVP' | 'PVE_BOSS'` e `AppPhase = 'SETUP' | 'BATTLE'`.
3. Defina a interface `CombatEventPayload` e exporte um tipo utilitário `ImmutableEvent = Readonly<CombatEventPayload>`.

### Exemplo Base de Referência:
```typescript
export enum CombatEventType {
  DAMAGE_TAKEN = 'DAMAGE_TAKEN',
  STATE_CHANGED = 'STATE_CHANGED',
  ACTION_BLOCKED = 'ACTION_BLOCKED',
  // Complete com os demais eventos...
}

export type TurnOwner = 'P1' | 'P2';

export interface CombatEventPayload {
  readonly id: string;
  readonly timestamp: string;
  readonly type: CombatEventType;
  readonly sourceName: string;
  readonly targetName: string;
  readonly details: string;
  readonly currentHp: number;
}

// Garante em tempo de compilação que nenhum Observer altere o evento recebido
export type ImmutableEvent = Readonly<CombatEventPayload>;
```

---

## Módulo 2: Telemetria e Auditoria Desacoplada (`src/patterns/observer/`)

### O que você deve construir:
1. Crie as interfaces genéricas `IObserver<T>` (com método `update(event: T): void`) e `ISubject<T>` (`attach`, `detach`, `notify`).
2. Implemente `CombatLogObserver` mantendo um array privado de eventos com limite de tamanho.
3. Implemente `MetricsAuditorObserver` que acumula total de eventos, dano total causado, ações bloqueadas por estado e total de *rollbacks*.

### Exemplo Base de Referência:
```typescript
import { ImmutableEvent, CombatEventType } from '../../types/combat.types';

export interface IObserver<T> {
  update(event: T): void;
}

export interface ISubject<T> {
  attach(observer: IObserver<T>): void;
  detach(observer: IObserver<T>): void;
  notify(event: T): void;
}

export class MetricsAuditorObserver implements IObserver<ImmutableEvent> {
  #totalDamage = 0;
  #blockedCount = 0;

  public update(event: ImmutableEvent): void {
    if (event.type === CombatEventType.ACTION_BLOCKED) {
      this.#blockedCount += 1;
    }
    // Dica: extraia ou adicione um campo opcional damageDealt no payload para somar com precisão
  }

  public getSnapshot() {
    return Object.freeze({
      totalDamage: this.#totalDamage,
      blockedCount: this.#blockedCount,
    });
  }
}
```

---

## Módulo 3: Criação de Profissões e Modo de Edição (`src/patterns/abstract-factory/`)

### O que você deve construir:
1. Defina as interfaces de produto `IWeapon` (`name`, `baseDamage`) e `IArmor` (`name`, `baseDefense`).
2. Defina a fábrica abstrata `ILoadoutFactory` contendo metadados da profissão (`factoryName`, `professionTitle`, `recommendedMaxHp`) e os métodos de criação `createWeapon(): IWeapon` e `createArmor(): IArmor`.
3. Implemente as fábricas concretas: `WarriorFactory`, `AlchemistFactory`, `CyberMercenaryFactory` e `BossOverlordFactory`.

### Exemplo Base de Referência:
```typescript
export interface IWeapon {
  readonly name: string;
  readonly baseDamage: number;
}

export interface IArmor {
  readonly name: string;
  readonly baseDefense: number;
}

export interface ILoadoutFactory {
  readonly factoryName: string;
  readonly professionTitle: string;
  readonly recommendedMaxHp: number;
  createWeapon(): IWeapon;
  createArmor(): IArmor;
}

export class WarriorFactory implements ILoadoutFactory {
  public readonly factoryName = 'WarriorFactory';
  public readonly professionTitle = 'Guerreiro Real';
  public readonly recommendedMaxHp = 160;

  public createWeapon(): IWeapon {
    return Object.freeze({ name: 'Espada Bastarda', baseDamage: 35 });
  }

  public createArmor(): IArmor {
    return Object.freeze({ name: 'Armadura de Placas', baseDefense: 20 });
  }
}
// Exercício: Implemente AlchemistFactory, CyberMercenaryFactory e BossOverlordFactory
```

---

## Módulo 4: Empilhamento Dinâmico de Buffs (`src/patterns/decorator/`)

### O que você deve construir:
1. Crie a interface `ICombatStats` com `getAttack(): number`, `getDefense(): number` e `getFormulaChain(): string`.
2. Crie a classe concreta `BaseStats` que recebe uma `ILoadoutFactory` no construtor e guarda a arma e armadura iniciais.
3. Crie a classe abstrata `StatsDecorator` que implementa `ICombatStats` e recebe `protected readonly wrapped: ICombatStats`.
4. Crie os decoradores concretos usando a palavra-chave `override` do TypeScript:
   * `BerserkDecorator`: multiplica o ataque por `1.5` (`Math.round`) e reduz a defesa em `10` (usando `Math.max(0, ...)` para impedir defesa negativa).
   * `ShieldedDecorator`: soma `+25` na defesa.
   * `VenomCoatingDecorator`: soma `+15` no ataque.

### Exemplo Base de Referência:
```typescript
export interface ICombatStats {
  getAttack(): number;
  getDefense(): number;
  getFormulaChain(): string;
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

  public getFormulaChain(): string {
    return this.wrapped.getFormulaChain();
  }
}

export class BerserkDecorator extends StatsDecorator {
  public override getAttack(): number {
    return Math.round(super.getAttack() * 1.5);
  }

  public override getDefense(): number {
    // Prática de Integridade: nunca permitir underflow abaixo de zero
    return Math.max(0, super.getDefense() - 10);
  }

  public override getFormulaChain(): string {
    return `Berserk(${super.getFormulaChain()})`;
  }
}
```

---

## Módulo 5: Condições de Status e Expiração por Turno (`src/patterns/state/`)

### O que você deve construir:
1. Crie a classe abstrata `CombatState` com:
   * `canAct(): boolean` (padrão `true`)
   * `modifyIncomingDamage(rawDamage: number): number` (padrão retorna `rawDamage`)
   * `onTurnEnd(character: Character): void` (hook chamado sempre que o personagem conclui seu turno)
   * `abstract clone(): CombatState` (essencial para que o Snapshot do Command copie o contador exato de turnos restantes sem compartilhar referência mutável!).
2. Implemente `NormalState`, `StunnedState` e `FlyingState`.
3. **Atenção ao `StunnedState`:** Ele deve receber `turnsLeft = 1` no construtor, retornar `false` em `canAct()`, aumentar o dano recebido em 25% (`Math.round(rawDamage * 1.25)`) e, dentro de `onTurnEnd(character)`, decrementar `this.#turnsLeft`. Se chegar a `0`, ele mesmo chama `character.changeState(new NormalState())`.

### Exemplo Base de Referência:
```typescript
import type { Character } from '../../core/Character';

export abstract class CombatState {
  public abstract readonly name: string;

  public canAct(): boolean {
    return true;
  }

  public modifyIncomingDamage(rawDamage: number): number {
    return rawDamage;
  }

  public onTurnEnd(_character: Character): void {}

  public abstract clone(): CombatState;
}

export class StunnedState extends CombatState {
  #turnsLeft: number;

  constructor(turns: number = 1) {
    super();
    this.#turnsLeft = Math.max(1, turns);
  }

  public get name(): string {
    return `Stunned (${this.#turnsLeft}t)`;
  }

  public override canAct(): boolean {
    return false;
  }

  public override modifyIncomingDamage(rawDamage: number): number {
    return Math.round(rawDamage * 1.25);
  }

  public override onTurnEnd(character: Character): void {
    this.#turnsLeft -= 1;
    if (this.#turnsLeft <= 0) {
      // Auto-transição controlada pelo próprio Estado!
      character.changeState(new NormalState(), 'Recuperação Automática');
    }
  }

  public override clone(): CombatState {
    return new StunnedState(this.#turnsLeft);
  }
}
```

---

## Módulo 6: Execução em Turnos e Rollback Transacional (`src/patterns/command/` + `src/core/`)

### O que você deve construir:
1. Na classe `Character`:
   * Crie `createSnapshot(): Readonly<CharacterSnapshot>` que congela o `hp`, `stats` e um `.clone()` do `state` atual.
   * Crie `restoreSnapshot(snapshot: Readonly<CharacterSnapshot>): void` para reverter o personagem com segurança.
2. Crie a classe abstrata `BaseTurnCommand` implementando `ICommand` (`execute(): boolean` e `undo(): void`).
   * Antes de alterar qualquer dado no `execute()`, chame `this.captureSnapshots()` para salvar o estado tanto do `actor` quanto do `target`.
3. Implemente os comandos:
   * `AttackCommand`: verifica `actor.state.canAct()`. Se `false`, emite evento `ACTION_BLOCKED` e retorna `false`. Se `true`, captura snapshot, causa dano no `target`, chama `actor.processTurnEndLifecycle()` e retorna `true`.
   * `PassAndRecoverCommand`: **não** exige `canAct() === true` (pois serve justamente para quem está estunado cumprir seu turno). Captura snapshot, emite evento `TURN_PASSED` e chama `actor.processTurnEndLifecycle()`, fazendo o `StunnedState` expirar.
4. Na classe `BattleArena` (Invoker):
   * Controle `#activeTurnOwner: TurnOwner = 'P1'` e `#turnCounter = 1`.
   * Em `dispatchTurnCommand(cmd)`: valide se `cmd.actor.id === this.#activeTurnOwner`. Só avance o turno (`P1 <-> P2`) e só adicione na pilha `#history` se `cmd.execute()` retornar `true`.

### Exemplo Base de Referência:
```typescript
export interface TurnHistoryRecord {
  readonly command: ICommand;
  readonly previousTurnOwner: TurnOwner;
  readonly previousTurnNumber: number;
}

export class BattleArena {
  #history: TurnHistoryRecord[] = [];
  #activeTurnOwner: TurnOwner = 'P1';
  #turnCounter = 1;

  public dispatchTurnCommand(command: ICommand): boolean {
    // Integridade: impede que um jogador execute comandos fora do seu turno
    if (command.actor.id !== this.#activeTurnOwner) {
      return false;
    }

    const prevOwner = this.#activeTurnOwner;
    const prevTurn = this.#turnCounter;

    const executed = command.execute();
    if (executed) {
      this.#history.push(
        Object.freeze({
          command,
          previousTurnOwner: prevOwner,
          previousTurnNumber: prevTurn,
        })
      );
      this.#activeTurnOwner = this.#activeTurnOwner === 'P1' ? 'P2' : 'P1';
      this.#turnCounter += 1;
    }

    return executed;
  }

  public undoLastTurn(): void {
    const last = this.#history.pop();
    if (!last) return;

    last.command.undo();
    this.#activeTurnOwner = last.previousTurnOwner;
    this.#turnCounter = last.previousTurnNumber;
  }
}
```

---

## Módulo 7: Modos de Jogo PvP e PvE Boss (`src/core/BossAIController.ts` + `src/ui/`)

### O que você deve construir:
1. **Gerenciamento de Fase na UI (`AppPhase = 'SETUP' | 'BATTLE'`):**
   * Enquanto `appPhase === 'SETUP'`, renderize os seletores de profissão (`WarriorFactory`, `AlchemistFactory`, `CyberMercenaryFactory`) e o seletor de modo (`PVP` vs `PVE_BOSS`).
   * Quando o usuário clicar em **"Iniciar Combate"**, mude `appPhase` para `'BATTLE'` e desabilite/oculte qualquer edição de fábrica.
2. **Motor de Decisão do Boss (`BossAIController`):**
   * Quando `gameMode === 'PVE_BOSS'` e o turno atual for `'P2'`, dispare um `setTimeout` de ~800ms para simular o tempo de reação do Boss.
   * **Regra #1 (Sair do Stun):** Se `!boss.state.canAct()`, o Boss deve instanciar e despachar `new PassAndRecoverCommand(boss)`.
   * **Regra #2 (Ação Tática):** Caso possa agir, avalie o HP e os estados para escolher entre aplicar um Decorator (`ShieldedDecorator` / `BerserkDecorator`), atordoar o jogador (`ConcussiveBombCommand`) ou causar dano direto (`AttackCommand`).

### Checklist Final para Validação da Entrega
- [ ] Todos os 5 padrões estão separados em suas respectivas pastas dentro de `src/patterns/`.
- [ ] O projeto compila sem erros com `tsc --noEmit` usando `strict: true`.
- [ ] Bloquear uma ação com `StunnedState` registra log no `Observer`, mas **não** avança o turno nem suja a pilha do `Command`.
- [ ] Usar `PassAndRecoverCommand` consome o turno do personagem atordoado e faz o próprio `StunnedState` transicionar para `NormalState`.
- [ ] O botão `Undo` restaura com exatidão o HP, a cadeia de Decorators, o State (com seus turnos restantes) e devolve a vez ao jogador anterior.