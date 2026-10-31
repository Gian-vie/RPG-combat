import type { ICommand } from '../patterns/command/ICommand';
import type { TurnOwner } from '../types/combat.types';
export interface TurnHistoryRecord { readonly command: ICommand; readonly previousTurnOwner: TurnOwner; readonly previousTurnNumber: number; }
export class BattleArena {
  private history: TurnHistoryRecord[] = []; private activeTurnOwner: TurnOwner = 'P1'; private turnCounter = 1;
  public get activeTurn(): TurnOwner { return this.activeTurnOwner; } public get turnNumber(): number { return this.turnCounter; }
  public dispatchTurnCommand(command: ICommand): boolean { if (command.actor.id !== this.activeTurnOwner) return false; const previousTurnOwner = this.activeTurnOwner; const previousTurnNumber = this.turnCounter; if (!command.execute()) return false; this.history.push(Object.freeze({ command, previousTurnOwner, previousTurnNumber })); this.activeTurnOwner = this.activeTurnOwner === 'P1' ? 'P2' : 'P1'; this.turnCounter += 1; return true; }
  public undoLastTurn(): TurnHistoryRecord | null { const record = this.history.pop(); if (!record) return null; record.command.undo(); this.activeTurnOwner = record.previousTurnOwner; this.turnCounter = record.previousTurnNumber; return record; }
  public getHistory(): ReadonlyArray<TurnHistoryRecord> { return [...this.history]; }
  public resetArena(): void { this.history = []; this.activeTurnOwner = 'P1'; this.turnCounter = 1; }
}
