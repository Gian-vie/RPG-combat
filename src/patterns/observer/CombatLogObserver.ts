import type { ImmutableEvent } from '../../types/combat.types';
import type { IObserver } from './IObserver';

export class DOMCombatLogObserver implements IObserver<ImmutableEvent> {
  private logs: ImmutableEvent[] = [];
  constructor(private readonly onUpdateCallback: (logs: ImmutableEvent[]) => void) {}
  public update(event: ImmutableEvent): void { this.logs = [event, ...this.logs].slice(0, 120); this.onUpdateCallback([...this.logs]); }
  public clear(): void { this.logs = []; this.onUpdateCallback([]); }
}
