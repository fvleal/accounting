import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

export abstract class AggregateRoot<ID = string> extends Entity<ID> {
  private _domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
