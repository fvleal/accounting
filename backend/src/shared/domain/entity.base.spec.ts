import { describe, it, expect } from 'vitest';
import { Entity } from './entity.base';

class TestEntity extends Entity<string> {
  static create(id: string): TestEntity {
    return new TestEntity(id);
  }
}

describe('Entity', () => {
  it('should be equal when IDs are the same', () => {
    const e1 = TestEntity.create('id-1');
    const e2 = TestEntity.create('id-1');
    expect(e1.equals(e2)).toBe(true);
  });

  it('should not be equal when IDs differ', () => {
    const e1 = TestEntity.create('id-1');
    const e2 = TestEntity.create('id-2');
    expect(e1.equals(e2)).toBe(false);
  });

  it('should return false when compared to null', () => {
    const e = TestEntity.create('id-1');
    expect(e.equals(null as unknown as Entity<string>)).toBe(false);
  });

  it('should return false when compared to undefined', () => {
    const e = TestEntity.create('id-1');
    expect(e.equals(undefined as unknown as Entity<string>)).toBe(false);
  });

  it('should expose id via getter', () => {
    const e = TestEntity.create('id-1');
    expect(e.id).toBe('id-1');
  });
});
