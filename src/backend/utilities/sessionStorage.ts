import NodeCache from 'node-cache';
import Boom from '@hapi/boom';
import {
  DidResourceUri,
  DidUri,
  IClaim,
  IRequestForAttestation,
} from '@kiltprotocol/types';
import { randomAsNumber } from '@polkadot/util-crypto';
import { Attestation } from '@kiltprotocol/core';

import { sessionHeader } from '../endpoints/sessionHeader';

export interface BasicSession {
  sessionId: string;
  did?: DidUri;
  encryptionKeyUri?: DidResourceUri;
  didChallenge?: string;
  didConfirmed?: boolean;
  claim?: IClaim;
  secret?: string;
  confirmed?: boolean;
  requestForAttestation?: IRequestForAttestation;
  attestationPromise?: Promise<Attestation>;
  requestChallenge?: string;
}

// not sure if you picked the current solution bc it is more readable, but this is how you normally make optional properties required:
// (on first glance it actually looked like you extended the interface)
export type Session = BasicSession &
  Required<Pick<BasicSession, 'did' | 'encryptionKeyUri'>>;

export interface PayloadWithSession {
  sessionId: string;
}

const sessionStorage = new NodeCache({ stdTTL: 60 * 60, useClones: false });

function getSessionById(sessionId: string): BasicSession {
  const session = sessionStorage.get<BasicSession>(sessionId);
  if (!session) {
    throw Boom.forbidden(`Unknown or expired session ${sessionId}`);
  }
  // this is what the generic typing of the get method is for
  return session;
}

export function getBasicSession(headers: Record<string, string>): BasicSession {
  if (!(sessionHeader in headers)) {
    throw Boom.forbidden(`Required header ${sessionHeader} is missing`);
  }

  const sessionId = headers[sessionHeader];
  return getSessionById(sessionId);
}

export function getSession(headers: Record<string, string>): Session {
  const session = getBasicSession(headers);

  const { did, didConfirmed, encryptionKeyUri } = session;
  if (!did || !didConfirmed || !encryptionKeyUri) {
    throw Boom.forbidden('Unconfirmed DID');
  }

  return { ...session, did, encryptionKeyUri }; // you are not changing anything on the session, so why would you desctructure and reassemble it ?
}

export function setSession(session: BasicSession): void {
  sessionStorage.set(session.sessionId, session);
}

const secrets = new NodeCache({ stdTTL: 5 * 60 });

export function getSessionBySecret(secret: string): BasicSession {
  // same as above
  const sessionId = secrets.get<string>(secret);
  if (!sessionId) {
    throw Boom.forbidden(`Not found session for secret ${secret}`);
  }

  const session = getSessionById(sessionId);
  const expired = secret !== session.secret;
  if (expired) {
    throw Boom.forbidden(`Not found session for secret ${secret}`);
  }

  return session;
}

export function getSecretForSession(sessionId: string): string {
  const secret = String(randomAsNumber()); // only numbers to avoid 0xDEADDAD etc

  const session = getSessionById(sessionId);
  setSession({ ...session, secret });
  secrets.set(secret, sessionId);

  return secret;
}

export function deleteSecret(secret: string): void {
  secrets.del(secret);
}
