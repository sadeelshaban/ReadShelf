# Product Roadmap

Forward-looking capabilities that increase acquisition value. Items are **not committed deliverables** unless negotiated in the sale agreement — they represent a sensible evolution path for a buyer's product team.

## Shipped (current baseline)

- Email auth, shelf, PDF reader with highlights, notes, pen, bookmarks
- Reading resume (scroll + zoom), read-again flow, annotated PDF export (Arabic support)
- Offline IndexedDB cache and background sync
- Admin engagement dashboard
- Legal pages, acquisition one-pager, Data Room documentation
- Vitest unit tests for reader utilities

## Near term (0–3 months) — high buyer value

| Initiative | Rationale |
|------------|-----------|
| Custom domain + white-label branding | Replace Vercel subdomain; buyer-owned identity |
| Organization / team accounts | Multi-user libraries for B2B EdTech and corporate L&D |
| Bulk PDF import | Onboarding publishers with large catalogs |
| Full data export (GDPR-style) | Settings placeholder → downloadable archive |
| Demo video + guided tour | Accelerates sales and due diligence |

## Medium term (3–6 months)

| Initiative | Rationale |
|------------|-----------|
| SSO (SAML / OIDC) | Enterprise procurement requirement |
| Role-based admin (viewer, editor, org admin) | Publisher and corporate deployments |
| Reading analytics per book | Engagement insights for content owners |
| Full-text search across library | Discoverability at scale |
| Mobile-responsive reader polish | Tablet-first reading sessions |

## Long term (6–12 months)

| Initiative | Rationale |
|------------|-----------|
| Native mobile apps (or PWA install flow) | Offline reading on iOS/Android |
| EPUB support | Broader publisher formats |
| AI-assisted summaries / Q&A on highlights | Differentiation in EdTech market |
| Multi-region storage + CDN for PDFs | Latency and compliance (EU data residency) |
| Marketplace / license-gated content | Publisher monetization model |

## Infrastructure options (buyer choice)

| Option | When to consider |
|--------|------------------|
| Stay on Supabase Storage | Simplest path; current production architecture |
| Cloudflare R2 for PDFs | Lower egress at scale; scripts exist in `scripts/` |
| Dedicated Postgres (Supabase self-host or RDS) | Compliance or existing cloud contracts |

Architecture docs should be updated when the buyer selects a non-default storage backend.

## How to use this document in diligence

- Treat **Shipped** as verified in the live demo and repository
- Treat **Near / Medium / Long term** as product opportunity, not warranty
- Buyers may reprioritize based on their market (e.g. publisher vs corporate)
