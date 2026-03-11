export abstract class Entity<ID = string> {
  constructor(private readonly _id: ID) {}

  get id(): ID {
    return this._id;
  }

  public equals(other: Entity<ID>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this._id === other._id;
  }
}
