import { configuration } from '../../utilities/configuration';
import { sleep } from '../../utilities/sleep';

import { queryCTypes } from './queryCTypes';
import { updateAttestationsCreated } from './updateAttestationsCreated';

const { isTestEnvironment } = configuration;

const SCAN_INTERVAL_MS = 10 * 60 * 1000;

export function watchIndexer() {
  if (isTestEnvironment) {
    return;
  }
  (async () => {
    while (true) {
      await queryCTypes();
      await updateAttestationsCreated();
      await sleep(SCAN_INTERVAL_MS);
    }
  })();
}
