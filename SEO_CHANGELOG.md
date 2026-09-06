# SEO Changelog

Portfolio: https://francisdev.netlify.app/  
Canonical person: Francis Lawrenz Canayon  
Primary positioning: WordPress & WooCommerce Developer  
Audit and implementation date: 2026-09-03

## Status

The repository implementation is complete and validated locally. It has not been deployed from this workspace, so production verification and Google Search Console work remain pending.

Search rankings cannot be guaranteed. The purpose of these changes is to give search engines stronger, consistent evidence about Francis's identity, profession, official portfolio, and public profiles.

## 2026-09-06 portfolio hierarchy and social-preview update

- Preserved the canonical title, description, URL, person entity graph, profile links, crawl files, and single-H1 structure.
- Tightened the hero positioning around WordPress and WooCommerce work without adding keyword repetition.
- Added business-focused challenge, contribution, and qualitative outcome copy to the anchor case study using only existing supported project information.
- Kept all earlier employment and project content in static, crawlable HTML while compressing it visually with accessible disclosures.
- Added a dedicated 1200 × 630 WebP Open Graph / X card with exact name and role text and changed the X card type to `summary_large_image`.
- Updated `dateModified`, `theme-color`, manifest colors, and the sitemap modification date.
- Current local Lighthouse: mobile 96 Performance / 100 Accessibility / 100 Best Practices / 100 SEO; desktop 99 / 100 / 100 / 100.

## 2026-09-04 portfolio redesign

The site was redesigned as a dependency-free static portfolio centered on WordPress and WooCommerce client work. The existing title, description, canonical, Open Graph/Twitter metadata, entity graph, crawl files, anchor URLs, public profiles, contact form identity, experience, education, portrait, and all 27 project screenshot sets were preserved.

The new page keeps one full-name H1, brings selected work near the top, exposes meaningful experience and service copy in static HTML, and adds a lightweight CSS/WebGL development visual with reduced-motion and static fallbacks. Obsolete template libraries and superseded photographic hero files were removed after reference checks. Current implementation and validation details are recorded in `REDESIGN_NOTES.md`.

The 2026-09-04 local mobile Lighthouse run after the cursor-grid and Sora/JetBrains Mono typography enhancements recorded Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 2.1 s, TBT 0 ms, and CLS 0.004. The current refinement results appear above. Production results may vary and remain a post-deploy verification item.

## Baseline

### Search visibility observations

These are non-personalized search samples, not fixed ranking claims. Results can vary by engine, time, device, and location.

- The portfolio was not observed in the sampled results for the exact name `Francis Lawrenz Canayon` or the tested name-plus-profession variations.
- LinkedIn was the clearest result associated with the full name.
- A Southern Innovation Roofing article attributed to Francis also appeared for the exact full name.
- The shorter query `Francis Canayon` showed ambiguity, including unrelated people/content, as well as Francis's LinkedIn and a Stack Overflow result.
- Francis's GitHub and OnlineJobs.ph profiles were accessible, but neither was consistently visible in the sampled exact-name results.
- A sampled `site:francisdev.netlify.app` query did not return the portfolio. Only Google Search Console URL Inspection can determine Google's definitive indexing state.

### Technical and on-page baseline

| Area | Before implementation |
| --- | --- |
| Homepage title | `Francis Portfolio` |
| Meta description | Empty |
| Canonical | Missing |
| Robots directives | No explicit page directive; `/robots.txt` returned 404 |
| Sitemap | `/sitemap.xml` returned 404 |
| Structured data | Missing |
| Social metadata | Open Graph and Twitter/X metadata missing |
| Main heading | Sidebar name was an H1; full name in the hero was an H2 |
| Images | Portfolio images were large PNGs, eagerly loaded, and had empty alt attributes |
| Performance risk | The preloader waited for every image before revealing the page |
| Duplicate URL | Production `/index.html` returned 200 instead of consolidating to `/` |
| Error handling | A missing path correctly returned the custom page with HTTP 404 |
| Accessibility | Icon-only controls/links lacked accessible names; filters were non-semantic list items |

