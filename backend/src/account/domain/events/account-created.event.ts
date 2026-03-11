import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class AccountCreated extends DomainEvent {
  public readonly accountId: string;
  public readonly auth0Sub: string;
  public readonly name: string;
  public readonly email: string;
  public readonly cpf: string;
  public readonly birthDate: Date | null;
  public readonly phone: string | null;
  public readonly photoUrl: string | null;
  public readonly createdAt: Date;

  constructor(props: {
    accountId: string;
    auth0Sub: string;
    name: string;
    email: string;
    cpf: string;
    birthDate: Date | null;
    phone: string | null;
    photoUrl: string | null;
    createdAt: Date;
  }) {
    super();
    this.accountId = props.accountId;
    this.auth0Sub = props.auth0Sub;
    this.name = props.name;
    this.email = props.email;
    this.cpf = props.cpf;
    this.birthDate = props.birthDate;
    this.phone = props.phone;
    this.photoUrl = props.photoUrl;
    this.createdAt = props.createdAt;
  }
}
