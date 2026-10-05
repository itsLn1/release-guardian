import { describe, expect, it } from 'vitest';
import { DEMO_CLOCK_START, FixedStepClock } from './FixedStepClock.js';
import { SequentialIdGenerator } from './SequentialIdGenerator.js';

describe('FixedStepClock', () => {
  it('starts at the demo epoch and advances 15s per call', () => {
    const clock = new FixedStepClock();
    expect(clock.now()).toBe(DEMO_CLOCK_START);
    expect(clock.now()).toBe('2026-09-14T09:00:15.000Z');
    expect(clock.now()).toBe('2026-09-14T09:00:30.000Z');
  });

  it('is deterministic across instances', () => {
    const a = new FixedStepClock();
    const b = new FixedStepClock();
    const seqA = Array.from({ length: 5 }, () => a.now());
    const seqB = Array.from({ length: 5 }, () => b.now());
    expect(seqA).toEqual(seqB);
  });

  it('supports a custom start and step', () => {
    const clock = new FixedStepClock('2030-01-01T00:00:00.000Z', 1000);
    clock.now();
    expect(clock.now()).toBe('2030-01-01T00:00:01.000Z');
  });

  it('rejects an invalid start', () => {
    expect(() => new FixedStepClock('not-a-date')).toThrow(RangeError);
  });
});

describe('SequentialIdGenerator', () => {
  it('counts per prefix with zero padding', () => {
    const ids = new SequentialIdGenerator();
    expect(ids.next('ev')).toBe('ev-0001');
    expect(ids.next('ev')).toBe('ev-0002');
    expect(ids.next('tr')).toBe('tr-0001');
    expect(ids.next('ev')).toBe('ev-0003');
  });

  it('is deterministic across instances', () => {
    const a = new SequentialIdGenerator();
    const b = new SequentialIdGenerator();
    expect([a.next('val'), a.next('val')]).toEqual([b.next('val'), b.next('val')]);
  });
});
