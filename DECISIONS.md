# JobStream - Engineering Decisions

## 1. Ingestion Strategy

I chose a permitted public job source rather than attempting to scrape a protected platform such as LinkedIn. The source is isolated behind a dedicated adapter:

Source -> Adapter -> Normalize -> Validate -> Deduplicate -> Store

This keeps source-specific retrieval logic separate from the core ingestion pipeline. A second permitted source can therefore be added without rewriting normalization, validation, deduplication, or storage.

I rejected directly automating LinkedIn because the assignment explicitly provides a low-risk public-source guardrail. I did not want to bypass authentication, CAPTCHA, fingerprinting, rate limits, or other platform protections.

## 2. Resilience and Failure Handling

The source adapter uses bounded retries with exponential backoff for transient failures. Retries stop after a defined limit so a permanently unavailable source cannot block the ingestion pipeline indefinitely.

A failed source is reported as a failed ingestion run rather than being silently converted into an empty successful result.

Incoming records are normalized into one internal job structure and validated before storage. Jobs are deduplicated using a stable identifier so repeated ingestion does not create duplicate records.

If the primary source becomes unavailable, the architecture allows another permitted source adapter to be added without changing the rest of the pipeline.

## 3. Detection and Scope Boundary

Automated access to protected job platforms can be detected through signals such as request frequency and timing, missing or unusual headers, session behavior, browser/headless fingerprints, IP reputation, and CAPTCHA or authentication challenges.

I intentionally did not implement techniques for bypassing these protections. The live demo uses a permitted public source so the engineering focus remains on reliable ingestion, normalization, validation, deduplication, and failure handling.

My technical boundary is that I will not circumvent authentication, CAPTCHA, anti-bot controls, or other access restrictions. If a source blocks the permitted adapter, the system should fail explicitly and switch to another permitted source rather than attempting to evade the restriction.

## 4. Trade-off Under the Time Limit

The main trade-off was keeping the storage layer simple with SQLite and focusing the available time on the ingestion architecture, resilience, validation, and deduplication.

With a full week, I would move storage to a persistent managed database, add structured logging and source-health metrics, add automated integration tests, introduce a job queue for larger workloads, and implement multiple permitted source adapters with health-based fallback.

## 5. AI Usage and Verification

I used AI tools as a development assistant for implementation guidance, debugging, and reviewing the architecture.

I personally ran the application, inspected the source code, verified the build, tested the health endpoint, tested ingestion locally, verified that the first run inserted records and that a repeated run detected duplicates, and verified the deployed API.

I also reviewed and made the final engineering decisions around source selection, retry behavior, failure handling, deduplication, and the scope boundary. I can explain the submitted code and architecture in a follow-up discussion.

## 6. Evidence of the Working Pipeline

The deployed service was tested end-to-end.

A fresh local ingestion produced:

- 20 fetched
- 20 accepted
- 20 inserted
- 0 duplicates
- 0 rejected

A repeated ingestion produced:

- 20 fetched
- 20 accepted
- 0 inserted
- 20 duplicates
- 0 rejected

The deployed service also successfully completed ingestion and returned the expected deduplication result.