export interface BootOptions {
  debug: boolean;
  resetSave: boolean;
  /** Debug-only interstitial simulator: show a 1.4 s ad or fail it. */
  adMock: 'show' | 'fail' | null;
}

/** Reads the explicit, non-persistent debug flags accepted by the build. */
export function readBootOptions(search: string): BootOptions {
  const params = new URLSearchParams(search);
  const adMock = params.get('adMock');
  return {
    debug: params.get('debug') === '1',
    resetSave: params.get('resetSave') === '1',
    adMock: adMock === 'show' || adMock === 'fail' ? adMock : null,
  };
}
