import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path, { dirname } from 'node:path';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cryptoRandomString from 'crypto-random-string';

import { attestClaim } from './backendServices/attestation.js';
import {
  getRequestForAttestation,
  cacheRequestForAttestation,
} from './backendServices/requestCache.js';
import { sendEmail } from './backendServices/sendEmail.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));
app.use(morgan('common'));
app.use(express.json());

const requestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again in an hour.',
});

app.post('/attest', requestLimiter, async function (req, res, next) {
  const requestForAttestation = req.body;

  const key = cryptoRandomString({ length: 20, type: 'url-safe' });
  cacheRequestForAttestation(key, requestForAttestation);

  const url = `${process.env.URL}/confirmation/${key}`;

  try {
    await sendEmail(url, requestForAttestation);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});

app.get('/confirmation/:key', function (req, res) {
  const { key } = req.params;
  getRequestForAttestation(key);

  res.sendFile(path.join(__dirname, 'dist', 'confirmation.html'));
});

app.post('/attestation', async function (req, res, next) {
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
