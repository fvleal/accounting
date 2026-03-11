import { randomUUID } from 'node:crypto';
import { AggregateRoot } from '../../../shared/domain/aggregate-root.base';
import {
  Email,
  CPF,
  PersonName,
  PhoneNumber,
  BirthDate,
} from '../value-objects';
import { AccountCreated } from '../events/account-created.event';
import { AccountUpdated } from '../events/account-updated.event';

interface CreateAccountProps {
  auth0Sub: string;
  name: string;
  email: string;
  cpf: string;
}

interface ReconstituteAccountProps {
  auth0Sub: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date | null;
  phone: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Account extends AggregateRoot<string> {
  private _auth0Sub!: string;
  private _name!: PersonName;
  private _email!: Email;
  private _cpf!: CPF;
  private _birthDate: BirthDate | null = null;
  private _phone: PhoneNumber | null = null;
  private _photoUrl: string | null = null;
  private _createdAt!: Date;
  private _updatedAt!: Date;

  private constructor(id: string) {
    super(id);
  }

  public static create(props: CreateAccountProps): Account {
    const id = randomUUID();
    const account = new Account(id);

    account._auth0Sub = props.auth0Sub;
    account.setName(props.name);
    account.setEmail(props.email);
    account.setCpf(props.cpf);
    account._birthDate = null;
    account._phone = null;
    account._photoUrl = null;
    account._createdAt = new Date();
    account._updatedAt = new Date();

    account.addEvent(
      new AccountCreated({
        accountId: account.id,
        auth0Sub: account.auth0Sub,
        name: account.name,
        email: account.email,
        cpf: account.cpf,
        birthDate: account.birthDate,
        phone: account.phone,
        photoUrl: account.photoUrl,
        createdAt: account.createdAt,
      }),
    );

    return account;
  }

  public static reconstitute(
    id: string,
    props: ReconstituteAccountProps,
  ): Account {
    const account = new Account(id);

    account._auth0Sub = props.auth0Sub;
    account.setName(props.name);
    account.setEmail(props.email);
    account.setCpf(props.cpf);

    if (props.birthDate !== null) {
      account._birthDate = BirthDate.create(props.birthDate);
    }
    if (props.phone !== null) {
      account._phone = PhoneNumber.create(props.phone);
    }
    if (props.photoUrl !== null) {
      new URL(props.photoUrl); // validate
      account._photoUrl = props.photoUrl;
    }

    account._createdAt = props.createdAt;
    account._updatedAt = props.updatedAt;

    return account;
  }

  // Private setters for validation
  private setName(name: string): void {
    this._name = PersonName.create(name);
  }

  private setEmail(email: string): void {
    this._email = Email.create(email);
  }

  private setCpf(cpf: string): void {
    this._cpf = CPF.create(cpf);
  }

  // Public getters
  get auth0Sub(): string {
    return this._auth0Sub;
  }

  get name(): string {
    return this._name.value;
  }

  get email(): string {
    return this._email.value;
  }

  get cpf(): string {
    return this._cpf.value;
  }

  get birthDate(): Date | null {
    return this._birthDate ? this._birthDate.value : null;
  }

  get phone(): string | null {
    return this._phone ? this._phone.value : null;
  }

  get photoUrl(): string | null {
    return this._photoUrl;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Update methods
  public updateName(newName: string): void {
    const oldName = this.name;
    this.setName(newName);
    this._updatedAt = new Date();
    this.addEvent(
      new AccountUpdated({
        accountId: this.id,
        changes: { name: { before: oldName, after: this.name } },
      }),
    );
  }

  public updatePhone(phone: string): void {
    const oldPhone = this.phone;
    this._phone = PhoneNumber.create(phone);
    this._updatedAt = new Date();
    this.addEvent(
      new AccountUpdated({
        accountId: this.id,
        changes: { phone: { before: oldPhone, after: this.phone } },
      }),
    );
  }

  public updateBirthDate(date: Date): void {
    const oldBirthDate = this.birthDate;
    this._birthDate = BirthDate.create(date);
    this._updatedAt = new Date();
    this.addEvent(
      new AccountUpdated({
        accountId: this.id,
        changes: {
          birthDate: { before: oldBirthDate, after: this.birthDate },
        },
      }),
    );
  }

  public updatePhoto(url: string): void {
    new URL(url); // throws if invalid
    const oldPhotoUrl = this.photoUrl;
    this._photoUrl = url;
    this._updatedAt = new Date();
    this.addEvent(
      new AccountUpdated({
        accountId: this.id,
        changes: { photoUrl: { before: oldPhotoUrl, after: this.photoUrl } },
      }),
    );
  }
}
