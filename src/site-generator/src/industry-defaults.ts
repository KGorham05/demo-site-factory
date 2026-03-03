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
  /** Hero subtitle template - use {City}, {Industry}, {Years}, {ServicePhrase} */
  heroSubtitle: string;
  /** Short phrase describing service range (e.g., "leaky faucets to full remodels") */
  servicePhrase: string;
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
    heroSubtitle:
      "Licensed & insured plumbing professionals serving {City} and surrounding areas for over {Years} years. From leaky faucets to full remodels — we do it all.",
    servicePhrase: "leaky faucets to full remodels",
    services: [
      {
        name: "Repairs & Maintenance",
        description:
          "Fast, reliable plumbing repairs for leaky faucets, running toilets, and everything in between. We keep your home's plumbing running smoothly.",
      },
      {
        name: "Drain Cleaning",
        description:
          "Professional drain cleaning to restore full flow to your sinks, showers, and main sewer lines. We use advanced equipment to clear even the toughest blockages.",
      },
      {
        name: "Water Heater Services",
        description:
          "Expert installation, repair, and maintenance of tank and tankless water heaters. We help you choose the right system for your home and budget.",
      },
      {
        name: "Bathroom Remodeling",
        description:
          "Transform your bathroom with updated fixtures, modern tile, and improved layouts. We handle every detail from design to final installation.",
      },
      {
        name: "Pipe Replacement",
        description:
          "Complete pipe replacement and repiping services for aging or damaged plumbing. We use durable, long-lasting materials to protect your home for decades.",
      },
      {
        name: "New Construction",
        description:
          "Full-service plumbing for new builds and major renovations. From rough-in to finish, our licensed plumbers ensure code-compliant, reliable installations.",
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
      {
        author: "Angela T.",
        text: "Had our entire bathroom remodeled and the plumbing work was flawless. On time, on budget, and the team was a pleasure to work with.",
      },
    ],
  },
  electrician: {
    displayName: "Electrical",
    taglineTemplate: "{City}'s Trusted Electrical Experts",
    heroSubtitle:
      "Licensed & insured electrical professionals serving {City} and surrounding areas for over {Years} years. From panel upgrades to smart home wiring — we do it all.",
    servicePhrase: "panel upgrades to smart home wiring",
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
      {
        name: "EV Charger Installation",
        description:
          "Professional electric vehicle charger installation for your home. We handle permitting, wiring, and setup so you can charge conveniently in your garage.",
      },
      {
        name: "Generator Installation",
        description:
          "Keep your home powered during outages with a professionally installed standby generator. We size, install, and maintain systems for whole-home backup.",
      },
      {
        name: "Smoke & Carbon Monoxide Detectors",
        description:
          "Ensure your family's safety with properly installed and connected smoke and carbon monoxide detectors. We bring your home up to current code requirements.",
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
      {
        author: "Rachel S.",
        text: "Had an EV charger installed in our garage and the whole process was seamless. They handled the permit and everything. Highly recommend!",
      },
    ],
  },
  hvac: {
    displayName: "HVAC",
    taglineTemplate: "{City}'s Trusted HVAC Experts",
    heroSubtitle:
      "Licensed & insured HVAC professionals serving {City} and surrounding areas for over {Years} years. From AC installs to furnace repairs — we do it all.",
    servicePhrase: "AC installs to furnace repairs",
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
      {
        name: "Duct Cleaning & Sealing",
        description:
          "Improve indoor air quality and system efficiency with professional duct cleaning and sealing. We remove dust, debris, and seal leaks for optimal airflow.",
      },
      {
        name: "Heat Pump Services",
        description:
          "Energy-efficient heat pump installation, repair, and maintenance. We help you save on energy costs while keeping your home comfortable year-round.",
      },
      {
        name: "Indoor Air Quality",
        description:
          "Breathe easier with our indoor air quality solutions including air purifiers, humidifiers, and ventilation systems tailored to your home.",
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
      {
        author: "Susan L.",
        text: "Had our ducts cleaned and sealed and noticed an immediate difference in air quality and our energy bill. Wish we had done this sooner!",
      },
    ],
  },
  landscaping: {
    displayName: "Landscaping",
    taglineTemplate: "{City}'s Trusted Landscaping Experts",
    heroSubtitle:
      "Licensed & insured landscaping professionals serving {City} and surrounding areas for over {Years} years. From lawn care to full outdoor renovations — we do it all.",
    servicePhrase: "lawn care to full outdoor renovations",
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
      {
        name: "Irrigation Systems",
        description:
          "Custom sprinkler and drip irrigation design, installation, and repair. We keep your landscape watered efficiently and your water bill low.",
      },
      {
        name: "Hardscaping & Patios",
        description:
          "Beautiful patios, walkways, retaining walls, and outdoor living spaces built with quality materials and expert craftsmanship.",
      },
      {
        name: "Seasonal Cleanup",
        description:
          "Comprehensive spring and fall cleanup services including leaf removal, bed preparation, mulching, and winterization to keep your property looking great year-round.",
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
      {
        author: "Maria G.",
        text: "They installed a beautiful patio and irrigation system for us. The whole yard feels like a retreat now. Outstanding work!",
      },
    ],
  },
  cleaning: {
    displayName: "Cleaning",
    taglineTemplate: "{City}'s Trusted Cleaning Experts",
    heroSubtitle:
      "Licensed & insured cleaning professionals serving {City} and surrounding areas for over {Years} years. From deep cleans to recurring service — we do it all.",
    servicePhrase: "deep cleans to recurring service",
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
      {
        name: "Office & Commercial Cleaning",
        description:
          "Professional cleaning for offices, retail spaces, and commercial properties. We keep your workspace clean, healthy, and inviting for employees and customers.",
      },
      {
        name: "Carpet & Upholstery Cleaning",
        description:
          "Deep carpet and upholstery cleaning that removes stains, allergens, and odors. We use professional-grade equipment for a thorough, lasting clean.",
      },
      {
        name: "Post-Construction Cleaning",
        description:
          "Detailed cleanup after renovations or new construction. We remove dust, debris, and residue so your space is move-in ready.",
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
      {
        author: "Emily R.",
        text: "Hired them for a post-construction cleanup and they were incredible. Every surface was spotless. Would not hesitate to call them again.",
      },
    ],
  },
  roofing: {
    displayName: "Roofing",
    taglineTemplate: "{City}'s Trusted Roofing Experts",
    heroSubtitle:
      "Licensed & insured roofing professionals serving {City} and surrounding areas for over {Years} years. From repairs to full replacements — we do it all.",
    servicePhrase: "repairs to full replacements",
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
      {
        name: "Gutter Installation & Repair",
        description:
          "Protect your home's foundation with professionally installed gutters and downspouts. We also repair and clean existing gutter systems.",
      },
      {
        name: "Storm Damage Restoration",
        description:
          "Fast response to storm damage including emergency tarping, insurance claim assistance, and full restoration to get your home protected again.",
      },
      {
        name: "Flat Roof Systems",
        description:
          "Specialized flat roof installation and repair for commercial and residential properties. We work with TPO, EPDM, and modified bitumen systems.",
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
      {
        author: "Janet P.",
        text: "Great experience from inspection to completion. They found issues our previous roofer missed and fixed everything at a fair price.",
      },
    ],
  },
  painting: {
    displayName: "Painting",
    taglineTemplate: "{City}'s Trusted Painting Experts",
    heroSubtitle:
      "Licensed & insured painting professionals serving {City} and surrounding areas for over {Years} years. From interior refreshes to full exterior makeovers — we do it all.",
    servicePhrase: "interior refreshes to full exterior makeovers",
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
      {
        name: "Deck & Fence Staining",
        description:
          "Protect and beautify your outdoor wood surfaces with professional staining and sealing. We restore decks, fences, and pergolas to like-new condition.",
      },
      {
        name: "Wallpaper Removal & Installation",
        description:
          "Expert wallpaper removal without damage to your walls, plus professional installation of new wallpaper and wall coverings for a fresh look.",
      },
      {
        name: "Color Consultation",
        description:
          "Not sure which colors to choose? Our professional color consultation helps you select the perfect palette for your home's style and lighting.",
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
      {
        author: "Tina V.",
        text: "The color consultation was a game-changer. They helped us pick the perfect shades and the finished result is absolutely beautiful.",
      },
    ],
  },
  "pest-control": {
    displayName: "Pest Control",
    taglineTemplate: "{City}'s Trusted Pest Control Experts",
    heroSubtitle:
      "Licensed & insured pest control professionals serving {City} and surrounding areas for over {Years} years. From ants to termites — we do it all.",
    servicePhrase: "ants to termites",
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
      {
        name: "Mosquito & Tick Control",
        description:
          "Reclaim your yard with professional mosquito and tick treatments. We apply barrier sprays and targeted solutions to keep biting pests at bay.",
      },
      {
        name: "Bed Bug Treatment",
        description:
          "Thorough bed bug elimination using heat treatment and targeted applications. We inspect, treat, and follow up to ensure complete eradication.",
      },
      {
        name: "Wildlife Removal",
        description:
          "Humane removal of raccoons, squirrels, bats, and other wildlife from your home. We relocate animals safely and seal entry points to prevent return.",
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
      {
        author: "Kelly D.",
        text: "Called them for a mosquito problem in our backyard and the difference after treatment was night and day. We can actually enjoy our patio again!",
      },
    ],
  },
  handyman: {
    displayName: "Handyman",
    taglineTemplate: "{City}'s Trusted Handyman Experts",
    heroSubtitle:
      "Licensed & insured handyman professionals serving {City} and surrounding areas for over {Years} years. From small repairs to big projects — we do it all.",
    servicePhrase: "small repairs to big projects",
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
      {
        name: "Door & Window Installation",
        description:
          "Professional installation and replacement of interior and exterior doors, windows, and hardware. We ensure a perfect fit and smooth operation.",
      },
      {
        name: "Tile & Flooring Repair",
        description:
          "Fix cracked tiles, replace damaged flooring, and install new surfaces. We work with ceramic, vinyl, laminate, and hardwood to restore your floors.",
      },
      {
        name: "Pressure Washing",
        description:
          "Restore your home's exterior, driveway, deck, and patio with professional pressure washing. We remove dirt, mildew, and stains for a fresh look.",
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
      {
        author: "Paul E.",
        text: "They installed a new front door and repaired our deck railing in the same visit. Great quality work and very reasonable pricing.",
      },
    ],
  },
  "general-contractor": {
    displayName: "General Contracting",
    taglineTemplate: "{City}'s Trusted General Contracting Experts",
    heroSubtitle:
      "Licensed & insured general contracting professionals serving {City} and surrounding areas for over {Years} years. From kitchen remodels to home additions — we do it all.",
    servicePhrase: "kitchen remodels to home additions",
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
      {
        name: "Basement Finishing",
        description:
          "Turn your unfinished basement into valuable living space. We handle framing, electrical, plumbing, flooring, and finishing for a complete transformation.",
      },
      {
        name: "Deck & Porch Construction",
        description:
          "Custom deck and porch design and construction using premium materials. We build outdoor living spaces that enhance your home's value and enjoyment.",
      },
      {
        name: "Whole-Home Renovation",
        description:
          "Comprehensive renovation services that transform your entire home. We coordinate all trades and manage every detail from demolition to final walkthrough.",
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
      {
        author: "Monica J.",
        text: "They finished our basement and it is now our favorite room in the house. Incredible attention to detail and the project was completed on schedule.",
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
