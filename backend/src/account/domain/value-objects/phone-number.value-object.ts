import { ValueObject } from '../../../shared/domain/value-object.base';

interface PhoneNumberProps {
  value: string;
}

export class PhoneNumber extends ValueObject<PhoneNumberProps> {
  // DDD (2 digits, starts 1-9) + number (starts 2-9, 8 or 9 digits total)
  private static readonly PHONE_REGEX = /^[1-9]{2}[2-9]\d{7,8}$/;

  private constructor(props: PhoneNumberProps) {
    super(props);
  }

  public static create(value: string): PhoneNumber {
    const stripped = value.replace(/\D/g, '');
    return new PhoneNumber({ value: stripped });
  }

  protected validate(props: PhoneNumberProps): void {
    if (!PhoneNumber.PHONE_REGEX.test(props.value)) {
      throw new Error(`Invalid Brazilian phone number: ${props.value}`);
    }
  }

  get value(): string {
    return this.props.value;
  }
}
