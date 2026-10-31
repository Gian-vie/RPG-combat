# Motor de Combate RPG Turn-Based

## Descrição do Projeto

Este projeto consiste em um simulador de combate tático em turnos (Turn-Based RPG) desenvolvido em TypeScript estrito, com suporte a execução via interface web interativa e terminal (CLI). O sistema conta com um **Modo de Preparação/Edição** (para escolha de arquétipos e fábricas de equipamentos com trava de segurança ao iniciar a partida), controle estrito de alternância de turnos, suporte a partidas **PvP (Jogador vs. Jogador)** e **PvE contra Boss** (controlado por uma rotina autônoma no seu respectivo turno).

**Problema que o sistema resolve:**
Em jogos de estratégia e motores de combate, é comum que a lógica de criação de classes de personagens, o cálculo dinâmico de atributos (*buffs* e *debuffs*), a validação de restrições de status (como atordoamento ou voo), o gerenciamento de turnos com reversão de jogadas (*Undo*) e a emissão de logs fiquem concentrados em classes monolíticas repletas de condicionais (`if/else` e `switch`). Essa abordagem gera alto acoplamento, dificulta a manutenção e compromete a integridade do estado da partida.

Este projeto resolve esse problema desacoplando o núcleo de regras de negócio através da aplicação combinada de **5 Padrões de Projeto GoF** (abrangendo as categorias Criacional, Estrutural e Comportamental) aliados aos recursos avançados de tipagem do TypeScript.

---

## Tecnologias e Recursos do TypeScript Utilizados

Para garantir segurança em tempo de compilação e os pilares de **Integridade**, **Confidencialidade** (encapsulamento estrito) e **Disponibilidade**, a aplicação explora:

* **Interfaces e Classes Abstratas:** Contratos formais para todas as fábricas, comandos, estados, decoradores e observadores (`ILoadoutFactory`, `ICommand`, `CombatState`, `StatsDecorator`).
* **Generics (`<T>`):** Desacoplamento do barramento de eventos no padrão Observer (`ISubject<T>` e `IObserver<T>`).
* **Utility Types (`Readonly<T>`, `Pick<T, K>`):** Garantia de imutabilidade em snapshots de estado (`Readonly<CharacterSnapshot>`) e payloads de auditoria (`Readonly<CombatEventPayload>`), combinados com `Object.freeze()` em tempo de execução.
* **Enums:** Tipagem estrita de eventos de domínio (`CombatEventType`), arquétipos (`ArchetypeType`) e identificadores de estado (`StateIdentifier`).
* **ECMAScript Private Fields (`#`):** Proteção real de atributos sensíveis (`#hp`, `#state`, `#history`, `#observers`) contra mutações diretas fora das regras de negócio.

---

## Estrutura de Diretórios

~~~text
rpg-combat-engine/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts                              # Ponto de entrada CLI / Simulação
    ├── ui/
    │   └── App.tsx                           # Interface Web Interativa (Modo Edição, PvP e Boss)
    ├── types/
    │   └── combat.types.ts                   # Enums, Utility Types e Contratos de Eventos
    ├── core/
    │   ├── Character.ts                      # Entidade central (Context do State e Subject do Observer)
    │   ├── BattleArena.ts                    # Invoker dos Commands, controlador de turnos e histórico
    │   └── BossAIController.ts               # Tomada de decisão autônoma do Boss no modo PvE
    └── patterns/
        ├── abstract-factory/                 # [Padrão Criacional]
        │   ├── ILoadoutFactory.ts
        │   ├── WarriorFactory.ts
        │   ├── AlchemistFactory.ts
        │   ├── CyberMercenaryFactory.ts
        │   └── BossOverlordFactory.ts
        ├── decorator/                        # [Padrão Estrutural]
        │   ├── ICombatStats.ts
        │   ├── BaseStats.ts
        │   ├── StatsDecorator.ts
        │   ├── BerserkDecorator.ts
        │   ├── ShieldedDecorator.ts
        │   └── VenomCoatingDecorator.ts
        ├── state/                            # [Padrão Comportamental]
        │   ├── CombatState.ts
        │   ├── NormalState.ts
        │   ├── StunnedState.ts
        │   └── FlyingState.ts
        ├── command/                          # [Padrão Comportamental]
        │   ├── ICommand.ts
        │   ├── BaseTurnCommand.ts
        │   ├── AttackCommand.ts
        │   ├── ConcussiveBombCommand.ts
        │   ├── ApplyDecoratorCommand.ts
        │   ├── EnterFlyingStateCommand.ts
        │   └── PassAndRecoverCommand.ts
        └── observer/                         # [Padrão Comportamental]
            ├── IObserver.ts
            ├── CombatLogObserver.ts
            └── MetricsAuditorObserver.ts
