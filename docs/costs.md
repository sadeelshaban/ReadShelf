# Operating Costs

Estimated monthly costs for running ReadShelf. Prices are approximate; verify current rates on [vercel.com/pricing](https://vercel.com/pricing) and [supabase.com/pricing](https://supabase.com/pricing) before quoting a buyer.

## Cost drivers

| Service | What scales |
|---------|-------------|
| **Vercel** | Bandwidth, serverless invocations, build minutes |
| **Supabase** | Database size, storage (PDFs), auth MAU, egress |
| **SMTP** | Emails sent (signup, password reset) |

PDF rendering is **client-side** — reading time does not meaningfully increase server compute. Export and upload API routes do.

## Tier estimates

### Hobby / demo (0–50 users)

| Service | Plan | Est. monthly |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| SMTP (Gmail) | Free | $0 |
| Domain (optional) | — | ~$12/year |
| **Total** | | **~$0–1** |

Limits: 500 MB database, 1 GB storage, 50 MB max upload per PDF in-app.

### Small production (50–500 users)

| Service | Plan | Est. monthly |
|---------|------|--------------|
| Vercel | Pro | ~$20 |
| Supabase | Pro | ~$25 |
| SMTP (SendGrid, etc.) | Starter | ~$0–15 |
| Domain + SSL | Included with Vercel | ~$1/mo amortized |
| **Total** | | **~$45–60** |

Assumes roughly 200 PDFs × 10 MB average = 2 GB storage (within the Pro plan).

### Growth (500–5,000 users)

| Service | Plan | Est. monthly |
|---------|------|--------------|
| Vercel | Pro + usage | ~$20–80 |
| Supabase | Pro + compute | ~$25–100 |
| SMTP | Paid tier | ~$15–50 |
| **Total** | | **~$60–230** |

Consider CDN caching for static assets, and monitor storage growth from PDF uploads.

## Storage projection

| Users | Avg. books/user | Avg. PDF size | Storage |
|-------|-----------------|---------------|---------|
| 100 | 5 | 15 MB | ~7.5 GB |
| 500 | 8 | 15 MB | ~60 GB |
| 1,000 | 10 | 15 MB | ~150 GB |

Supabase Pro includes 100 GB of storage; beyond that, add roughly $0.021/GB/month.

## Revenue model (buyer options)

ReadShelf ships **without billing**. A buyer can add:

| Model | Integration effort |
|-------|---------------------|
| One-time license (B2B) | None — this is the current acquisition model |
| Per-seat SaaS | Stripe + org/team tables |
| Freemium (book limit) | Feature flag + upload count |
| Enterprise white-label | Custom domain + branding (already supported) |

**Current revenue:** $0 MRR — positioned as an asset sale, not an operating SaaS business.

## Cost optimization tips

1. Compress PDFs at upload time (not yet implemented — an opportunity for the buyer)
2. Lazy-delete orphaned storage objects on book deletion (already implemented)
3. Cache signed URLs client-side (partially implemented)
4. Use Supabase image transforms for covers, if added later
