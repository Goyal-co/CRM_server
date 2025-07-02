import { readFileSync } from 'fs';
import jwt from 'jsonwebtoken';

const serviceAccount = JSON.parse(
  readFileSync('./google-service-account.json', 'utf8')
);

const now = Math.floor(Date.now() / 1000);
const oneHour = 60 * 60;

const payload = {
  iss: serviceAccount.client_email,
  scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  aud: 'https://oauth2.googleapis.com/token',
  exp: now + oneHour,
  iat: now,
};

const options = {
  algorithm: 'RS256',
  header: {
    typ: 'JWT',
    alg: 'RS256',
  },
};

const jwtToken = jwt.sign(payload, serviceAccount.private_key, options);

console.log(jwtToken);
