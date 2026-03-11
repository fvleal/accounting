import { cpf as cpfValidator } from 'cpf-cnpj-validator';
import { ValueObject } from '../../../shared/domain/value-object.base';

interface CpfProps {
  value: string;
}

export class CPF extends ValueObject<CpfProps> {
  private constructor(props: CpfProps) {
    super(props);
  }

  public static create(value: string): CPF {
    const stripped = value.replace(/\D/g, '');
    return new CPF({ value: stripped });
  }

  protected validate(props: CpfProps): void {
    if (!cpfValidator.isValid(props.value)) {
      throw new Error(`Invalid CPF: ${props.value}`);
    }
  }

  get value(): string {
    return this.props.value;
  }

  get formatted(): string {
    return cpfValidator.format(this.props.value);
  }
}
