import type { IdGenerator } from '../ports/IdGenerator.js';

/** Deterministic ids, counted per prefix: ev-0001, ev-0002, tr-0001 ... */
export class SequentialIdGenerator implements IdGenerator {
  private readonly counters = new Map<string, number>();

  next(prefix: string): string {
    const n = (this.counters.get(prefix) ?? 0) + 1;
    this.counters.set(prefix, n);
    return `${prefix}-${String(n).padStart(4, '0')}`;
  }
}
