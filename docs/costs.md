# Operating Costs

Estimated monthly costs for running ReadShelf. Prices are approximate (2025–2026); verify on [vercel.com/pricing](https://vercel.com/pricing) and [supabase.com/pricing](https://supabase.com/pricing).

---

## Cost drivers

| Service | What scales |
|---------|-------------|
| **Vercel** | Bandwidth, serverless invocations, build minutes |
| **Supabase** | Database size, storage (PDFs), auth MAU, egress |
| **SMTP** | Emails sent (signup, password reset) |

PDF rendering is **client-side** — reading time does not increase server compute significantly. Export and upload API routes do.

---

## Tier estimates

### Hobby / demo (0–50 users)

| Service | Plan | Est. monthly |
|---------|------|--------------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| SMTP (Gmail) | Free | $0 |
| Domain (optional) | — | ~$12/year |
| **Total** | | **~$0–1** |

Limits: 500 MB DB, 1 GB storage, 50 MB max upload per PDF in app.

---

### Small production (50–500 users)

| Service | Plan | Est. monthly |
|---------|------|--------------|
| Vercel | Pro | ~$20 |
| Supabase | Pro | ~$25 |
| SMTP (SendGrid/etc.) | Starter | ~$0–15 |
| Domain + SSL | Vercel included | ~$1/mo amortized |
| **Total** | | **~$45–60** |

Assumes ~200 PDFs × 10 MB avg = 2 GB storage (within Pro).

---

### Growth (500–5,000 users)

| Service | Plan | Est. monthly |
|---------|------|--------------|
| Vercel | Pro + usage | ~$20–80 |
| Supabase | Pro + compute | ~$25–100 |
| SMTP | Paid tier | ~$15–50 |
| **Total** | | **~$60–230** |

Consider CDN caching for static assets; monitor storage growth from PDF uploads.

---

## Storage projection

| Users | Avg books/user | Avg PDF size | Storage |
|-------|----------------|--------------|---------|
| 100 | 5 | 15 MB | ~7.5 GB |
| 500 | 8 | 15 MB | ~60 GB |
| 1,000 | 10 | 15 MB | ~150 GB |

Supabase Pro includes 100 GB storage; beyond that add ~$0.021/GB/month.

---

## Revenue model (buyer options)

ReadShelf ships **without billing**. Buyer can add:

| Model | Integration effort |
|-------|-------------------|
| One-time license (B2B) | None — current acquisition model |
| Per-seat SaaS | Stripe + org/team tables |
| Freemium (book limit) | Feature flag + upload count |
| Enterprise white-label | Custom domain + branding (already supported) |

**Current revenue:** $0 MRR — positioned as asset sale, not operating SaaS.

---

## Cost optimization tips

1. Compress PDFs at upload (not implemented — buyer opportunity)
2. Lazy-delete orphaned storage on book delete (implemented)
3. Cache signed URLs client-side (partially implemented)
4. Use Supabase image transforms for covers if added later