~~~

---

## Instruções de Execução

### Pré-requisitos
* **Node.js** (versão 18 ou superior)
* **npm** (gerenciador de pacotes padrão)

### Passo a Passo

1. **Clone o repositório e acesse a pasta do projeto:**
   ~~~bash
   git clone <url-do-repositorio>
   cd rpg-combat-engine
   ~~~

2. **Instale as dependências:**
   ~~~bash
   npm install
   ~~~

3. **Execute a aplicação:**
   * **Para rodar a interface Web interativa (Vite/React):**
     ~~~bash
     npm run dev
     ~~~
   * **Para rodar a simulação diretamente no terminal (CLI via `ts-node`):**
     ~~~bash
     npm start
     ~~~

4. **Compilação e Verificação de Tipos (Build TypeScript):**
   ~~~bash
   npm run build
   ~~~

---

## Mapeamento dos 5 Padrões de Projeto

Abaixo está o detalhamento técnico de cada um dos 5 padrões implementados, sua categoria, localização no código-fonte e a justificativa arquitetural para sua escolha.

---

### 1. Abstract Factory — Criacional

* **Onde foi aplicado:**
  * **Interfaces:** `ILoadoutFactory`, `IWeapon`, `IArmor` (`src/patterns/abstract-factory/ILoadoutFactory.ts`).
  * **Classes Concretas:** `WarriorFactory`, `AlchemistFactory`, `CyberMercenaryFactory` e `BossOverlordFactory` (`src/patterns/abstract-factory/`).
  * **Consumo:** Utilizado no **Modo de Edição (`SETUP`)** e injetado na classe `Character` e em `BaseStats`.
* **Justificativa:**
  O sistema permite escolher diferentes profissões/arquétipos antes de travar o início da batalha. Cada arquétipo exige uma família de equipamentos coerentes entre si (ex.: o Guerreiro utiliza *Espada Bastarda* + *Armadura de Placas* + 160 HP, enquanto o Alquimista utiliza *Lançador de Frascos Voláteis* + *Gibão de Couro* + 120 HP). O **Abstract Factory** foi a escolha ideal porque encapsula a criação dessas famílias de produtos sem acoplar a classe `Character` às classes concretas de armas e armaduras. Além disso, permitiu adicionar facilmente o kit exclusivo do Boss (`BossOverlordFactory`) respeitando o Princípio Aberto-Fechado (OCP).

---

### 2. Decorator — Estrutural

* **Onde foi aplicado:**
  * **Interface e Base:** `ICombatStats` (`src/patterns/decorator/ICombatStats.ts`) e `BaseStats` (`src/patterns/decorator/BaseStats.ts`).
  * **Classe Abstrata:** `StatsDecorator` (`src/patterns/decorator/StatsDecorator.ts`).
  * **Decoradores Concretos:** `BerserkDecorator` (+50% de ataque e -10 de defesa), `ShieldedDecorator` (+25 de defesa fixa) e `VenomCoatingDecorator` (+15 de ataque) (`src/patterns/decorator/`).
* **Justificativa:**
  Durante a partida, os combatentes podem ativar múltiplos *buffs* e efeitos que modificam seus atributos de ataque e defesa simultaneamente e em qualquer ordem. Tentar resolver isso com herança estática geraria uma explosão combinatória de subclasses (`WarriorWithShield`, `WarriorWithBerserkAndShield`, etc.). O padrão **Decorator** foi a solução ideal por permitir envolver (*wrap*) o objeto `ICombatStats` dinamicamente em tempo de execução, empilhando cálculos matemáticos de forma recursiva e transparente, além de preservar a referência original para reversões futuras.

