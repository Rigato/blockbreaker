import { describe, expect, it } from 'vitest';
import { readBootOptions } from '../src/boot/query';

describe('readBootOptions', () => {
  it('enables debug and save reset only with the exact M0 flags', () => {
    expect(readBootOptions('?debug=1&resetSave=1')).toEqual({
      debug: true,
      resetSave: true,
    });
  });

  it('does not enable debug for arbitrary values', () => {
    expect(readBootOptions('?debug=true')).toEqual({ debug: false, resetSave: false });
    expect(readBootOptions('?debug=0&resetSave=yes')).toEqual({
      debug: false,
      resetSave: false,
    });
  });

  it('returns both flags off for an empty query', () => {
    expect(readBootOptions('')).toEqual({ debug: false, resetSave: false });
  });
});
