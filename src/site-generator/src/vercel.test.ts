import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createVercelProject,
  deployToVercel,
  getDeploymentStatus,
  parseDeploymentId,
  parseDeploymentUrl,
  setCustomDomain,
  VercelDeployConfigSchema,
  VercelDeployError,
} from "./vercel.js";

// ---------------------------------------------------------------------------
// VercelDeployConfig validation
// ---------------------------------------------------------------------------

describe("VercelDeployConfigSchema", () => {
  it("accepts a valid config with all fields", () => {
    const result = VercelDeployConfigSchema.safeParse({
      siteDir: "/path/to/site",
      token: "my-token-123",
      teamId: "team_abc",
      projectName: "my-project",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.siteDir).toBe("/path/to/site");
      expect(result.data.token).toBe("my-token-123");
      expect(result.data.teamId).toBe("team_abc");
      expect(result.data.projectName).toBe("my-project");
    }
  });

  it("accepts a config with only required fields", () => {
    const result = VercelDeployConfigSchema.safeParse({
      siteDir: "/path/to/site",
      token: "my-token-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.teamId).toBeUndefined();
      expect(result.data.projectName).toBeUndefined();
    }
  });

  it("rejects when siteDir is missing", () => {
    const result = VercelDeployConfigSchema.safeParse({
      token: "my-token-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when token is missing", () => {
    const result = VercelDeployConfigSchema.safeParse({
      siteDir: "/path/to/site",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when siteDir is empty string", () => {
    const result = VercelDeployConfigSchema.safeParse({
      siteDir: "",
      token: "my-token-123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when token is empty string", () => {
    const result = VercelDeployConfigSchema.safeParse({
      siteDir: "/path/to/site",
      token: "",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// URL parsing from Vercel CLI output
// ---------------------------------------------------------------------------

describe("parseDeploymentUrl", () => {
  it("extracts the deployment URL from typical CLI output", () => {
    const stdout = [
      "Vercel CLI 37.14.0",
      "Setting up project...",
      "Uploading [====================] 100%",
      "https://my-project-abc123xyz.vercel.app",
    ].join("\n");

    expect(parseDeploymentUrl(stdout)).toBe("https://my-project-abc123xyz.vercel.app");
  });

  it("extracts URL when there is extra whitespace", () => {
    const stdout = ["Vercel CLI 37.14.0", "  https://demo-site-factory-xyz.vercel.app  "].join(
      "\n",
    );

    expect(parseDeploymentUrl(stdout)).toBe("https://demo-site-factory-xyz.vercel.app");
  });

  it("handles output with multiple URLs and picks the vercel.app one", () => {
    const stdout = [
      "Vercel CLI 37.14.0",
      "Linked to https://vercel.com/team/project",
      "https://my-project-9f8e7d.vercel.app",
      "Ready!",
    ].join("\n");

    expect(parseDeploymentUrl(stdout)).toBe("https://my-project-9f8e7d.vercel.app");
  });

  it("falls back to any https URL if no vercel.app URL found", () => {
    const stdout = ["Vercel CLI 37.14.0", "https://custom-domain.example.com"].join("\n");

    expect(parseDeploymentUrl(stdout)).toBe("https://custom-domain.example.com");
  });

  it("throws VercelDeployError when no URL is found", () => {
    const stdout = "Vercel CLI 37.14.0\nNo deployment output here\n";
    expect(() => parseDeploymentUrl(stdout)).toThrow(VercelDeployError);
    expect(() => parseDeploymentUrl(stdout)).toThrow("Could not parse deployment URL");
  });

  it("throws on empty string", () => {
    expect(() => parseDeploymentUrl("")).toThrow(VercelDeployError);
  });
});

// ---------------------------------------------------------------------------
// Deployment ID parsing
// ---------------------------------------------------------------------------

describe("parseDeploymentId", () => {
  it("extracts the subdomain from a vercel.app URL", () => {
    expect(parseDeploymentId("https://my-project-abc123.vercel.app")).toBe("my-project-abc123");
  });

  it("returns 'unknown' for invalid URLs", () => {
    expect(parseDeploymentId("not-a-url")).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// createVercelProject — mocked fetch
// ---------------------------------------------------------------------------

describe("createVercelProject", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends the correct request and returns project data", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ id: "prj_123", name: "my-site" }),
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const result = await createVercelProject({
      name: "my-site",
      token: "tok_abc",
    });

    expect(result).toEqual({ id: "prj_123", name: "my-site" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v10/projects",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer tok_abc",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "my-site",
          framework: "astro",
          buildCommand: "pnpm build",
          outputDirectory: "dist",
        }),
      }),
    );
  });

  it("includes teamId as query parameter when provided", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ id: "prj_456", name: "team-site" }),
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await createVercelProject({
      name: "team-site",
      token: "tok_abc",
      teamId: "team_xyz",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v10/projects?teamId=team_xyz",
      expect.any(Object),
    );
  });

  it("throws VercelDeployError on non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 403,
      text: async () => '{"error":"Forbidden"}',
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await expect(createVercelProject({ name: "my-site", token: "bad-token" })).rejects.toThrow(
      VercelDeployError,
    );
  });
});

// ---------------------------------------------------------------------------
// setCustomDomain — mocked fetch
// ---------------------------------------------------------------------------

describe("setCustomDomain", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends the correct domain request", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({}),
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await setCustomDomain("prj_123", "example.com", "tok_abc");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v10/projects/prj_123/domains",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer tok_abc",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "example.com" }),
      }),
    );
  });

  it("properly encodes project IDs with special characters", async () => {
    const mockResponse = { ok: true, json: async () => ({}) };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await setCustomDomain("prj/special", "example.com", "tok_abc");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v10/projects/prj%2Fspecial/domains",
      expect.any(Object),
    );
  });

  it("throws VercelDeployError on failure", async () => {
    const mockResponse = {
      ok: false,
      status: 409,
      text: async () => '{"error":"Domain already in use"}',
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await expect(setCustomDomain("prj_123", "example.com", "tok_abc")).rejects.toThrow(
      VercelDeployError,
    );

    await expect(setCustomDomain("prj_123", "example.com", "tok_abc")).rejects.toThrow(
      "Failed to set custom domain",
    );
  });
});

// ---------------------------------------------------------------------------
// getDeploymentStatus — mocked fetch
// ---------------------------------------------------------------------------

describe("getDeploymentStatus", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns deployment status data", async () => {
    const mockData = {
      id: "dpl_abc123",
      state: "READY",
      url: "my-project-abc123.vercel.app",
      readyState: "READY",
    };
    const mockResponse = {
      ok: true,
      json: async () => mockData,
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    const status = await getDeploymentStatus("dpl_abc123", "tok_abc");

    expect(status).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v13/deployments/dpl_abc123",
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer tok_abc",
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("throws VercelDeployError on failure", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      text: async () => '{"error":"Deployment not found"}',
    };
    vi.mocked(globalThis.fetch).mockResolvedValue(mockResponse as Response);

    await expect(getDeploymentStatus("dpl_nonexistent", "tok_abc")).rejects.toThrow(
      VercelDeployError,
    );
  });
});

// ---------------------------------------------------------------------------
// deployToVercel — config validation (we cannot easily test execSync)
// ---------------------------------------------------------------------------

describe("deployToVercel", () => {
  it("throws ZodError when config is invalid", () => {
    expect(() =>
      deployToVercel({
        siteDir: "",
        token: "tok_abc",
      }),
    ).toThrow();
  });

  it("throws ZodError when token is missing", () => {
    expect(() =>
      deployToVercel({
        siteDir: "/some/path",
        token: "",
      }),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// VercelDeployError
// ---------------------------------------------------------------------------

describe("VercelDeployError", () => {
  it("has the correct name and message", () => {
    const err = new VercelDeployError("Something went wrong", 500);
    expect(err.name).toBe("VercelDeployError");
    expect(err.message).toBe("Something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err).toBeInstanceOf(Error);
  });

  it("works without a status code", () => {
    const err = new VercelDeployError("No status");
    expect(err.statusCode).toBeUndefined();
  });
});
