/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType, UserTierId } from '@google/gemini-cli-core';

/**
 * Get human-readable license display text based on auth type and user tier.
 * @param selectedAuthType - The authentication type selected by the user
 * @param userTier - Optional user tier information from the server
 * @returns Human-readable license information
 */
export function getLicenseDisplay(
  selectedAuthType: string,
  userTier?: UserTierId | string,
): string {
  switch (selectedAuthType) {
    case AuthType.USE_GEMINI:
      return 'Gemini API Key';

    case AuthType.USE_VERTEX_AI:
      return 'Vertex AI';

    case AuthType.CLOUD_SHELL:
      return 'Cloud Shell';

    default:
      // Handle all oauth types including oauth-personal (LOGIN_WITH_GOOGLE)
      if (selectedAuthType.startsWith('oauth')) {
        // Check userTier first to determine the actual license
        if (userTier === UserTierId.STANDARD || userTier === 'standard-tier') {
          return 'Gemini Code Assist Standard';
        } else if (userTier === UserTierId.LEGACY || userTier === 'legacy-tier') {
          return 'Gemini Code Assist Enterprise';
        } else if (userTier === UserTierId.FREE || userTier === 'free-tier') {
          return 'Free Tier';
        }

        // If no tier info, check if it's specifically oauth-personal
        if (selectedAuthType === AuthType.LOGIN_WITH_GOOGLE) {
          return 'Free Tier (Login with Google)';
        }

        // For other oauth types without tier info
        return 'Gemini Code Assist';
      }
      return selectedAuthType;
  }
}
