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
  confirmed?: boolean;
  requestForAttestation?: IRequestForAttestation;
  attestationPromise?: Promise<Attestation>;
  requestChallenge?: string;
}

export type Session = BasicSession & {
  did: DidUri;
  encryptionKeyUri: DidResourceUri;
};

export interface PayloadWithSession {
  sessionId: string;
}

const sessionStorage = new NodeCache({ stdTTL: 60 * 60, useClones: false });

function getSessionById(sessionId: string): BasicSession {
  const session = sessionStorage.get(sessionId);
  if (!session) {
    throw Boom.forbidden(`Unknown or expired session ${sessionId}`);
  }
  return session as BasicSession;
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

  return { ...session, did, encryptionKeyUri };
}

export function setSession(session: BasicSession): void {
  sessionStorage.set(session.sessionId, session);
}

const secrets = new NodeCache({ stdTTL: 5 * 60 });

export function getSessionBySecret(secret: string): BasicSession {
  const sessionId: string | undefined = secrets.get(secret);
  if (!sessionId) {
    throw Boom.forbidden(`Not found session for secret ${secret}`);
  }
  return getSessionById(sessionId);
}

export function getSecretForSession(sessionId: string): string {
  const secret = String(randomAsNumber()); // only numbers to avoid 0xDEADDAD etc
  secrets.set(secret, sessionId);
  return secret;
}

export function deleteSecret(secret: string): void {
  secrets.del(secret);
}
