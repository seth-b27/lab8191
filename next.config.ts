import type { NextConfig } from "next";

//  NOTE ON assync redirect() func:

//  so, before, visiting a bare category url (e.g. /simulation) used to redirect to its
//  first experiment (that is /simulation/falling-letter) via redirect() inside
//  app/[category]/page.tsx. That page is a serverless function, and
//  vercel's dashboard (observability -> functions) eventually showed it with a 50% cold
//  start rate and ~240ms average active CPU per invocation, just to run a
//  lookup + redirect. 
//  First-time visits to any category noticeably paused on the url bar before landing on the experiment.

//  Declaring the same redirects here means vercel's edge routing layer
//  resolves them from a static rule at deploy time, with no function
//  invocation, so cold starts should not be the case anymore. (static redirect)

//  MAINTENANCE: 
//  /app/[category]/page.tsx's own redirect()/notFound() logic
//  is left in place as a fallback (e.g. a category added to CATEGORY_META
//  before this list is updated), it should rarely, if ever, actually run
//  for the categories listed below. 
//  we may update this literal when:
//    - a new category is added
//    - an existing category's experiments array is reordered such that a
//      different experiment becomes index 0

const FIRST_SLUG_BY_CATEGORY: Record<string, string> = {
  cursor: 'trail-fire',
  simulation: 'falling-letter',
  typography: 'typographic-annotation',
  others: 'film-grain'
};

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https', hostname: 'images.unsplash.com'
      }
    ]
  },
  async redirects() {
    return Object.entries(FIRST_SLUG_BY_CATEGORY).map(([category, slug])=> ({
      source: `/${category}`,
      destination: `/${category}/${slug}`,
      permanent: false
    }))  
  }
};

export default nextConfig;