### Measured baseline

| Metric | Baseline |
| --- | --- |
| Homepage indexed | Not currently available; not observed in sampled results |
| Sitemap submitted | Not currently available |
| Exact-name impressions | Not currently available |
| Exact-name clicks | Not currently available |
| Exact-name average position | Not currently available |
| Portfolio observed in sampled search | No |
| LinkedIn observed in sampled search | Yes |
| Lighthouse SEO | 91 |
| Lighthouse Performance | 61 on production; 62 on the comparable local baseline |
| Lighthouse Accessibility | 87 |
| Structured data valid | No implementation existed |
| robots.txt valid | No; production returned 404 |
| Canonical valid | No; missing |

Production Lighthouse baseline: Performance 61, Accessibility 87, Best Practices 100, SEO 91, LCP 95.3 s, 35,561 KiB transferred. The unusually high LCP was largely caused by the full-page preloader waiting for all portfolio images.

For a fair before/after comparison, the original Git revision was also measured on the same local static server used for the optimized page: Performance 62, Accessibility 87, Best Practices 100, SEO 91, LCP 30.9 s, CLS 0.004, 36,230 KiB transferred.

## Implemented changes

### P0 — Crawlability and canonicalization

#### Canonical homepage and duplicate URL redirect

- Issue: no canonical URL was declared and `/index.html` was independently accessible with a 200 response.
- Change: added the absolute HTTPS homepage canonical and an exact forced 301 from `/index.html` to `/`.
- Files: `index.html`, `netlify.toml`.
- Reason: consolidate duplicate URL signals on the production homepage.
- Expected impact: clearer canonical selection and less signal splitting.
- Validation: canonical present in source; Netlify local server returns `301 /index.html -> /`.

#### Crawl files

- Issue: `robots.txt` and `sitemap.xml` returned 404 in production.
- Change: created a crawl-allowing robots file and a valid XML sitemap containing only the canonical, indexable homepage.
- Files: `robots.txt`, `sitemap.xml`.
- Reason: make crawling policy and canonical URL discovery explicit.
- Expected impact: easier discovery and sitemap submission.
- Validation: local responses are 200 with correct content types; `xmllint` passes.

#### Correct not-found behavior

- Issue: the custom 404 needed the same accessibility and brand cleanup as the homepage.
- Change: retained a genuine 404 response, added `noindex, follow`, improved metadata and navigation, removed unused loading code, and intentionally omitted a canonical from the error page.
- File: `404.html`.
- Reason: prevent soft-404 or accidental error-page indexing while helping users recover.
- Expected impact: cleaner index coverage and better error-page usability.
- Validation: a missing path returns HTTP 404 through the Netlify local server; HTML validator reports zero errors/warnings.

### P1 — Personal entity and search snippet

#### Consistent identity and profession

- Issue: the page did not strongly identify the full-name entity or primary specialization.
- Change: made `Francis Lawrenz Canayon` the single H1; positioned `WordPress & WooCommerce Developer` directly beneath it; aligned About, service, footer, social, and project copy around the same truthful description.
- File: `index.html`.
- Reason: connect the official portfolio, canonical person name, accepted short name, and primary profession.
- Expected impact: stronger relevance for exact-name and name-plus-profession searches with less entity ambiguity.
- Validation: one H1; no duplicate IDs; copy reviewed against the repository and public profiles.

#### Title and description

- Issue: the generic title and empty description did not support a useful search snippet.
- Change: added `Francis Lawrenz Canayon | WordPress & WooCommerce Developer` and a 150-character factual description.
- File: `index.html`.
- Reason: clearly state identity and search intent without keyword stuffing.
- Expected impact: stronger relevance and a more useful candidate search snippet.
- Validation: title is 59 characters; description is 150 characters; both match visible page content.

#### Entity graph