---

### 3. State — Comportamental

* **Onde foi aplicado:**
  * **Classe Abstrata:** `CombatState` (`src/patterns/state/CombatState.ts`).
  * **Estados Concretos:** `NormalState`, `StunnedState` e `FlyingState` (`src/patterns/state/`).
  * **Contexto:** Classe `Character` (`src/core/Character.ts`), que delega ao estado atual as chamadas `canAct()`, `modifyIncomingDamage()` e o gancho de fim de turno `onTurnEnd()`.
* **Justificativa:**
  O comportamento de um personagem muda drasticamente dependendo de sua condição atual em combate. O padrão **State** eliminou a necessidade de espalhar blocos `if (this.status === 'STUNNED')` pelos métodos de ataque e recebimento de dano:
  * Quando em **`StunnedState`**, o próprio objeto de estado bloqueia ações ofensivas (`canAct() === false`), aplica penalidade de vulnerabilidade (+25% de dano recebido) e controla internamente sua duração em turnos (`remainingTurns`). Ao executar a ação de recuperação no turno (`PassAndRecoverCommand`), o método `onTurnEnd()` do próprio `StunnedState` decrementa seu contador e autotransiciona o personagem de volta para `NormalState`.
  * Quando em **`FlyingState`**, o estado intercepta o cálculo de dano recebido e aplica 50% de mitigação por evasão aérea durante 2 turnos.

---

### 4. Command — Comportamental

* **Onde foi aplicado:**
  * **Interface e Classe Base:** `ICommand` e `BaseTurnCommand` (`src/patterns/command/`).
  * **Comandos Concretos:** `AttackCommand`, `ConcussiveBombCommand`, `ApplyDecoratorCommand`, `EnterFlyingStateCommand` e `PassAndRecoverCommand` (`src/patterns/command/`).
  * **Invoker (Controlador de Turnos):** `BattleArena` (`src/core/BattleArena.ts`), responsável por validar de quem é a vez, despachar os comandos, alternar o turno entre Jogador 1 e Jogador 2/Boss e gerenciar a pilha de histórico `#history`.
* **Justificativa:**
  Em um motor de combate baseado em turnos, cada ação precisa ser validada, enfileirada, auditada e passível de reversão (*Undo*). O padrão **Command** foi escolhido por transformar cada jogada (ataque físico, bomba de atordoamento, aplicação de *buff* ou recuperação de fôlego) em um objeto autônomo. Antes de alterar o estado do jogo, cada comando captura um snapshot imutável (`Readonly<CharacterSnapshot>`) dos combatentes e registra o dono do turno na arena. Caso o usuário acione o recurso de **Rollback (`undoLastTurn`)**, o comando no topo da pilha restaura exatamente o HP, a cadeia de Decorators, o estado (`State` e turnos restantes de Stun) e devolve a vez ao jogador correspondente.

---

### 5. Observer — Comportamental

* **Onde foi aplicado:**
  * **Interfaces Genéricas:** `ISubject<T>` e `IObserver<T>` (`src/patterns/observer/IObserver.ts`).
  * **Subject (Publicador):** Classe `Character` (`src/core/Character.ts`).
  * **Observers Concretos (Assinantes):** `CombatLogObserver` (formatação de histórico de eventos em tempo real) e `MetricsAuditorObserver` (coletor e auditor de estatísticas de dano total, bloqueios de estado e rollbacks executados) (`src/patterns/observer/`).
* **Justificativa:**
  O motor de regras de combate não deve depender nem conhecer detalhes da camada de apresentação (seja ela um console CLI ou componentes React na interface Web) nem de coletores secundários de telemetria. O padrão **Observer** foi aplicado para estabelecer um mecanismo de assinatura onde qualquer alteração de HP, aplicação de Decorator, transição de State, bloqueio de turno ou execução de Undo dispara uma notificação contendo um payload imutável (`Object.freeze`). Isso permitiu atualizar simultaneamente o feed de eventos da interface e o painel de métricas de auditoria mantendo acoplamento zero com a entidade `Character`.