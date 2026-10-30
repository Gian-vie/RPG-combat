# Arquitetura do Sistema — Motor de Combate RPG Turn-Based

## 1. Visão Geral e Objetivo Arquitetural
O sistema consiste em um motor de combate em turnos (Web/CLI) em TypeScript estrito, projetado para desacoplar a criação de personagens, o cálculo dinâmico de atributos, as máquinas de estados de condições de combate, o controle transacional de turnos e a camada de telemetria/interface gráfica.

A arquitetura adota os três pilares de segurança desde a modelagem de domínio:
* **Integridade:** Imutabilidade de eventos e *snapshots* (`Object.freeze` + `Readonly<T>`), prevenção contra *underflow/overflow* matemático em cálculos de dano/defesa e validação estrita de propriedade de turno.
* **Confidencialidade:** Encapsulamento real de estado interno utilizando campos privados nativos (`#`) ou visibilidade restrita, expondo apenas *getters* ou cópias congeladas para a camada de UI.
* **Disponibilidade:** Limitação de tamanho de filas em memória (*ring buffer* no histórico de logs), prevenção de loops infinitos em transições de estado e tratamento seguro de pilhas vazias no *rollback*.

---

## 2. Estrutura de Diretórios (Modularizada)

```text
rpg-combat-engine/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── types/
    │   └── combat.types.ts              # Enums, Utility Types (Readonly) e contratos de Eventos
    ├── patterns/
    │   ├── observer/                    # [Padrão 1 - Comportamental]
    │   │   ├── IObserver.ts             # Contratos genéricos IObserver<T> e ISubject<T>
    │   │   ├── CombatLogObserver.ts     # Ouvinte de eventos para histórico visual
    │   │   └── MetricsAuditorObserver.ts# Ouvinte de auditoria e somatório de estatísticas
    │   ├── abstract-factory/            # [Padrão 2 - Criacional]
    │   │   ├── ILoadoutFactory.ts       # Contratos IWeapon, IArmor e ILoadoutFactory
    │   │   ├── WarriorFactory.ts        # Kit físico pesado (Guerreiro)
    │   │   ├── AlchemistFactory.ts      # Kit químico tático (Alquimista)
    │   │   ├── CyberMercenaryFactory.ts # Kit híbrido (Mercenário)
    │   │   └── BossOverlordFactory.ts   # Kit exclusivo da IA (Boss)
    │   ├── decorator/                   # [Padrão 3 - Estrutural]
    │   │   ├── ICombatStats.ts          # Interface do componente de atributos
    │   │   ├── BaseStats.ts             # Componente concreto inicializado pela Factory
    │   │   ├── StatsDecorator.ts        # Classe abstrata envelopadora
    │   │   ├── BerserkDecorator.ts      # Buff ofensivo (+50% ATK, -10 DEF)
    │   │   ├── ShieldedDecorator.ts     # Buff defensivo (+25 DEF)
    │   │   └── VenomCoatingDecorator.ts # Buff adicional (+15 ATK)
    │   ├── state/                       # [Padrão 4 - Comportamental]
    │   │   ├── CombatState.ts           # Classe abstrata de Estado com hook de ciclo de turno
    │   │   ├── NormalState.ts           # Estado padrão sem restrições
    │   │   ├── StunnedState.ts          # Bloqueia ação, +25% dano sofrido, expira em N turnos
    │   │   └── FlyingState.ts           # Evasão aérea (-50% dano sofrido), expira em N turnos
    │   └── command/                     # [Padrão 5 - Comportamental]
    │       ├── ICommand.ts              # Contrato de execução e rollback
    │       ├── BaseTurnCommand.ts       # Classe abstrata que captura Snapshots antes de agir
    │       ├── AttackCommand.ts         # Ataque padrão
    │       ├── ConcussiveBombCommand.ts # Dano + transição forçada para StunnedState
    │       ├── ApplyDecoratorCommand.ts # Empilha um Decorator no turno atual
    │       ├── EnterFlyingStateCommand.ts# Transiciona para FlyingState
    │       └── PassAndRecoverCommand.ts # Consome o turno para reduzir contadores de Stun
    ├── core/
    │   ├── Character.ts                 # Entidade central (Contexto do State + Subject do Observer)
    │   ├── BattleArena.ts               # Invoker dos Commands, máquina de turnos e pilha de Undo
    │   └── BossAIController.ts          # Motor de decisão autônoma para o modo PvE Boss
    └── ui/
        └── App.tsx                      # Camada de apresentação (Modo Edição vs. Modo Batalha)
```

---

## 3. Mapeamento de Funcionalidades e Padrões