- Issue: no machine-readable entity relationships existed.
- Change: added one connected JSON-LD `@graph` containing `Person`, `WebSite`, and `ProfilePage`. The Person includes the full and abbreviated names, portrait, job title, existing public location, verified skills, and `sameAs` links to LinkedIn, GitHub, and OnlineJobs.ph. The website and profile page reference the Person through stable `@id` values.
- File: `index.html`.
- Reason: explicitly describe the person represented by the portfolio and connect verified profiles.
- Expected impact: improved entity reconciliation and semantic clarity.
- Validation: Schema.org validator reports one `ProfilePage` graph with zero errors and zero warnings; JSON parses locally.
- Deliberate omission: `BreadcrumbList` was not added because this remains a genuine single-page site without breadcrumb navigation.

#### Social metadata

- Issue: shared links lacked controlled previews.
- Change: added profile-focused Open Graph fields and Twitter/X card metadata using the optimized real portrait.
- Files: `index.html`, optimized portrait assets.
- Reason: keep shared-title, description, image, URL, and professional identity consistent.
- Expected impact: clearer link previews and stronger brand consistency.

#### Professional profile links

- Issue: icon links were weak identity signals and lacked accessible names.
- Change: retained concise social icons with labels and added visible, descriptive LinkedIn, GitHub, and OnlineJobs.ph profile links.
- Files: `index.html`, `404.html`.
- Reason: create crawlable connections between the portfolio and verified public identities.
- Expected impact: stronger on-site entity corroboration and better accessibility.

### P2 — Content, projects, images, and accessibility

#### Service content

- Issue: WordPress and WooCommerce capabilities were not explained in enough useful visible copy.
- Change: added one on-page `WordPress & WooCommerce Development` section covering WordPress development, WooCommerce support, maintenance/troubleshooting, and performance/hosting using only supported capabilities.
- File: `index.html`.
- Reason: serve prospective clients and support secondary commercial intent without diluting the personal-name objective.
- Expected impact: greater topical relevance and more informative conversion content.
- Deliberate omission: separate service landing pages were not created because the available verified content is not yet distinct enough to justify multiple high-quality indexable pages.

#### Project section

- Issue: project context and controls were weak for people, crawlers, and assistive technology.
- Change: added descriptive project image alt text and headings, improved preview/external-link names, replaced click-only filter list items with buttons, and made available public links safer with `noopener`.
- Files: `index.html`, `assets/js/main.js`, `assets/css/main.css`.
- Reason: make the portfolio understandable and operable while retaining existing public project information.
- Expected impact: improved image relevance, semantics, accessibility, and user engagement.
- Link audit: one confirmed dead destination (`thecornerhouse.ca`) was removed; its project preview remains. Anti-bot 403 responses and LinkedIn's crawler response were treated as inconclusive rather than broken.
- Deliberate omission: thin project/case-study pages were not generated because role, scope, technologies, and outcomes are not yet verified for every project.

#### Image optimization

- Issue: roughly 34 MB of portfolio PNGs loaded eagerly; images lacked useful alternative text and intrinsic dimensions.
- Change: generated 480/800/1200-pixel responsive WebP project images; generated responsive WebP hero and portrait variants; supplied `srcset`, dimensions, decoding hints, meaningful alt text, and native lazy loading for below-the-fold images. The hero remains eager/high-priority because it is the LCP image.
- Files: `index.html`, `404.html`, `assets/img/**`.
- Reason: reduce transfer size and layout uncertainty while improving image accessibility/search context.
- Expected impact: materially better loading performance, LCP, and image semantics.
- Validation: local Lighthouse transfer fell to 937 KiB; all local image references resolve.

#### Semantic and accessible interaction

- Issue: navigation toggles, social/project icons, filters, progress bars, map iframe, and keyboard focus needed accessible names or behavior.
- Change: added a skip link, semantic buttons, state attributes, accessible labels, focus styles, iframe title, reduced-motion support, and consistent heading levels.
- Files: `index.html`, `404.html`, `assets/js/main.js`, `assets/css/main.css`.
- Reason: accessibility quality overlaps with clear semantics, usable navigation, and crawlable content.
- Expected impact: better keyboard/screen-reader use and fewer regressions.
- Validation: Lighthouse Accessibility improved from 87 to 100.

