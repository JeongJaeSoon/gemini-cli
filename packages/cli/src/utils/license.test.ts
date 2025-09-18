/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { getLicenseDisplay } from './license.js';
import { AuthType, UserTierId } from '@google/gemini-cli-core';

describe('getLicenseDisplay', () => {
  describe('OAuth-personal (Login with Google)', () => {
    it('should return Free Tier when no userTier provided', () => {
      expect(getLicenseDisplay(AuthType.LOGIN_WITH_GOOGLE)).toBe(
        'Free Tier (Login with Google)',
      );
    });

    it('should respect userTier when provided', () => {
      expect(
        getLicenseDisplay(AuthType.LOGIN_WITH_GOOGLE, UserTierId.STANDARD),
      ).toBe('Gemini Code Assist Standard');
      expect(
        getLicenseDisplay(AuthType.LOGIN_WITH_GOOGLE, UserTierId.LEGACY),
      ).toBe('Gemini Code Assist Enterprise');
      expect(
        getLicenseDisplay(AuthType.LOGIN_WITH_GOOGLE, UserTierId.FREE),
      ).toBe('Free Tier');
    });
  });

  describe('OAuth types (Gemini Code Assist)', () => {
    it('should return GCA Standard for oauth with STANDARD tier', () => {
      expect(getLicenseDisplay('oauth', UserTierId.STANDARD)).toBe(
        'Gemini Code Assist Standard',
      );
    });

    it('should return GCA Enterprise for oauth with LEGACY tier', () => {
      expect(getLicenseDisplay('oauth', UserTierId.LEGACY)).toBe(
        'Gemini Code Assist Enterprise',
      );
    });

    it('should return Free Tier for oauth with FREE tier', () => {
      expect(getLicenseDisplay('oauth', UserTierId.FREE)).toBe('Free Tier');
    });

    it('should return generic GCA for oauth without tier', () => {
      expect(getLicenseDisplay('oauth')).toBe('Gemini Code Assist');
    });

    it('should handle string tier values', () => {
      expect(getLicenseDisplay('oauth', 'standard-tier')).toBe(
        'Gemini Code Assist Standard',
      );
      expect(getLicenseDisplay('oauth', 'legacy-tier')).toBe(
        'Gemini Code Assist Enterprise',
      );
      expect(getLicenseDisplay('oauth', 'free-tier')).toBe('Free Tier');
    });

    it('should handle oauth-prefixed auth types', () => {
      expect(getLicenseDisplay('oauth-workspace', UserTierId.STANDARD)).toBe(
        'Gemini Code Assist Standard',
      );
      expect(getLicenseDisplay('oauth-enterprise', UserTierId.LEGACY)).toBe(
        'Gemini Code Assist Enterprise',
      );
    });
  });

  describe('API Key authentication', () => {
    it('should return Gemini API Key for USE_GEMINI', () => {
      expect(getLicenseDisplay(AuthType.USE_GEMINI)).toBe('Gemini API Key');
    });

    it('should ignore userTier for USE_GEMINI', () => {
      expect(
        getLicenseDisplay(AuthType.USE_GEMINI, UserTierId.STANDARD),
      ).toBe('Gemini API Key');
    });
  });

  describe('Vertex AI authentication', () => {
    it('should return Vertex AI for USE_VERTEX_AI', () => {
      expect(getLicenseDisplay(AuthType.USE_VERTEX_AI)).toBe('Vertex AI');
    });

    it('should ignore userTier for USE_VERTEX_AI', () => {
      expect(
        getLicenseDisplay(AuthType.USE_VERTEX_AI, UserTierId.STANDARD),
      ).toBe('Vertex AI');
    });
  });

  describe('Cloud Shell authentication', () => {
    it('should return Cloud Shell for CLOUD_SHELL', () => {
      expect(getLicenseDisplay(AuthType.CLOUD_SHELL)).toBe('Cloud Shell');
    });

    it('should ignore userTier for CLOUD_SHELL', () => {
      expect(
        getLicenseDisplay(AuthType.CLOUD_SHELL, UserTierId.STANDARD),
      ).toBe('Cloud Shell');
    });
  });

  describe('Edge cases', () => {
    it('should return auth type as-is for unknown types', () => {
      expect(getLicenseDisplay('unknown-auth')).toBe('unknown-auth');
      expect(getLicenseDisplay('custom-auth-method')).toBe(
        'custom-auth-method',
      );
    });

    it('should handle undefined userTier gracefully', () => {
      expect(getLicenseDisplay('oauth', undefined)).toBe(
        'Gemini Code Assist',
      );
    });

    it('should handle unknown userTier for oauth types', () => {
      expect(getLicenseDisplay('oauth', 'unknown-tier' as any)).toBe(
        'Gemini Code Assist',
      );
    });

    it('should handle empty string auth type', () => {
      expect(getLicenseDisplay('')).toBe('');
    });

    it('should handle null/undefined as string (edge case)', () => {
      expect(getLicenseDisplay('null')).toBe('null');
      expect(getLicenseDisplay('undefined')).toBe('undefined');
    });
  });

  describe('oauth-personal special case', () => {
    it('should handle oauth-personal as LOGIN_WITH_GOOGLE without tier', () => {
      expect(getLicenseDisplay('oauth-personal')).toBe(
        'Free Tier (Login with Google)',
      );
    });

    it('should respect userTier even for oauth-personal', () => {
      expect(getLicenseDisplay('oauth-personal', UserTierId.STANDARD)).toBe(
        'Gemini Code Assist Standard',
      );
      expect(getLicenseDisplay('oauth-personal', UserTierId.LEGACY)).toBe(
        'Gemini Code Assist Enterprise',
      );
      expect(getLicenseDisplay('oauth-personal', UserTierId.FREE)).toBe(
        'Free Tier',
      );
    });
  });
});
