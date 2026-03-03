/**
 * Shared types for the Demo Site Factory pipeline.
 */

/** Status of a business lead through the pipeline */
export type LeadStatus =
  | "lead"
  | "demo_generated"
  | "demo_sent"
  | "purchased"
  | "deployed";

/** A business lead from Google Places or manual entry */
export interface BusinessLead {
  /** Unique identifier */
  id: string;
  /** Google Places ID (if sourced from API) */
  placeId?: string;
  /** Business name */
  name: string;
  /** Phone number */
  phone?: string;
  /** Street address */
  address: string;
  /** City */
  city: string;
  /** State abbreviation */
  state: string;
  /** ZIP code */
  zip: string;
  /** Industry category */
  industry: Industry;
  /** Services offered */
  services: string[];
  /** Business hours */
  hours?: BusinessHours;
  /** Google rating (1-5) */
  rating?: number;
  /** Number of Google reviews */
  reviewCount?: number;
  /** Pipeline status */
  status: LeadStatus;
  /** Vercel deployment URL (once deployed) */
  demoUrl?: string;
  /** Custom domain (once purchased) */
  customDomain?: string;
  /** ISO timestamp of when the lead was found */
  foundAt: string;
  /** ISO timestamp of last status change */
  updatedAt: string;
}

/** Supported industry categories */
export type Industry =
  | "plumber"
  | "electrician"
  | "hvac"
  | "landscaping"
  | "cleaning"
  | "roofing"
  | "painting"
  | "pest-control"
  | "handyman"
  | "general-contractor";

/** Business hours for each day of the week */
export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

/** Open and close times for a single day */
export interface DayHours {
  open: string;
  close: string;
}

/** Configuration for a site template */
export interface TemplateConfig {
  /** Template identifier */
  name: string;
  /** Display name */
  displayName: string;
  /** Industries this template supports */
  industries: Industry[];
  /** Pages included in this template */
  pages: TemplatePage[];
}

/** A page within a template */
export interface TemplatePage {
  /** Page slug (e.g., "services", "about") */
  slug: string;
  /** Page title */
  title: string;
  /** Whether this page is included by default */
  default: boolean;
}

/** Configuration for deploying a site */
export interface DeployConfig {
  /** Vercel project name */
  projectName: string;
  /** Vercel team ID (optional) */
  teamId?: string;
  /** Custom domain to assign */
  customDomain?: string;
}