### P3 — Performance and platform resilience

#### Critical rendering path

- Issue: the preloader hid the page until all large images finished; unused libraries and broad font/CSS loading delayed rendering.
- Change: removed the preloader and unused Typed, PureCounter, Swiper, imagesLoaded, and Bootstrap JavaScript loads; limited font weights; loaded noncritical font/AOS/GLightbox styles asynchronously with no-script fallbacks; preloaded the responsive hero.
- Files: `index.html`, `404.html`, `assets/js/main.js`, `assets/css/main.css`.
- Reason: make primary content immediately renderable and reduce unnecessary work.
- Expected impact: substantially lower LCP and page weight.
- Validation: comparable local LCP improved from 30.9 s to 5.6 s; TBT is 0 ms and CLS is 0 in the optimized run.

#### Netlify headers and manifest

- Issue: the site lacked an application manifest and explicit safe response/header policy in the repository.
- Change: added a web manifest, short cache rules for HTML, longer cache rules for versioned/static assets, and conservative security headers.
- Files: `site.webmanifest`, `netlify.toml`, `index.html`.
- Reason: improve installable metadata, repeat-load efficiency, and response hygiene without changing hosting.
- Expected impact: better repeat visits and more predictable production behavior.
- Validation: Netlify local server loads the configuration and applies the redirect/security rules. Production cache behavior must be confirmed after deployment.

#### Repository cleanup

- Issue: large superseded image originals and tracked Finder metadata remained in the deploy bundle.
- Change: removed replaced PNG/JPG assets, unused testimonial/service/logo/favicon images, and `.DS_Store` files; added `.DS_Store` and Netlify's local folder to `.gitignore`.
- Files: `assets/img/**`, `.gitignore`.
- Reason: prevent unused files from being deployed and reduce maintenance noise.
- Expected impact: smaller deploy payload and fewer accidental artifacts.
- Recovery: every deleted tracked file remains recoverable from Git history.

## Performance results

The before/after comparison below uses the same local static serving conditions. Scores are lab measurements and can vary between runs.

| Lighthouse metric | Original local revision | Optimized local revision |
| --- | ---: | ---: |
| Performance | 62 | 70 |
| Accessibility | 87 | 100 |
| Best Practices | 100 | 100 |
| SEO | 91 | 100 |
| First Contentful Paint | 4.2 s | 3.9 s |
| Largest Contentful Paint | 30.9 s | 5.6 s |
| Total Blocking Time | 0 ms | 0 ms |
| Cumulative Layout Shift | 0.004 | 0 |
| Speed Index | 5.5 s | 3.9 s |
| Total transferred | 36,230 KiB | 937 KiB |

This is a 97.4% reduction in the measured transfer size and an 81.9% improvement in measured LCP. The local static server does not represent Netlify's production compression/CDN behavior; rerun Lighthouse after deployment.

## Validation record

| Check | Result |
| --- | --- |
| W3C HTML validation: `index.html` | PASS — 0 errors, 0 warnings |
| W3C HTML validation: `404.html` | PASS — 0 errors, 0 warnings |
| JSON-LD parse | PASS |
| Schema.org validator | PASS — 0 errors, 0 warnings |
| XML parse | PASS |
| Web manifest JSON parse | PASS |
| JavaScript syntax | PASS |
| Duplicate IDs | PASS — none |
| Homepage H1 | PASS — exactly one |
| Local asset references | PASS — none missing |
| Netlify local homepage | PASS — 200 |
| Netlify local `/index.html` | PASS — 301 to `/` |
| Netlify local `robots.txt` | PASS — 200 `text/plain` |
| Netlify local `sitemap.xml` | PASS — 200 `application/xml` |
| Netlify local missing path | PASS — 404 |
| Desktop rendered QA | PASS |
| 390 px mobile rendered QA | PASS |
| 360 px mobile Lighthouse viewport | PASS |
| Browser console audit | PASS — no errors in Lighthouse |
| Git whitespace check | PASS |
| Production post-deploy verification | PENDING |

