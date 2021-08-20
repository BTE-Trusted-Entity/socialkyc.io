import dotenv from 'dotenv';
import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import morgan from 'morgan';

import { sendEmail } from './services/sendEmail.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));
app.use(morgan('common'));
app.use(express.json());

app.post('/', async function (req, res) {
  const { email, name } = req.body;
  await sendEmail(name, email);
  res.sendStatus(200);
});

app.get('/confirmation/:key', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist/confirmation.html'));
});

app.listen(port, () => {
  console.log('Server started on port: ', port);
});
