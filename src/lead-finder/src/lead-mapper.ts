import type { BusinessLead, BusinessHours, Industry } from "@demo-site-factory/types";
import type { PlaceResult } from "./google-places.js";

/**
 * Maps an array of Google Places API results to BusinessLead objects.
 */
export function mapPlacesToLeads(places: PlaceResult[], industry: Industry): BusinessLead[] {
  return places.map((place) => mapPlaceToLead(place, industry));
}

/**
 * Maps a single Google Places API result to a BusinessLead.
 */
export function mapPlaceToLead(place: PlaceResult, industry: Industry): BusinessLead {
  const now = new Date().toISOString();
  const name = place.displayName.text;
  const { address, city, state, zip } = parseAddress(place.formattedAddress ?? "");

  return {
    id: generateSlugId(name),
    placeId: place.id,
    name,
    phone: place.nationalPhoneNumber,
    address,
    city,
    state,
    zip,
    industry,
    services: [],
    hours: mapOpeningHours(place.regularOpeningHours),
    rating: place.rating,
    reviewCount: place.userRatingCount,
    status: "lead",
    foundAt: now,
    updatedAt: now,
  };
}

/**
 * Generates a URL-safe slug ID from a business name.
 * E.g. "Mike's Plumbing & Drain" -> "mikes-plumbing-drain"
 */
export function generateSlugId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parses a formatted US address string into components.
 *
 * Expected formats:
 *   "1234 Main St, Denver, CO 80202, USA"
 *   "1234 Main St, Denver, CO 80202"
 *   "Denver, CO 80202"
 */
export function parseAddress(formattedAddress: string): {
  address: string;
  city: string;
  state: string;
  zip: string;
} {
  const parts = formattedAddress.split(",").map((s) => s.trim());

  // Remove trailing "USA" or "United States" part
  const cleaned = parts.filter((p) => p !== "USA" && p !== "United States");

  if (cleaned.length >= 3) {
    // "1234 Main St", "Denver", "CO 80202"
    const address = cleaned.slice(0, cleaned.length - 2).join(", ");
    const city = cleaned[cleaned.length - 2];
    const stateZip = cleaned[cleaned.length - 1];
    const { state, zip } = parseStateZip(stateZip);

    return { address, city, state, zip };
  }

  if (cleaned.length === 2) {
    // "Denver", "CO 80202"
    const city = cleaned[0];
    const { state, zip } = parseStateZip(cleaned[1]);

    return { address: "", city, state, zip };
  }

  if (cleaned.length === 1) {
    const { state, zip } = parseStateZip(cleaned[0]);

    return { address: "", city: "", state, zip };
  }

  return { address: "", city: "", state: "", zip: "" };
}

/**
 * Parses a "CO 80202" style string into state and zip.
 */
function parseStateZip(stateZip: string): { state: string; zip: string } {
  const match = stateZip.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);

  if (match) {
    return { state: match[1], zip: match[2] };
  }

  // Fallback: might just be a state code
  const stateMatch = stateZip.match(/^([A-Z]{2})$/);

  if (stateMatch) {
    return { state: stateMatch[1], zip: "" };
  }

  return { state: stateZip, zip: "" };
}

const DAY_NAMES: Record<number, keyof BusinessHours> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * Maps Google Places opening hours periods to our BusinessHours format.
 */
function mapOpeningHours(openingHours?: {
  periods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;
}): BusinessHours | undefined {
  if (!openingHours?.periods) {
    return undefined;
  }

  const hours: BusinessHours = {};

  for (const period of openingHours.periods) {
    const dayName = DAY_NAMES[period.open.day];

    if (!dayName) {
      continue;
    }

    const openTime = formatTime(period.open.hour, period.open.minute);
    const closeTime = period.close
      ? formatTime(period.close.hour, period.close.minute)
      : "11:59 PM";

    hours[dayName] = { open: openTime, close: closeTime };
  }

  return Object.keys(hours).length > 0 ? hours : undefined;
}

/**
 * Formats hour and minute into a human-readable time string like "8:00 AM".
 */
function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");

  return `${displayHour}:${displayMinute} ${period}`;
}
