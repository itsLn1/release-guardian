/** Source of identifiers. Core code must never generate random ids directly. */
export interface IdGenerator {
  /** Returns the next id for a prefix, e.g. next('ev') -> "ev-0001". */
  next(prefix: string): string;
}
