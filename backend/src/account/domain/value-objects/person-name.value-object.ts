import { ValueObject } from '../../../shared/domain/value-object.base';

interface PersonNameProps {
  value: string;
}

export class PersonName extends ValueObject<PersonNameProps> {
  private constructor(props: PersonNameProps) {
    super(props);
  }

  public static create(value: string): PersonName {
    return new PersonName({ value: value.trim() });
  }

  protected validate(props: PersonNameProps): void {
    const trimmed = props.value.trim();
    if (!trimmed) {
      throw new Error('Person name is required');
    }
    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
      throw new Error('Person name must have at least 2 words');
    }
  }

  get value(): string {
    return this.props.value;
  }
}
