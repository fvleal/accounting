import { describe, it, expect } from 'vitest';
import { DomainEvent } from './domain-event.base';

class TestDomainEvent extends DomainEvent {
  constructor(public readonly data: string) {
    super();
  }
}

describe('DomainEvent', () => {
  it('should set occurredOn at construction time', () => {
    const event = new TestDomainEvent('test');
    expect(event.occurredOn).toBeDefined();
  });

  it('should have occurredOn as a valid Date instance', () => {
    const event = new TestDomainEvent('test');
    expect(event.occurredOn).toBeInstanceOf(Date);
    expect(event.occurredOn.getTime()).not.toBeNaN();
  });
});
