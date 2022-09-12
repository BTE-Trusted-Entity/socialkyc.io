import { register, Counter, Histogram } from 'prom-client';
import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ServerRoute,
} from '@hapi/hapi';

export const attestSuccess = new Counter({
  name: 'attestation_success_count',
  help: 'attestation_success_count',
  labelNames: ['credential_type'],
});
attestSuccess.inc(0);

export const attestFail = new Counter({
  name: 'attestation_failed_count',
  help: 'attestation_failed_count',
  labelNames: ['credential_type'],
});
attestFail.inc(0);

export const attestDurationSeconds = new Histogram({
  name: 'attestation_duration_s',
  help: 'Duration of attestations in s',
  buckets: [10, 15, 20, 30, 40, 50, 60, 90, 120], // buckets for response time
});

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  return h.response(await register.metrics()).type(register.contentType);
}

export const metrics: ServerRoute = {
  method: 'GET',
  path: '/metrics',
  handler,
};
