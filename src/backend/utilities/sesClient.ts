import { SESClient } from '@aws-sdk/client-ses';

import { configuration } from './configuration';

export const sesClient = new SESClient({
  region: configuration.aws.region,
  credentials: configuration.aws,
});
