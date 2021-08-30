import express from 'express';
import { cwd } from 'node:process';
import path from 'node:path';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { attestClaim } from './backendServices/attestation';
import {
  getRequestForAttestation,
  cacheRequestForAttestation,
} from './backendServices/requestCache';
import { sendEmail } from './backendServices/sendEmail';

const distFolder = path.join(cwd(), 'dist', 'frontend');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(distFolder));
app.use(morgan('common'));
app.use(express.json());

const requestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again in an hour.',
});

app.post(
  '/request-attestation',
  requestLimiter,
  async function (req, res, next) {
    const requestForAttestation = req.body;

    // the library uses ES6 syntax, has to be loaded this way
    const cryptoRandomString = (await import('crypto-random-string')).default;

    const key = cryptoRandomString({ length: 20, type: 'url-safe' });
    cacheRequestForAttestation(key, requestForAttestation);

    const url = `${process.env.URL}/confirmation/${key}`;

    try {
      await sendEmail(url, requestForAttestation);
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  },
);

app.get('/confirmation/:key', function (req, res, next) {
  try {
    // Page will not render if some random or incorrect key is entered in the URL
    const { key } = req.params;
    getRequestForAttestation(key);
  } catch (error) {
    next(error);
  }

  res.sendFile(path.join(distFolder, 'confirmation.html'));
});

app.post('/attest', async function (req, res, next) {
  const { key } = req.body;
  const requestForAttestation = getRequestForAttestation(key);

  try {
    const { email, blockHash, message } = await attestClaim(
      requestForAttestation,
    );
    res.json({
      email,
      blockHash,
      message,
    });
  } catch (error) {
    next(error);
  }
});

app.listen(port, () => {
  console.log('Server started on port: ', port);
});
