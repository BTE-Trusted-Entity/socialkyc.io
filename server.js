import dotenv from 'dotenv';
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cryptoRandomString from 'crypto-random-string';

import { sendEmail } from './services/sendEmail.js';
import { getEmail, initEmailCache, saveEmail } from './services/emailData.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));
app.use(morgan('common'));
app.use(express.json());

const emailLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again in an hour.',
});

initEmailCache();

app.post('/', emailLimiter, async function (req, res) {
  const { email, name } = req.body;

  const key = cryptoRandomString({ length: 20, type: 'base64' });
  saveEmail(key, email, name);
  await sendEmail(name, email, key);

  res.sendStatus(200);
});

app.get('/confirmation', function (req, res) {
  const key = req.query.key;
  const { email, name } = getEmail(key);
  // TODO: attest the claim
  res.sendFile(path.join(__dirname, 'dist/confirmation.html'));
});

app.listen(port, () => {
  console.log('Server started on port: ', port);
});
