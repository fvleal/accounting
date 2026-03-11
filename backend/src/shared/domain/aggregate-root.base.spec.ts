import { describe, it, expect } from 'vitest';
import { AggregateRoot } from './aggregate-root.base';
import { DomainEvent } from './domain-event.base';

class TestEvent extends DomainEvent {
  constructor(public readonly data: string) {
    super();
  }
}

class TestAggregate extends AggregateRoot<string> {
  static create(id: string): TestAggregate {
    return new TestAggregate(id);
  }

  public doSomething(data: string): void {
    this.addEvent(new TestEvent(data));
  }
}

describe('AggregateRoot', () => {
  it('should extend Entity (has id and equals)', () => {
    const agg = TestAggregate.create('agg-1');
    expect(agg.id).toBe('agg-1');

    const agg2 = TestAggregate.create('agg-1');
    expect(agg.equals(agg2)).toBe(true);
  });

  it('should store a domain event via addEvent', () => {
    const agg = TestAggregate.create('agg-1');
    agg.doSomething('test-data');
    expect(agg.getEvents()).toHaveLength(1);
  });

  it('should return events as a new array (not internal reference)', () => {
    const agg = TestAggregate.create('agg-1');
    agg.doSomething('test-data');
    const events1 = agg.getEvents();
    const events2 = agg.getEvents();
    expect(events1).not.toBe(events2);
    expect(events1).toEqual(events2);
  });

  it('should clear events', () => {
    const agg = TestAggregate.create('agg-1');
    agg.doSomething('test-data');
    expect(agg.getEvents()).toHaveLength(1);
    agg.clearEvents();
    expect(agg.getEvents()).toHaveLength(0);
  });

  it('should collect multiple events', () => {
    const agg = TestAggregate.create('agg-1');
    agg.doSomething('event-1');
    agg.doSomething('event-2');
    agg.doSomething('event-3');
    expect(agg.getEvents()).toHaveLength(3);
  });
});
