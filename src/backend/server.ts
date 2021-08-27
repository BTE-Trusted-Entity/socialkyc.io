import express from 'express';
import morgan from 'morgan';

import { configuration } from './utilities/configuration';
import { request } from './endpoints/sendEmail';
import { confirmationHtml } from './endpoints/confirmationHtml';
import { attestation } from './endpoints/attestation';

const app = express();

app.use(express.static(configuration.distFolder));
app.use(morgan('common'));
app.use(express.json());

app.post('/request-attestation', request);

app.get('/confirmation/:key', confirmationHtml);

app.post('/attest', attestation);

const server = app.listen(configuration.port, () => {
  console.log('Server started on port: ', configuration.port);
});

process.on('SIGINT', () => {
  server.close();
});

process.on('SIGTERM', () => {
  server.close();
});
