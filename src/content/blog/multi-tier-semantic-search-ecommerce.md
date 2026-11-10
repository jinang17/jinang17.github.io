---
title: "How We Built Multi-Tier Semantic Search for Ecommerce"
date: 2026-03-25
description: "A single search technique is never enough. Here is how layered fallbacks, denormalized indexes, and incremental embeddings balance relevance, speed, and cost."
tags: ["semantic-search", "vector-embeddings", "ecommerce-search", "search-architecture"]
readingTime: 10
---

## TL;DR

- We built a four-tier search cascade: semantic (vector) search, fuzzy matching, phonetic matching, and substring matching. Each tier catches failure modes the others miss.
- Search and discovery are separate subsystems. Search handles free-text intent. Discovery handles structured browsing and filtering. Mixing them created slower, harder-to-maintain queries.
- A denormalized product index pre-joins all discovery data into a single flat structure, trading write complexity for fast reads on a read-heavy workload.
- Weighted text construction gives us most of the relevance benefit of a custom ML ranking model without any training infrastructure.
- Incremental embedding generation (hash-based change detection) cut our embedding API costs dramatically by skipping unchanged products.
- Every search is instrumented with structured telemetry: query text, matching tier, latency, result count, and embedding cost.

## Why ecommerce search needs more than keywords

Users don't type neat, well-formed queries. They type things like "good headphones for gym," misspell brand names, paste partial SKUs, or describe what they want in ways that share zero keywords with the actual product listing. A system that only does exact keyword matching will fail these users silently, returning nothing when they expected everything.

We set out to build a search system that handles all of this gracefully. Not by finding a single perfect algorithm, but by layering multiple strategies that complement each other.

The design philosophy that shaped every decision:

> A search system should degrade gracefully, not fail silently.

Zero results is the worst possible outcome. It tells the user nothing: not whether the product doesn't exist, whether they misspelled something, or whether the system simply didn't understand them. Our goal was to always return *something* useful, even if the confidence is lower.

## How the four-tier search cascade works

Rather than routing queries to a single search backend, we structured the system as a cascade. Each tier handles a different class of query, and control falls through to the next tier only when the previous one doesn't produce confident results.

### Tier 1: Semantic search (intent matching)

Both products and user queries are converted into vector embeddings, dense numerical representations that capture meaning rather than surface-level text. This allows the system to match on intent.

A query like "portable audio device" can match a product listed as "wireless speaker" because their embeddings land close together in vector space. This tier handles the natural-language, vague-intent queries that traditional keyword search struggles with.

### Tier 2: Fuzzy matching (typo tolerance)

When semantic search doesn't return strong matches, perhaps the query is a specific product name with a typo, we fall back to fuzzy text matching. This tier catches misspellings, slight variations, and other near-miss text inputs that embeddings might not resolve cleanly.

### Tier 3: Phonetic matching (sound-based)

Some misspellings aren't close in edit distance but are close in pronunciation. Brand names are especially prone to this. Phonetic matching picks up cases where a user spells something the way it sounds rather than the way it's written.

### Tier 4: Substring matching (last resort)

The final fallback is simple: does the query appear as a substring anywhere in the product text? This catches partial SKUs, model numbers, and other exact-fragment searches that don't benefit from semantic or fuzzy logic.

The key insight is that each tier optimizes for a different failure mode. Semantic search handles vague intent but struggles with exact codes. Substring matching handles exact fragments but can't understand intent. Together, they cover the full spectrum.

## Why we separated search from discovery

One of the more impactful architectural decisions was splitting the system into two distinct subsystems: **search** and **discovery**.

**Search** is about relevance and intent. It takes a free-text query and returns the most meaningful results using the multi-tier pipeline described above.

**Discovery** is about browsing and filtering. It powers category pages, tag-based navigation, price range filters, and sort controls. These are structured operations over known dimensions, not open-ended text interpretation.

We initially considered a unified system, but the tradeoffs became clear quickly. Combining both creates queries that are simultaneously trying to rank by semantic relevance *and* filter by structured attributes. The result is slower performance, more complex query logic, and a system that's harder to reason about.

By separating them, each subsystem can be optimized independently. Search can focus on ranking quality. Discovery can focus on filter speed. Both are simpler to maintain, test, and scale.

## How the denormalized discovery index works