## Manual follow-up

### Deploy and verify

1. Review and commit the repository changes.
2. Deploy the commit through the existing Netlify workflow.
3. Verify the live homepage, navigation, form, responsive layout, console, source metadata, JSON-LD, `/index.html` redirect, `robots.txt`, `sitemap.xml`, and a missing URL.
4. Rerun production Lighthouse at least three times and record the median mobile result.

### Google Search Console

Search Console was not available in this workspace. After deployment:

1. Open the URL-prefix property for `https://francisdev.netlify.app/` or create/verify it.
2. Inspect the canonical homepage and run **Test live URL**.
3. Request indexing once if the live test succeeds.
4. Submit `https://francisdev.netlify.app/sitemap.xml` and confirm it reaches Success status.
5. Record Page indexing state, Google-selected canonical, crawl state, exact-name impressions/clicks/CTR/average position, and Core Web Vitals.
6. Do not repeatedly request indexing; monitor discovery and coverage instead.

### External profile consistency

No third-party account was changed.

#### LinkedIn

- Keep the full public name `Francis Lawrenz Canayon`.
- Lead the headline/About section with `WordPress & WooCommerce Developer` where accurate.
- Add `https://francisdev.netlify.app/` to Contact info and optionally Featured.
- Use a short description consistent with the site: building, maintaining, troubleshooting, and optimizing WordPress/WooCommerce websites.

#### GitHub

- Prefer the same canonical full name used by the portfolio; decide whether the middle initial in the current profile name should be retained consistently everywhere.
- Replace the generic bio with: `WordPress & WooCommerce Developer helping businesses and agencies build, maintain, troubleshoot, and optimize websites.`
- Keep the portfolio URL on the profile; it is already present.
- Add a profile README and pin the Portfolio repository.
- Set the Portfolio repository description to: `Personal portfolio of Francis Lawrenz Canayon, WordPress and WooCommerce Developer.`
- Set the repository website to `https://francisdev.netlify.app/`.
- Add only relevant topics: `portfolio`, `wordpress`, `woocommerce`, `web-development`, `frontend`, `francis-canayon`.

#### OnlineJobs.ph

- Use `Francis Lawrenz Canayon` as the public display name if the platform permits it.
- Lead the headline with `WordPress & WooCommerce Developer` while retaining other accurate capabilities.
- Add the portfolio URL to any public website/portfolio field available to the account.
- Keep experience wording consistent. The portfolio deliberately says `more than five years`, which remains compatible with the public profile's six-year wording.

## Future content and authority work

### This week

- Deploy and complete every production check above.
- Complete Search Console URL Inspection and sitemap submission.
- Align LinkedIn, GitHub, and OnlineJobs.ph names, descriptions, and portfolio links.

### This month

- Collect verified details for the strongest 3–5 projects: Francis's role, scope, technologies, constraints, work completed, and measurable outcomes that can be substantiated.
- Publish substantial case studies only after those facts are available; link them from the homepage and sitemap.
- Ask public clients/agencies, where permitted, to credit the work with a natural link to the portfolio.
- Monitor exact-name and name-plus-profession queries in Search Console rather than relying on manual rank checks.

### Long term

- Publish useful, experience-based WordPress/WooCommerce articles or case studies when Francis has genuine original material.
- Earn relevant links through profile bios, author pages, project credits, community contributions, and useful technical resources—never purchased or automated links.
- Consider a personal custom domain as a future brand asset, while keeping the current Netlify URL canonical until a carefully redirected migration is intentionally scheduled.

## References used

- Google Search Central: ProfilePage structured data — https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Google Search Central: Build and submit a sitemap — https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Central: Canonical URL consolidation — https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central: Structured data introduction and policies — https://developers.google.com/search/docs/appearance/structured-data and https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Schema.org Person — https://schema.org/Person
- web.dev: Optimize Largest Contentful Paint — https://web.dev/articles/optimize-lcp
- Netlify: Redirect options — https://docs.netlify.com/manage/routing/redirects/redirect-options/
