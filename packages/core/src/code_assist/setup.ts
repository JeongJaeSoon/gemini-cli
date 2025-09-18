/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ClientMetadata,
  GeminiUserTier,
  LoadCodeAssistResponse,
  OnboardUserRequest,
} from './types.js';
import { UserTierId } from './types.js';
import { CodeAssistServer } from './server.js';
import type { OAuth2Client } from 'google-auth-library';

export class ProjectIdRequiredError extends Error {
  constructor() {
    super(
      'This account requires setting the GOOGLE_CLOUD_PROJECT env var. See https://goo.gle/gemini-cli-auth-docs#workspace-gca',
    );
  }
}

export class ProjectAccessError extends Error {
  constructor(projectId: string, details?: string) {
    super(
      `Failed to access GCP project "${projectId}" for Gemini Code Assist.\n` +
        `${details || ''}\n` +
        `Please verify:\n` +
        `1. The project ID is correct\n` +
        `2. You have the necessary permissions for this project\n` +
        `3. The Gemini for Cloud API is enabled for this project\n` +
        `\n` +
        `To use a different project:\n` +
        `  export GOOGLE_CLOUD_PROJECT=<your-project-id>\n` +
        `\n` +
        `To use Free Tier instead, run /auth and select "Login with Google"`,
    );
  }
}

export interface UserData {
  projectId: string;
  userTier: UserTierId;
}

/**
 *
 * @param projectId the user's project id, if any
 * @returns the user's actual project id
 */
export async function setupUser(client: OAuth2Client): Promise<UserData> {
  const projectId = process.env['GOOGLE_CLOUD_PROJECT'] || undefined;
  const caServer = new CodeAssistServer(client, projectId, {}, '', undefined);
  const coreClientMetadata: ClientMetadata = {
    ideType: 'IDE_UNSPECIFIED',
    platform: 'PLATFORM_UNSPECIFIED',
    pluginType: 'GEMINI',
  };

  let loadRes: LoadCodeAssistResponse;
  try {
    loadRes = await caServer.loadCodeAssist({
      cloudaicompanionProject: projectId,
      metadata: {
        ...coreClientMetadata,
        duetProject: projectId,
      },
    });
  } catch (error) {
    // If loading failed with a project, it means the user doesn't have access
    if (projectId) {
      throw new ProjectAccessError(
        projectId,
        error instanceof Error ? error.message : 'Authentication failed',
      );
    }
    throw error;
  }

  if (loadRes.currentTier) {
    if (!loadRes.cloudaicompanionProject) {
      if (projectId) {
        // Check if this is a valid scenario or a project access issue
        // If user has a tier but no cloudaicompanionProject with projectId set,
        // it might indicate the project is not properly configured for GCA
        if (loadRes.currentTier.id !== UserTierId.FREE) {
          throw new ProjectAccessError(
            projectId,
            'The project exists but is not configured for Gemini Code Assist',
          );
        }
        return {
          projectId,
          userTier: loadRes.currentTier.id,
        };
      }
      throw new ProjectIdRequiredError();
    }
    return {
      projectId: loadRes.cloudaicompanionProject,
      userTier: loadRes.currentTier.id,
    };
  }

  const tier = getOnboardTier(loadRes);

  let onboardReq: OnboardUserRequest;
  if (tier.id === UserTierId.FREE) {
    // The free tier uses a managed google cloud project. Setting a project in the `onboardUser` request causes a `Precondition Failed` error.
    onboardReq = {
      tierId: tier.id,
      cloudaicompanionProject: undefined,
      metadata: coreClientMetadata,
    };
  } else {
    onboardReq = {
      tierId: tier.id,
      cloudaicompanionProject: projectId,
      metadata: {
        ...coreClientMetadata,
        duetProject: projectId,
      },
    };
  }

  // Poll onboardUser until long running operation is complete.
  let lroRes;
  try {
    lroRes = await caServer.onboardUser(onboardReq);
    while (!lroRes.done) {
      await new Promise((f) => setTimeout(f, 5000));
      lroRes = await caServer.onboardUser(onboardReq);
    }
  } catch (error) {
    // If onboarding failed with a project, it's likely an access issue
    if (projectId && tier.id !== UserTierId.FREE) {
      throw new ProjectAccessError(
        projectId,
        `Failed to onboard to Gemini Code Assist: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
    throw error;
  }

  if (!lroRes.response?.cloudaicompanionProject?.id) {
    if (projectId) {
      // If we have a project but onboarding didn't return one for non-free tier,
      // it's likely a configuration issue
      if (tier.id !== UserTierId.FREE) {
        throw new ProjectAccessError(
          projectId,
          'Failed to complete Gemini Code Assist setup with this project',
        );
      }
      return {
        projectId,
        userTier: tier.id,
      };
    }
    throw new ProjectIdRequiredError();
  }

  return {
    projectId: lroRes.response.cloudaicompanionProject.id,
    userTier: tier.id,
  };
}

function getOnboardTier(res: LoadCodeAssistResponse): GeminiUserTier {
  for (const tier of res.allowedTiers || []) {
    if (tier.isDefault) {
      return tier;
    }
  }
  return {
    name: '',
    description: '',
    id: UserTierId.LEGACY,
    userDefinedCloudaicompanionProject: true,
  };
}