Discovery queries like "show me all wireless headphones under Rs. 5,000 sorted by rating" hit the database frequently and need to be fast. Running joins across product tables, category tables, tag tables, and attribute tables on every request isn't viable at scale.

To solve this, we maintain a flattened, denormalized product index that pre-joins all the data a discovery query might need into a single structure. This includes:

- Product metadata (name, slug, image, price)
- Category hierarchy
- Tags and attributes
- Visibility and lifecycle flags
- A precomputed search-text field

The tradeoff is classic: we accept higher write complexity (keeping the index in sync) in exchange for dramatically faster and simpler reads. For a read-heavy ecommerce workload, this is almost always the right call.

## Why we chose weighted text over custom ML models

A common approach to improving semantic search relevance is to train a custom ranking model. We chose not to.

Instead, we use a simpler technique: **weighted text construction**. When generating the text that gets embedded, we weight certain fields more heavily. The product title, for instance, contributes more to the embedding than a secondary attribute or a tag. This means products whose titles closely match a query will rank higher in vector similarity, without any model training.

This gives us most of the relevance benefit of a custom model, with none of the operational overhead: no training pipelines, no model versioning, no GPU infrastructure. For our scale and use case, the simplicity tradeoff was worth it.

## How incremental indexing controls embedding costs

Embedding generation isn't free. Every call to an embedding API has a cost, and re-embedding an entire product catalog on every update is wasteful when most products haven't changed.

We implemented a change-detection layer that tracks what content was previously embedded and only regenerates embeddings for items whose searchable content has actually changed. The mechanism is straightforward: hash the input text, compare it to the stored hash, and skip if unchanged.

This reduced our embedding API usage dramatically while keeping the index fresh. It's a small optimization in terms of code, but a significant one in terms of cost at scale.

## Performance decisions that compound

Beyond the high-level architecture, several lower-level decisions contribute to production performance.

**Vector search indexing.** We use a specialized index structure (an approximate nearest-neighbor index) for fast similarity lookups in high-dimensional embedding space. Without this, every search would require a brute-force comparison against every product vector.

**Reduced vector dimensions.** We optimized our embedding dimensions to be as small as possible without meaningful loss in relevance. Smaller vectors mean less storage, less memory, and faster distance computations.

**Query caching.** Popular and repeated queries are cached so they skip the embedding and search pipeline entirely. Ecommerce search traffic follows a power-law distribution, so a relatively small cache covers a large percentage of queries.

**Asynchronous analytics logging.** Every search generates telemetry (query text, tier that matched, latency, result count), but this logging happens asynchronously. The user never waits for analytics to be recorded.

## How we observe and improve the system

A search system that can't observe itself can't improve. We instrument every search with structured telemetry that captures:

- What the user searched for
- Which tier produced the result
- How many results were returned (especially zero-result queries)
- Response latency
- Embedding API cost per query

Zero-result queries are particularly valuable. They surface gaps, either in the product catalog (we don't carry what people want) or in the search logic (we carry it but can't find it). Tracking which tier serves which queries tells us whether the semantic layer is doing its job or whether users are mostly being caught by fallbacks.

This data feeds back into the system as a continuous improvement loop: product data changes, the index updates selectively, users search, results are served, analytics capture behavior, and insights inform the next iteration.

## Design principles that shaped every decision

**Resilience over perfection.** Always return results. A mediocre result is infinitely better than no result.

**Separation of concerns.** Search and discovery are different problems. Treat them that way.

**Cost awareness.** Embeddings, vector storage, and API calls all have costs. Design for incremental updates, not full rebuilds.

**Performance first.** Denormalize, cache, and index aggressively. Users notice latency before they notice relevance.

**Simplicity where possible.** Weighted text beats custom ML models when the complexity isn't justified. Change-detection beats scheduled rebuilds. Boring solutions that work reliably beat clever ones that don't.

## What we'd explore next

This architecture handles our current scale well, but there are natural extensions we're evaluating:

- **Query understanding** (expanding or rewriting queries before they hit the pipeline) could improve semantic tier accuracy.
- **Learning-to-rank** on click-through data could refine result ordering.
- **Personalized embeddings**, incorporating user behavior into the vector space, could make results more relevant per user.

The foundation described here is intentionally stack-agnostic. The multi-tier cascade, the search/discovery separation, the incremental indexing: these are patterns, not implementations. They work whether you're using PostgreSQL with pgvector, Elasticsearch with kNN, or a dedicated vector database. The value is in the architecture, not in any single component.