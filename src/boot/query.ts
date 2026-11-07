export interface BootOptions {
  debug: boolean;
  resetSave: boolean;
}

/** Reads the explicit, non-persistent debug flags accepted by the build. */
export function readBootOptions(search: string): BootOptions {
  const params = new URLSearchParams(search);
  return {
    debug: params.get('debug') === '1',
    resetSave: params.get('resetSave') === '1',
  };
}
