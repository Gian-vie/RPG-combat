import type { CharacterSnapshot } from '../../core/Character';
import type { Character } from '../../core/Character';
import type { ICommand } from './ICommand';
export abstract class BaseTurnCommand implements ICommand {
  public readonly id = crypto.randomUUID(); public abstract readonly label: string; public readonly timestamp = new Date().toLocaleTimeString();
  protected actorSnapshot?: Readonly<CharacterSnapshot>; protected targetSnapshot?: Readonly<CharacterSnapshot>;
  constructor(public readonly actor: Character, public readonly target: Character) {}
  protected captureSnapshots(): void { this.actorSnapshot = this.actor.createSnapshot(); this.targetSnapshot = this.target.createSnapshot(); }
  public abstract execute(): boolean;
  public undo(): void { if (this.targetSnapshot && this.target !== this.actor) this.target.restoreSnapshot(this.targetSnapshot, this.label); if (this.actorSnapshot) this.actor.restoreSnapshot(this.actorSnapshot, this.label); }
}
