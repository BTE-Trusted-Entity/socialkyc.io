/**
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';

import { shouldBeRemoved, shouldBeRevoked } from './shouldBeExpired';

const deleteDate = new Date();
deleteDate.setMonth(deleteDate.getMonth() - (12 * 2 + 1));
const revokeDate = new Date();
revokeDate.setMonth(revokeDate.getMonth() - (12 + 1));
const keepDate = new Date();
keepDate.setMonth(keepDate.getMonth() - 1);

describe('shouldBeExpired', () => {
  describe('shouldBeRemoved', () => {
    it('should remove attestations older than 2 years', () => {
      expect(shouldBeRemoved({ createdAt: deleteDate })).toBe(true);
    });
    it('should not remove attestations younger than 2 years', () => {
      expect(shouldBeRemoved({ createdAt: revokeDate })).toBe(false);
      expect(shouldBeRemoved({ createdAt: keepDate })).toBe(false);
    });
  });

  describe('shouldBeRevoked', () => {
    it('should revoke attestations older than 1 year', () => {
      expect(shouldBeRevoked({ createdAt: deleteDate })).toBe(true);
      expect(shouldBeRevoked({ createdAt: revokeDate })).toBe(true);
    });
    it('should not revoke attestations younger than 1 year', () => {
      expect(shouldBeRevoked({ createdAt: keepDate })).toBe(false);
    });
  });
});
