/**
 * Default data for each home-services industry.
 * Provides tagline templates, common services with descriptions,
 * and placeholder testimonial templates.
 */

import type { Industry } from "@demo-site-factory/types";

export interface IndustryDefaults {
  /** Nicely formatted industry name (e.g., "Plumbing") */
  displayName: string;
  /** Tagline template - use {City} and {Industry} as placeholders */
  taglineTemplate: string;
  /** Default services with descriptions */
  services: ServiceDefault[];
  /** Placeholder testimonial templates */
  testimonials: TestimonialDefault[];
}

export interface ServiceDefault {
  name: string;
  description: string;
}

export interface TestimonialDefault {
  author: string;
  text: string;
}

const INDUSTRY_MAP: Record<Industry, IndustryDefaults> = {
  plumber: {
    displayName: "Plumbing",
    taglineTemplate: "{City}'s Trusted Plumbing Experts",
    services: [
      {
        name: "Emergency Plumbing Repair",
        description:
          "Fast, reliable emergency plumbing services available when you need them most. We handle burst pipes, major leaks, and sewage backups with urgency and professionalism.",
      },
      {
        name: "Drain Cleaning & Unclogging",
        description:
          "Professional drain cleaning to restore full flow to your sinks, showers, and main sewer lines. We use advanced equipment to clear even the toughest blockages.",
      },
      {
        name: "Water Heater Installation & Repair",
        description:
          "Expert installation and repair of tank and tankless water heaters. We help you choose the right system for your home and budget.",
      },
    ],
    testimonials: [
      {
        author: "Sarah M.",
        text: "They came out the same day and fixed our leaky faucet in under an hour. Professional, friendly, and fairly priced. Highly recommend!",
      },
      {
        author: "James R.",
        text: "We had a major pipe burst on a Sunday evening and they were at our door within 30 minutes. Saved us from serious water damage. These guys are the best!",
      },
    ],
  },
  electrician: {
    displayName: "Electrical",
    taglineTemplate: "{City}'s Trusted Electrical Experts",
    services: [
      {
        name: "Electrical Panel Upgrades",
        description:
          "Upgrade your electrical panel to meet modern safety standards and power demands. We handle 100-amp to 400-amp upgrades for homes of all sizes.",
      },
      {
        name: "Wiring & Rewiring",
        description:
          "Complete residential wiring and rewiring services. Whether you are building new or updating an older home, our licensed electricians ensure safe, code-compliant work.",
      },
      {
        name: "Lighting Installation",
        description:
          "Transform your home with professional lighting installation. From recessed lights to outdoor landscape lighting, we bring your vision to life.",
      },
    ],
    testimonials: [
      {
        author: "Linda K.",
        text: "They upgraded our entire panel and added outlets to our kitchen. Clean work, great communication, and done ahead of schedule. Could not be happier!",
      },
      {
        author: "Tom W.",
        text: "Professional, punctual, and reasonably priced. They installed recessed lighting throughout our home and it looks amazing.",
      },
    ],
  },
  hvac: {
    displayName: "HVAC",
    taglineTemplate: "{City}'s Trusted HVAC Experts",
    services: [
      {
        name: "AC Installation & Replacement",
        description:
          "Stay cool with expert air conditioning installation and replacement. We help you select the right system for your home's size and your budget.",
      },
      {
        name: "Heating System Repair",
        description:
          "Keep your family warm with prompt furnace and heating system repair. Our certified technicians diagnose and fix issues quickly.",
      },
      {
        name: "Preventive Maintenance",
        description:
          "Extend the life of your HVAC system with regular maintenance. Our tune-up service improves efficiency and prevents costly breakdowns.",
      },
    ],
    testimonials: [
      {
        author: "Karen D.",
        text: "They installed a new AC system in our home and the difference is incredible. The team was professional and cleaned up after themselves. Great experience!",
      },
      {
        author: "Mike P.",
        text: "Our furnace stopped working on the coldest night of the year. They came out at 10 PM and had it running again in no time. True professionals.",
      },
    ],
  },
  landscaping: {
    displayName: "Landscaping",
    taglineTemplate: "{City}'s Trusted Landscaping Experts",
    services: [
      {
        name: "Lawn Care & Maintenance",
        description:
          "Keep your lawn looking its best with our comprehensive maintenance services including mowing, edging, fertilization, and weed control.",
      },
      {
        name: "Landscape Design & Installation",
        description:
          "Transform your outdoor space with custom landscape design. From garden beds to hardscaping, we create beautiful, functional outdoor environments.",
      },
      {
        name: "Tree & Shrub Care",
        description:
          "Professional tree trimming, pruning, and removal services. We keep your trees healthy and your property safe.",
      },
    ],
    testimonials: [
      {
        author: "Patricia H.",
        text: "They completely redesigned our backyard and it looks like something out of a magazine. The attention to detail is remarkable. Love it!",
      },
      {
        author: "David L.",
        text: "Reliable weekly lawn service that keeps our yard looking pristine. They are always on time and do a thorough job every visit.",
      },
    ],
  },
  cleaning: {
    displayName: "Cleaning",
    taglineTemplate: "{City}'s Trusted Cleaning Experts",
    services: [
      {
        name: "Residential Deep Cleaning",
        description:
          "A thorough top-to-bottom cleaning of your home. We tackle every room, every surface, and every corner so you can enjoy a spotless living space.",
      },
      {
        name: "Recurring Cleaning Service",
        description:
          "Weekly, bi-weekly, or monthly cleaning plans customized to your needs. Consistent quality from the same trusted team every visit.",
      },
      {
        name: "Move-In / Move-Out Cleaning",
        description:
          "Make your move stress-free with our detailed move-in or move-out cleaning service. We leave the space sparkling for the next chapter.",
      },
    ],
    testimonials: [
      {
        author: "Jennifer S.",
        text: "My house has never looked this good. They are thorough, efficient, and always leave everything spotless. Best cleaning service in town!",
      },
      {
        author: "Robert A.",
        text: "We use their bi-weekly service and it is worth every penny. Coming home to a clean house is the best feeling. Highly recommend!",
      },
    ],
  },
  roofing: {
    displayName: "Roofing",
    taglineTemplate: "{City}'s Trusted Roofing Experts",
    services: [
      {
        name: "Roof Replacement",
        description:
          "Complete roof replacement with premium materials and expert craftsmanship. We handle shingle, tile, and flat roof systems for lasting protection.",
      },
      {
        name: "Roof Repair",
        description:
          "Fast, effective roof repairs to stop leaks and prevent further damage. From missing shingles to storm damage, we restore your roof's integrity.",
      },
      {
        name: "Roof Inspection",
        description:
          "Comprehensive roof inspections to assess condition and identify potential issues. Get a detailed report and honest recommendations.",
      },
    ],
    testimonials: [
      {
        author: "Barbara C.",
        text: "They replaced our entire roof in two days and it looks fantastic. Fair pricing, quality materials, and a crew that takes pride in their work.",
      },
      {
        author: "Steven N.",
        text: "After a hailstorm damaged our roof, they handled the insurance claim and repairs seamlessly. Professional from start to finish.",
      },
    ],
  },
  painting: {
    displayName: "Painting",
    taglineTemplate: "{City}'s Trusted Painting Experts",
    services: [
      {
        name: "Interior Painting",
        description:
          "Professional interior painting that transforms your living spaces. We handle everything from single accent walls to whole-home color refreshes.",
      },
      {
        name: "Exterior Painting",
        description:
          "Boost your curb appeal with expert exterior painting. We prep, prime, and paint with premium products that withstand the elements.",
      },
      {
        name: "Cabinet Refinishing",
        description:
          "Give your kitchen a fresh look without the cost of replacement. Our cabinet refinishing service delivers a factory-quality finish.",
      },
    ],
    testimonials: [
      {
        author: "Amy T.",
        text: "They painted our entire interior and the results are stunning. Clean lines, great color advice, and they treated our home with respect.",
      },
      {
        author: "Mark G.",
        text: "Our house exterior looks brand new. They did an incredible job with prep work and the paint job is flawless. Will definitely use them again.",
      },
    ],
  },
  "pest-control": {
    displayName: "Pest Control",
    taglineTemplate: "{City}'s Trusted Pest Control Experts",
    services: [
      {
        name: "General Pest Treatment",
        description:
          "Comprehensive pest control for ants, spiders, cockroaches, and other common household pests. We eliminate infestations and prevent them from returning.",
      },
      {
        name: "Termite Inspection & Treatment",
        description:
          "Protect your home from costly termite damage with our inspection and treatment services. We use proven methods to eliminate and prevent termites.",
      },
      {
        name: "Rodent Control",
        description:
          "Effective rodent removal and exclusion services. We seal entry points, set traps, and implement prevention strategies to keep mice and rats out.",
      },
    ],
    testimonials: [
      {
        author: "Nancy F.",
        text: "We had a serious ant problem and they took care of it in one visit. No more ants! They also set up a prevention plan to keep them away.",
      },
      {
        author: "Chris B.",
        text: "Professional and thorough. They found a termite issue we did not even know about and treated it before it caused major damage. Saved us thousands.",
      },
    ],
  },
  handyman: {
    displayName: "Handyman",
    taglineTemplate: "{City}'s Trusted Handyman Experts",
    services: [
      {
        name: "Home Repairs",
        description:
          "From leaky faucets to squeaky doors, we handle all your home repair needs. No job is too small for our skilled handyman team.",
      },
      {
        name: "Furniture Assembly",
        description:
          "Professional assembly of furniture, shelving, and home fixtures. We build it right the first time so you do not have to struggle with instructions.",
      },
      {
        name: "Drywall & Patching",
        description:
          "Expert drywall repair, patching, and finishing. We fix holes, cracks, and water damage to restore your walls to perfect condition.",
      },
    ],
    testimonials: [
      {
        author: "Diane M.",
        text: "We had a whole list of small repairs that had been piling up. They came in and knocked them all out in one afternoon. Fantastic service!",
      },
      {
        author: "Brian J.",
        text: "Reliable, honest, and skilled. They have become our go-to for anything that needs fixing around the house. Can not recommend them enough.",
      },
    ],
  },
  "general-contractor": {
    displayName: "General Contracting",
    taglineTemplate: "{City}'s Trusted General Contracting Experts",
    services: [
      {
        name: "Kitchen Remodeling",
        description:
          "Transform your kitchen with a complete remodel. From design to finish, we handle cabinets, countertops, flooring, and everything in between.",
      },
      {
        name: "Bathroom Renovation",
        description:
          "Upgrade your bathroom with modern fixtures, tile, and layout improvements. We create beautiful, functional spaces tailored to your style.",
      },
      {
        name: "Home Additions",
        description:
          "Expand your living space with a professionally built home addition. We manage the entire project from permits to final walkthrough.",
      },
    ],
    testimonials: [
      {
        author: "Laura W.",
        text: "They remodeled our kitchen and it exceeded every expectation. On time, on budget, and the craftsmanship is superb. We absolutely love it!",
      },
      {
        author: "Greg H.",
        text: "Built a beautiful addition to our home. The crew was professional, clean, and communicative throughout the entire project. Could not be happier.",
      },
    ],
  },
};

/**
 * Get the default data for an industry.
 */
export function getIndustryDefaults(industry: Industry): IndustryDefaults {
  return INDUSTRY_MAP[industry];
}

/**
 * Get the formatted display name for an industry.
 * e.g., "plumber" -> "Plumbing"
 */
export function formatIndustryName(industry: Industry): string {
  return INDUSTRY_MAP[industry].displayName;
}

/**
 * Generate a tagline for a business based on industry and city.
 * e.g., "Denver's Trusted Plumbing Experts"
 */
export function generateTagline(industry: Industry, city: string): string {
  const template = INDUSTRY_MAP[industry].taglineTemplate;
  return template.replace("{City}", city).replace("{Industry}", INDUSTRY_MAP[industry].displayName);
}
