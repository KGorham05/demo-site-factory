/**
 * Vercel Deployment Module
 *
 * Handles deploying generated Astro sites to Vercel via:
 *   - The Vercel REST API (project creation, custom domains, status checks)
 *   - The Vercel CLI (file deployment via `npx vercel`)
 */

import { execSync } from "node:child_process";

import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const VercelDeployConfigSchema = z.object({
  /** Absolute path to the generated site directory */
  siteDir: z.string().min(1, "siteDir is required"),
  /** Vercel API token */
  token: z.string().min(1, "token is required"),
  /** Optional Vercel team / org ID */
  teamId: z.string().optional(),
  /** Project name override (defaults to directory basename) */
  projectName: z.string().optional(),
});

export type VercelDeployConfig = z.infer<typeof VercelDeployConfigSchema>;

export interface VercelDeployResult {
  /** The deployment URL returned by the Vercel CLI */
  url: string;
  /** Vercel project ID (parsed from CLI output or API response) */
  projectId: string;
  /** Vercel deployment ID */
  deploymentId: string;
}

export interface VercelProject {
  id: string;
  name: string;
}

export interface VercelDeploymentStatus {
  id: string;
  state: string;
  url: string | null;
  readyState: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class VercelDeployError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "VercelDeployError";
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function teamQuery(teamId?: string): string {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

/**
 * Parse the deployment URL that `npx vercel` prints to stdout.
 *
 * The Vercel CLI outputs the production / preview URL as the last https://
 * URL on its own line. Example stdout:
 *
 *   Vercel CLI 37.x.x
 *   ...
 *   https://my-project-abc123.vercel.app
 *
 * We capture the first `https://...vercel.app` URL we find.
 */
export function parseDeploymentUrl(stdout: string): string {
  const lines = stdout.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^https:\/\/.+\.vercel\.app/.test(trimmed)) {
      return trimmed;
    }
  }

  // Fallback: grab any https URL
  for (const line of lines) {
    const match = line.trim().match(/^(https:\/\/\S+)/);
    if (match) {
      return match[1];
    }
  }

  throw new VercelDeployError("Could not parse deployment URL from Vercel CLI output");
}

/**
 * Extract a deployment ID from a Vercel deployment URL.
 *
 * Vercel URLs follow the pattern:
 *   https://<project>-<deploymentId>.vercel.app
 *
 * We use the full subdomain as a "deployment id" slug — the real ID can be
 * resolved later via the deployments API if needed.
 */
export function parseDeploymentId(url: string): string {
  try {
    const { hostname } = new URL(url);
    // hostname looks like "my-project-abc123.vercel.app"
    const subdomain = hostname.split(".")[0];
    return subdomain;
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new Vercel project via the REST API.
 */
export async function createVercelProject(config: {
  name: string;
  token: string;
  teamId?: string;
}): Promise<VercelProject> {
  const url = `https://api.vercel.com/v10/projects${teamQuery(config.teamId)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(config.token),
    body: JSON.stringify({
      name: config.name,
      framework: "astro",
      buildCommand: "pnpm build",
      outputDirectory: "dist",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new VercelDeployError(
      `Failed to create Vercel project: ${response.status} — ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as { id: string; name: string };
  return { id: data.id, name: data.name };
}

/**
 * Deploy a generated Astro site to Vercel using the Vercel CLI.
 *
 * This shells out to `npx vercel --yes --token $TOKEN` which handles file
 * uploading, build execution, and deployment in a single step.
 */
export function deployToVercel(config: VercelDeployConfig): VercelDeployResult {
  const parsed = VercelDeployConfigSchema.parse(config);

  const args = ["npx", "vercel", "--yes", "--token", parsed.token];
  if (parsed.teamId) {
    args.push("--scope", parsed.teamId);
  }
  if (parsed.projectName) {
    args.push("--name", parsed.projectName);
  }

  const stdout = execSync(args.join(" "), {
    cwd: parsed.siteDir,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  const url = parseDeploymentUrl(stdout);
  const deploymentId = parseDeploymentId(url);

  return {
    url,
    projectId: parsed.projectName ?? "unknown",
    deploymentId,
  };
}

/**
 * Add a custom domain to an existing Vercel project.
 */
export async function setCustomDomain(
  projectId: string,
  domain: string,
  token: string,
): Promise<void> {
  const url = `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains`;

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: domain }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new VercelDeployError(
      `Failed to set custom domain "${domain}": ${response.status} — ${body}`,
      response.status,
    );
  }
}

/**
 * Check the status of a Vercel deployment.
 */
export async function getDeploymentStatus(
  deploymentId: string,
  token: string,
): Promise<VercelDeploymentStatus> {
  const url = `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new VercelDeployError(
      `Failed to get deployment status: ${response.status} — ${body}`,
      response.status,
    );
  }

  const data = (await response.json()) as {
    id: string;
    state: string;
    url: string | null;
    readyState: string;
  };

  return {
    id: data.id,
    state: data.state,
    url: data.url,
    readyState: data.readyState,
  };
}
