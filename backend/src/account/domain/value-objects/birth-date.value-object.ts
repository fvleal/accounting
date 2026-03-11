import { ValueObject } from '../../../shared/domain/value-object.base';

interface BirthDateProps {
  value: string; // ISO string to avoid Date mutability in frozen props
}

export class BirthDate extends ValueObject<BirthDateProps> {
  private constructor(props: BirthDateProps) {
    super(props);
  }

  public static create(date: Date): BirthDate {
    return new BirthDate({ value: date.toISOString() });
  }

  protected validate(props: BirthDateProps): void {
    const date = new Date(props.value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    if (date > new Date()) {
      throw new Error('Birth date cannot be in the future');
    }
  }

  get value(): Date {
    return new Date(this.props.value);
  }
}
