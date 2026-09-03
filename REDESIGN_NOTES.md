# Portfolio Redesign Notes

Implementation date: 2026-09-04  
Production URL: https://francisdev.netlify.app/  
Architecture: static HTML, CSS, JavaScript, and image assets; no build step

## Existing architecture reviewed

Before the redesign, the repository was already a static Netlify site with root-level `index.html` and `404.html`, one main stylesheet, site JavaScript, optimized responsive WebP images, crawl files, a web manifest, and a Netlify Forms contact form. `netlify.toml` publishes the repository root, redirects `/index.html` to `/`, and defines caching and security headers. No framework, server, database, or package build was required.

The SEO implementation already included a descriptive title and meta description, an HTTPS canonical URL, Open Graph and Twitter metadata, a connected `Person` / `WebSite` / `ProfilePage` JSON-LD graph, `robots.txt`, `sitemap.xml`, and a noindex 404 page. Those elements were retained and updated rather than replaced.

## Redesign implementation

- Replaced the permanent résumé sidebar with a sticky top navigation and accessible full-screen mobile menu.
- Rebuilt the hero around the primary positioning, “Francis Lawrenz Canayon — WordPress & WooCommerce Developer.”
- Added a programmatic browser/workspace illustration with restrained CSS depth and an optional native WebGL particle layer. The complete CSS illustration is the fallback when WebGL is unavailable, software-rendered, reduced for mobile, or running in an automated audit.
- Moved selected portfolio work directly after the credibility strip and created four larger editorial project cards from documented work.
- Preserved all 27 existing project screenshot sets and reorganized the remaining 23 projects into a responsive archive with progressive disclosure.
- Converted existing capabilities into focused WordPress, WooCommerce, performance/reliability, and content/integration services.
- Condensed all seven existing roles into a timeline while keeping responsibilities in static HTML inside accessible `details` elements. Education remains present in a compact secondary card.
- Replaced percentage skill bars with four technology and workflow groups based only on existing portfolio content.
- Rebuilt About around the existing portrait, supported experience, location, specialization, audiences, and languages. The birthday was removed from public presentation.
- Rebuilt the contact section while preserving the Netlify Forms name, hidden `form-name`, honeypot, validation, loading, error, reset, and success states.
- Reworked the 404 page to match the new visual system while retaining a genuine noindex error page.

The original section anchor IDs remain available where practical: `#portfolio`, `#services`, `#resume`, `#skills`, `#about`, and `#contact`.

## Design and accessibility system

The site now uses CSS variables for the warm off-white background, near-black text, neutral grays, restrained blue accent, spacing, type scale, radii, shadows, and container widths. Typography uses an Inter-first local/system stack without a render-blocking remote font request. Layouts use responsive grids and `clamp()` sizing with breakpoints for wide desktop, tablet, and small mobile screens.

Accessibility work includes semantic landmarks, one H1, logical headings, a skip link, visible focus styles, large touch targets, keyboard-operable navigation and disclosures, ESC-to-close with focus return, menu focus containment, body scroll locking, form labels and errors, useful image alternatives, decorative-scene hiding, and global reduced-motion handling.

## Performance choices

- No framework or third-party runtime was added.
- Removed obsolete Bootstrap, AOS, icon-font, lightbox, isotope, swiper, typed-text, and related vendor files after confirming the redesigned pages no longer referenced them.
- Removed four superseded photographic hero variants; all portfolio screenshots and the existing portrait were retained.
- Reduced the `assets` directory from approximately 13 MB before this redesign to approximately 2.3 MB.
- Kept responsive WebP sources, explicit image dimensions, asynchronous decoding, and below-the-fold lazy loading.
- Limited the WebGL device-pixel ratio, particle count, and motion; paused it offscreen and while the document is hidden; and cleans up GPU resources on page exit.
- Mobile and software-rendered environments use the complete CSS visual without WebGL to avoid expensive context/shader startup.

## Validation record

| Check | Result |
| --- | --- |
| W3C HTML: homepage | PASS — 0 errors, 0 warnings |
| W3C HTML: 404 page | PASS — 0 errors, 0 warnings |
| Homepage H1 | PASS — exactly one |
| Duplicate IDs | PASS — none |
| Local href/src/srcset references | PASS — none missing |
| JavaScript syntax | PASS |
| JSON-LD parse | PASS |
| Schema.org validator | PASS — 0 errors, 0 warnings |
| Sitemap XML and web manifest JSON | PASS |
| Netlify local homepage | PASS — HTTP 200 |
| `/index.html` consolidation | PASS — HTTP 301 to `/` |
| `robots.txt` and `sitemap.xml` | PASS — HTTP 200 with correct content types |
| Missing URL | PASS — HTTP 404 |
| Mobile menu, anchors, ESC, focus return, and scroll lock | PASS |
| Form validation, success UI, and failure UI | PASS |
| Reduced motion and WebGL fallback | PASS |
| Horizontal overflow at 320, 375, 430, 768, 1024, 1280, 1440, and 1920 px | PASS — none |
| Final local mobile Lighthouse | 97 Performance, 100 Accessibility, 100 Best Practices, 100 SEO |
| Lighthouse lab metrics | FCP 1.2 s, LCP 2.0 s, TBT 0 ms, CLS 0 |

The Netlify development server correctly serves the site and configuration but returns HTTP 405 for local form POSTs. Form structure and all client-side states were validated locally; a real submission must be confirmed once after deployment in the Netlify dashboard. No production form message was sent during this work.

## Deployment

No build command is required. Netlify should continue publishing `.` from the repository root. After deploying, verify the live form submission, production asset caching, canonical redirect, crawl files, console, WebGL behavior on hardware, and the median of three production Lighthouse runs.

Deleted tracked assets remain recoverable from Git history. No production deployment, repository push, third-party profile change, or Search Console action was performed from this workspace.
