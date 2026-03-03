import { describe, it, expect } from "vitest";
import { mapPlaceToLead, mapPlacesToLeads, generateSlugId, parseAddress } from "./lead-mapper.js";
import { deduplicateLeads, buildFilename } from "./storage.js";
import { filterWithoutWebsite } from "./google-places.js";
import type { PlaceResult } from "./google-places.js";
import type { BusinessLead } from "@demo-site-factory/types";

function makePlaceResult(overrides: Partial<PlaceResult> = {}): PlaceResult {
  return {
    id: "ChIJtest123",
    displayName: { text: "Test Plumbing Co", languageCode: "en" },
    formattedAddress: "1234 Main St, Denver, CO 80202, USA",
    nationalPhoneNumber: "(555) 123-4567",
    rating: 4.5,
    userRatingCount: 25,
    ...overrides,
  };
}

function makeLead(overrides: Partial<BusinessLead> = {}): BusinessLead {
  return {
    id: "test-plumbing-co",
    placeId: "ChIJtest123",
    name: "Test Plumbing Co",
    phone: "(555) 123-4567",
    address: "1234 Main St",
    city: "Denver",
    state: "CO",
    zip: "80202",
    industry: "plumber",
    services: [],
    rating: 4.5,
    reviewCount: 25,
    status: "lead",
    foundAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("lead-mapper", () => {
  describe("generateSlugId", () => {
    it("should convert a business name to a slug", () => {
      expect(generateSlugId("Mike's Plumbing & Drain")).toBe("mikes-plumbing-drain");
    });

    it("should handle names with special characters", () => {
      expect(generateSlugId("A+ Heating & Cooling LLC")).toBe("a-heating-cooling-llc");
    });

    it("should trim leading and trailing hyphens", () => {
      expect(generateSlugId("  --Test Business--  ")).toBe("test-business");
    });
  });

  describe("parseAddress", () => {
    it("should parse a full US address", () => {
      const result = parseAddress("1234 Main St, Denver, CO 80202, USA");
      expect(result).toEqual({
        address: "1234 Main St",
        city: "Denver",
        state: "CO",
        zip: "80202",
      });
    });

    it("should parse an address without USA suffix", () => {
      const result = parseAddress("456 Oak Ave, Boulder, CO 80301");
      expect(result).toEqual({
        address: "456 Oak Ave",
        city: "Boulder",
        state: "CO",
        zip: "80301",
      });
    });

    it("should handle city and state only", () => {
      const result = parseAddress("Denver, CO 80202");
      expect(result).toEqual({
        address: "",
        city: "Denver",
        state: "CO",
        zip: "80202",
      });
    });

    it("should handle empty string", () => {
      const result = parseAddress("");
      expect(result).toEqual({
        address: "",
        city: "",
        state: "",
        zip: "",
      });
    });

    it("should handle multi-part street addresses", () => {
      const result = parseAddress("Suite 200, 1234 Main St, Denver, CO 80202, USA");
      expect(result).toEqual({
        address: "Suite 200, 1234 Main St",
        city: "Denver",
        state: "CO",
        zip: "80202",
      });
    });
  });

  describe("mapPlaceToLead", () => {
    it("should map a place result to a business lead", () => {
      const place = makePlaceResult();
      const lead = mapPlaceToLead(place, "plumber");

      expect(lead.id).toBe("test-plumbing-co");
      expect(lead.placeId).toBe("ChIJtest123");
      expect(lead.name).toBe("Test Plumbing Co");
      expect(lead.phone).toBe("(555) 123-4567");
      expect(lead.address).toBe("1234 Main St");
      expect(lead.city).toBe("Denver");
      expect(lead.state).toBe("CO");
      expect(lead.zip).toBe("80202");
      expect(lead.industry).toBe("plumber");
      expect(lead.services).toEqual([]);
      expect(lead.rating).toBe(4.5);
      expect(lead.reviewCount).toBe(25);
      expect(lead.status).toBe("lead");
      expect(lead.foundAt).toBeDefined();
      expect(lead.updatedAt).toBeDefined();
    });

    it("should handle missing optional fields", () => {
      const place = makePlaceResult({
        nationalPhoneNumber: undefined,
        rating: undefined,
        userRatingCount: undefined,
        formattedAddress: undefined,
      });
      const lead = mapPlaceToLead(place, "electrician");

      expect(lead.phone).toBeUndefined();
      expect(lead.rating).toBeUndefined();
      expect(lead.reviewCount).toBeUndefined();
      expect(lead.address).toBe("");
    });
  });

  describe("mapPlacesToLeads", () => {
    it("should map multiple places", () => {
      const places = [
        makePlaceResult({ id: "a", displayName: { text: "Biz A" } }),
        makePlaceResult({ id: "b", displayName: { text: "Biz B" } }),
      ];
      const leads = mapPlacesToLeads(places, "plumber");

      expect(leads).toHaveLength(2);
      expect(leads[0].placeId).toBe("a");
      expect(leads[1].placeId).toBe("b");
    });
  });
});

describe("storage", () => {
  describe("deduplicateLeads", () => {
    it("should merge leads and remove duplicates by placeId", () => {
      const existing = [
        makeLead({ placeId: "place-1", name: "Business A" }),
        makeLead({ placeId: "place-2", name: "Business B" }),
      ];
      const incoming = [
        makeLead({ placeId: "place-2", name: "Business B Updated" }),
        makeLead({ placeId: "place-3", name: "Business C" }),
      ];

      const result = deduplicateLeads(existing, incoming);

      expect(result).toHaveLength(3);
      // Existing lead kept (not updated)
      expect(result.find((l) => l.placeId === "place-2")?.name).toBe("Business B");
      // New lead added
      expect(result.find((l) => l.placeId === "place-3")?.name).toBe("Business C");
    });

    it("should deduplicate by id when placeId is absent", () => {
      const existing = [makeLead({ id: "biz-a", placeId: undefined, name: "Biz A" })];
      const incoming = [
        makeLead({ id: "biz-a", placeId: undefined, name: "Biz A v2" }),
        makeLead({ id: "biz-b", placeId: undefined, name: "Biz B" }),
      ];

      const result = deduplicateLeads(existing, incoming);

      expect(result).toHaveLength(2);
      expect(result.find((l) => l.id === "biz-a")?.name).toBe("Biz A");
    });

    it("should handle empty existing array", () => {
      const incoming = [makeLead({ placeId: "place-1" }), makeLead({ placeId: "place-2" })];

      const result = deduplicateLeads([], incoming);

      expect(result).toHaveLength(2);
    });

    it("should handle empty incoming array", () => {
      const existing = [makeLead({ placeId: "place-1" })];

      const result = deduplicateLeads(existing, []);

      expect(result).toHaveLength(1);
    });
  });

  describe("buildFilename", () => {
    it("should generate a kebab-case filename", () => {
      expect(buildFilename("Denver", "CO", "plumber")).toBe("denver-co-plumber.json");
    });

    it("should handle multi-word cities", () => {
      expect(buildFilename("Colorado Springs", "CO", "hvac")).toBe("colorado-springs-co-hvac.json");
    });

    it("should handle hyphenated industries", () => {
      expect(buildFilename("Denver", "CO", "pest-control")).toBe("denver-co-pest-control.json");
    });
  });
});

describe("google-places", () => {
  describe("filterWithoutWebsite", () => {
    it("should filter out places that have a website", () => {
      const places = [
        makePlaceResult({ id: "a", websiteUri: "https://example.com" }),
        makePlaceResult({ id: "b", websiteUri: undefined }),
        makePlaceResult({ id: "c", websiteUri: "" }),
        makePlaceResult({ id: "d" }),
      ];

      // Remove websiteUri from place "d" explicitly
      delete (places[3] as Record<string, unknown>).websiteUri;

      const result = filterWithoutWebsite(places);

      expect(result).toHaveLength(3);
      expect(result.map((p) => p.id)).toEqual(["b", "c", "d"]);
    });

    it("should return all places when none have websites", () => {
      const places = [
        makePlaceResult({ id: "a", websiteUri: undefined }),
        makePlaceResult({ id: "b", websiteUri: undefined }),
      ];

      const result = filterWithoutWebsite(places);

      expect(result).toHaveLength(2);
    });

    it("should return empty array when all have websites", () => {
      const places = [
        makePlaceResult({ id: "a", websiteUri: "https://a.com" }),
        makePlaceResult({ id: "b", websiteUri: "https://b.com" }),
      ];

      const result = filterWithoutWebsite(places);

      expect(result).toHaveLength(0);
    });
  });
});
