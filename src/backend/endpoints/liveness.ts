import { ServerRoute } from '@hapi/hapi';

export const liveness: ServerRoute = {
  method: 'GET',
  path: '/liveness',
  options: { auth: false },
  handler: () => 'OK',
};
