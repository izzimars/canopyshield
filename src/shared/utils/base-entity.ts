/**
 * Base entity class for type-safe entity construction
 * Provides a generic way to instantiate entities with partial properties
 */
export abstract class BaseEntity<T> {
  constructor(props?: Partial<T>) {
    Object.assign(this, props ?? {});
  }
}
