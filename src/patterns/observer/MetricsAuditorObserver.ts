import { CombatEventType, type AuditMetrics, type ImmutableEvent } from '../../types/combat.types';
import type { IObserver } from './IObserver';

export class MetricsAuditorObserver implements IObserver<ImmutableEvent> {
  private totalEvents = 0; private totalDamage = 0; private blockedActions = 0; private rollbacksExecuted = 0;
  constructor(private readonly onMetricsCallback: (metrics: Readonly<AuditMetrics>) => void) {}
  public update(event: ImmutableEvent): void {
    this.totalEvents += 1;
    if (event.type === CombatEventType.DAMAGE_TAKEN && typeof event.damageDealt === 'number') this.totalDamage += Math.max(0, event.damageDealt);
    else if (event.type === CombatEventType.ACTION_BLOCKED) this.blockedActions += 1;
    else if (event.type === CombatEventType.UNDO_EXECUTED) this.rollbacksExecuted += 1;
    this.publish();
  }
  public reset(): void { this.totalEvents = 0; this.totalDamage = 0; this.blockedActions = 0; this.rollbacksExecuted = 0; this.publish(); }
  private publish(): void { this.onMetricsCallback(Object.freeze({ totalEvents: this.totalEvents, totalDamage: this.totalDamage, blockedActions: this.blockedActions, rollbacksExecuted: this.rollbacksExecuted })); }
}
