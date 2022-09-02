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

export const attestFail = new Counter({
  name: 'attestation_failed_count',
  help: 'attestation_failed_count',
  labelNames: ['credential_type'],
});

export const attestDurationSeconds = new Histogram({
  name: 'attestation_duration_s',
  help: 'Duration of attestations in s',
  buckets: [0.1, 0.2, 0.5, 1, 3, 4, 5], // buckets for response time
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
