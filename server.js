import dotenv from 'dotenv';
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cryptoRandomString from 'crypto-random-string';
import nunjucks from 'nunjucks';

// import { attestClaim } from './backendServices/attestation.js';
import {
  getRequest,
  initRequestCache,
  cacheRequest,
} from './backendServices/requestCache.js';
import { sendEmail } from './backendServices/sendEmail.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));
app.use(morgan('common'));
app.use(express.json());

nunjucks.configure(path.join(__dirname, 'templates'), {
  express: app,
});

const emailLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again in an hour.',
});

initRequestCache();

app.post('/', emailLimiter, async function (req, res) {
  const request = JSON.parse(req.body.request);

  const key = cryptoRandomString({ length: 20, type: 'url-safe' });
  cacheRequest(key, request);

  await sendEmail(key, request);

  res.sendStatus(200);
});

app.get('/confirmation', async function (req, res) {
  const key = req.query.key;
  const request = getRequest(key);

  // TODO: Use real attestation when implementing new credential API
  // const attestation = await attestClaim(request);

  const fakeAttestation = {
    claimHash: request.rootHash,
    cTypeHash: request.claim.cTypeHash,
    owner: request.claim.owner,
    delegationId: null,
    revoked: false,
  };

  res.render('confirmation.njk', {
    email: request.claim.contents['Email'],
    attestation: fakeAttestation,
  });
});

app.listen(port, () => {
  console.log('Server started on port: ', port);
});
