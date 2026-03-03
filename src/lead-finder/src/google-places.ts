import { z } from "zod";

/**
 * Zod schema for a single place result from the Google Places API (New).
 */
const PlaceResultSchema = z.object({
  id: z.string(),
  displayName: z.object({
    text: z.string(),
    languageCode: z.string().optional(),
  }),
  formattedAddress: z.string().optional(),
  nationalPhoneNumber: z.string().optional(),
  websiteUri: z.string().optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  regularOpeningHours: z
    .object({
      periods: z
        .array(
          z.object({
            open: z.object({
              day: z.number(),
              hour: z.number(),
              minute: z.number(),
            }),
            close: z
              .object({
                day: z.number(),
                hour: z.number(),
                minute: z.number(),
              })
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

/**
 * Zod schema for the full Text Search response.
 */
const TextSearchResponseSchema = z.object({
  places: z.array(PlaceResultSchema).optional(),
});

export type PlaceResult = z.infer<typeof PlaceResultSchema>;
export type TextSearchResponse = z.infer<typeof TextSearchResponseSchema>;

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.location",
].join(",");

export interface SearchOptions {
  /** Free-form text query, e.g. "plumber in Denver CO" */
  textQuery: string;
  /** Google Places included type, e.g. "plumber" */
  includedType?: string;
  /** Search radius in meters */
  radius?: number;
}

/**
 * Searches Google Places API (New) Text Search for businesses matching the
 * given query. Returns only places that do NOT have a website.
 */
export async function searchPlaces(apiKey: string, options: SearchOptions): Promise<PlaceResult[]> {
  const body: Record<string, unknown> = {
    textQuery: options.textQuery,
  };

  if (options.includedType) {
    body.includedType = options.includedType;
  }

  const response = await fetch(PLACES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new PlacesApiError(
      `Google Places API returned ${response.status}: ${errorText}`,
      response.status,
    );
  }

  const json: unknown = await response.json();
  const parsed = TextSearchResponseSchema.parse(json);
  const places = parsed.places ?? [];

  return filterWithoutWebsite(places);
}

/**
 * Filters place results to only those without a website.
 */
export function filterWithoutWebsite(places: PlaceResult[]): PlaceResult[] {
  return places.filter((place) => !place.websiteUri || place.websiteUri.trim() === "");
}

/**
 * Custom error class for Google Places API failures.
 */
export class PlacesApiError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "PlacesApiError";
    this.statusCode = statusCode;
  }
}
