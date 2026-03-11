import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class AccountUpdated extends DomainEvent {
  public readonly accountId: string;
  public readonly changes: Record<string, { before: unknown; after: unknown }>;

  constructor(props: {
    accountId: string;
    changes: Record<string, { before: unknown; after: unknown }>;
  }) {
    super();
    this.accountId = props.accountId;
    this.changes = props.changes;
  }
}
