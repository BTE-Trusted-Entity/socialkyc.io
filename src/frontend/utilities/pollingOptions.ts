import { Options } from 'ky';

export const pollingOptions: Partial<Options> = {
  timeout: false,
  retry: {
    limit: 10,
    methods: ['post'],
  },
};
