import { describe, it, expect } from 'vitest';
import { ValueObject } from './value-object.base';

interface TestProps {
  value: string;
  count: number;
}

class TestValueObject extends ValueObject<TestProps> {
  protected validate(props: TestProps): void {
    if (!props.value || props.value.length === 0) {
      throw new Error('Value is required');
    }
  }

  get value(): string {
    return this.props.value;
  }

  static create(props: TestProps): TestValueObject {
    return new TestValueObject(props);
  }
}

class OtherValueObject extends ValueObject<TestProps> {
  protected validate(_props: TestProps): void {
    // no validation
  }

  static create(props: TestProps): OtherValueObject {
    return new OtherValueObject(props);
  }
}

describe('ValueObject', () => {
  it('should be equal when props are the same', () => {
    const vo1 = TestValueObject.create({ value: 'test', count: 1 });
    const vo2 = TestValueObject.create({ value: 'test', count: 1 });
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should not be equal when props differ', () => {
    const vo1 = TestValueObject.create({ value: 'test', count: 1 });
    const vo2 = TestValueObject.create({ value: 'other', count: 2 });
    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should return false when compared to null', () => {
    const vo = TestValueObject.create({ value: 'test', count: 1 });
    expect(vo.equals(null as unknown as ValueObject<TestProps>)).toBe(false);
  });

  it('should return false when compared to undefined', () => {
    const vo = TestValueObject.create({ value: 'test', count: 1 });
    expect(vo.equals(undefined as unknown as ValueObject<TestProps>)).toBe(
      false,
    );
  });

  it('should return false when compared to different class', () => {
    const vo1 = TestValueObject.create({ value: 'test', count: 1 });
    const vo2 = OtherValueObject.create({ value: 'test', count: 1 });
    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should freeze props (mutation is ignored or throws)', () => {
    const vo = TestValueObject.create({ value: 'test', count: 1 });
    expect(() => {
      (vo as any).props.value = 'mutated';
    }).toThrow();
  });

  it('should call validate during construction', () => {
    expect(
      TestValueObject.create({ value: 'test', count: 1 }),
    ).toBeDefined();
  });

  it('should throw when subclass validation fails', () => {
    expect(() => TestValueObject.create({ value: '', count: 1 })).toThrow(
      'Value is required',
    );
  });
});
