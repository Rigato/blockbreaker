export interface BootOptions {
  debug: boolean;
  resetSave: boolean;
  /** Debug-only ad simulator: interstitial or rewarded success/failure. */
  adMock: 'show' | 'fail' | 'rewarded' | 'rewarded-fail' | null;
}

/** Reads the explicit, non-persistent debug flags accepted by the build. */
export function readBootOptions(search: string): BootOptions {
  const params = new URLSearchParams(search);
  const adMock = params.get('adMock');
  const valid =
    adMock === 'show' ||
    adMock === 'fail' ||
    adMock === 'rewarded' ||
    adMock === 'rewarded-fail';
  return {
    debug: params.get('debug') === '1',
    resetSave: params.get('resetSave') === '1',
    adMock: valid ? (adMock as BootOptions['adMock']) : null,
  };
}
