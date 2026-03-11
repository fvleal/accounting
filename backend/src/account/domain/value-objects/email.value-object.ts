import { ValueObject } from '../../../shared/domain/value-object.base';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  public static create(value: string): Email {
    return new Email({ value: value.toLowerCase().trim() });
  }

  protected validate(props: EmailProps): void {
    if (!Email.EMAIL_REGEX.test(props.value)) {
      throw new Error(`Invalid email format: ${props.value}`);
    }
  }

  get value(): string {
    return this.props.value;
  }
}