### Módulo 1: Tipagem Forte e Contratos Imutáveis (`src/types/`)
* **Responsabilidade:** Centralizar `enum` de eventos, identificadores de estados, arquétipos e tipos de turno (`'P1' | 'P2'`).
* **Recursos TypeScript:** `enum`, `interface`, *Union Types* e *Utility Types* (`Readonly<T>`, `ReadonlyArray<T>`).
* **Regra de Negócio:** Todo evento emitido pelo domínio deve ser um `Readonly<CombatEventPayload>` congelado em tempo de execução.

### Módulo 2: Telemetria e Auditoria Desacoplada (`src/patterns/observer/`)
* **Padrão Aplicado:** **Observer (Comportamental)**.
* **Responsabilidade:** Permitir que múltiplos módulos externos (Terminal/UI e Painel de Métricas) reajam a mudanças no `Character` sem que a classe de domínio conheça a camada visual.
* **Fluxo:** `Character` implementa `ISubject<ImmutableEvent>`. Sempre que sofre dano, muda de estado, recebe um *buff* ou sofre *rollback*, dispara `notify()`.

### Módulo 3: Criação de Profissões e Modo de Edição (`src/patterns/abstract-factory/`)
* **Padrão Aplicado:** **Abstract Factory (Criacional)**.
* **Responsabilidade:** Fornecer famílias completas de equipamentos (`IWeapon` + `IArmor` + `recommendedMaxHp`) coerentes com a profissão escolhida.
* **Fluxo:** No **Modo de Edição (`SETUP`)**, o usuário altera livremente a fábrica do Jogador 1 e do Jogador 2. Ao transicionar para o **Modo de Batalha (`BATTLE`)**, a referência da fábrica é travada.

### Módulo 4: Empilhamento Dinâmico de Buffs (`src/patterns/decorator/`)
* **Padrão Aplicado:** **Decorator (Estrutural)**.
* **Responsabilidade:** Modificar cálculos de ataque e defesa em tempo real sem criar subclasses estáticas e sem poluir `Character` com condicionais.
* **Fluxo:** `BaseStats` lê os valores da `ILoadoutFactory`. Cada *buff* aplicado no turno envelopa a instância atual (`stats = new BerserkDecorator(stats)`), delegando chamadas recursivamente e inspecionando a cadeia de chamadas.

### Módulo 5: Condições de Status e Expiração por Turno (`src/patterns/state/`)
* **Padrão Aplicado:** **State (Comportamental)**.
* **Responsabilidade:** Controlar se o personagem pode executar ações ofensivas (`canAct()`), interceptar o dano recebido (`modifyIncomingDamage()`) e gerenciar a própria duração (`onTurnEnd()`).
* **Fluxo de Saída do Stun:** `StunnedState` inicia com um contador de turnos (`turnsLeft = 1`) e retorna `canAct() === false`. Para sair do estado, o jogador executa o comando de recuperação (`PassAndRecoverCommand`), que consome a vez do jogador e invoca `state.onTurnEnd(character)`. O próprio estado decrementa seu contador e, ao zerar, transiciona o contexto de volta para `NormalState`.

### Módulo 6: Execução em Turnos e Rollback Transacional (`src/patterns/command/` + `src/core/BattleArena.ts`)
* **Padrão Aplicado:** **Command (Comportamental)**.
* **Responsabilidade:** Transformar cada ação de turno em um objeto autônomo contendo os snapshots de antes da ação (`actorSnapshot` e `targetSnapshot`) e validar a vez na `BattleArena`.
* **Fluxo:**
  1. `BattleArena.dispatchTurnCommand(cmd)` verifica se `cmd.actor.id === activeTurnOwner`.
  2. Se a ação for bloqueada pelo `State` (`execute()` retornar `false`), o turno **não** passa e o comando **não** vai para a pilha de histórico.
  3. Se a ação for válida (`execute()` retornar `true`), o comando é empilhado junto com o registro do turno anterior e a vez alterna (`P1 <-> P2`).
  4. `BattleArena.undoLastTurn()` desempilha o último registro, restaura os *snapshots* dos personagens e devolve a vez ao jogador daquele turno.

### Módulo 7: Modos de Jogo PvP e PvE Boss (`src/core/BossAIController.ts` + `src/ui/`)
* **Responsabilidade:** Alternar entre dois jogadores humanos (`PVP`) ou um jogador contra o `Overlord Malakor` (`PVE_BOSS`).
* **Fluxo da IA:** Quando `gameMode === 'PVE_BOSS'` e `activeTurn === 'P2'`, o controlador do Boss avalia o estado atual: se estiver em `StunnedState`, instancia e despacha obrigatoriamente `PassAndRecoverCommand`; caso contrário, escolhe taticamente entre aplicar um `Decorator`, entrar em `FlyingState`, lançar `ConcussiveBombCommand` ou executar `AttackCommand`.