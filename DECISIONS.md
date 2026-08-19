# JobStream — Engineering Decisions

## 1. Source Selection

JobStream uses a permitted public job source through a dedicated source adapter.

The source adapter is isolated from the rest of the ingestion pipeline so that additional permitted sources can be added without changing normalization, validation, deduplication, or storage logic.

## 2. Why Not LinkedIn?

LinkedIn was not used because the assignment scope does not require bypassing authentication, CAPTCHA, anti-bot controls, fingerprinting, or other platform restrictions.

The goal was to demonstrate a reliable ingestion architecture using a permitted source rather than circumventing platform protections.

## 3. Source Adapter Architecture

Each source is treated as an adapter responsible only for retrieving source data and converting it into the ingestion pipeline's expected input.

This keeps source-specific logic separate from the core pipeline.

Conceptually:

Source → Adapter → Normalize → Validate → Deduplicate → Store

## 4. Retry Strategy

Transient source failures use bounded retries with exponential backoff.

Retries are intentionally bounded so that a permanently unavailable source does not block the entire ingestion process indefinitely.

If the source remains unavailable after the retry limit, the ingestion run is marked as failed rather than silently returning an empty result.

## 5. Normalization

Source-specific job fields are converted into a consistent internal job representation.

This allows downstream processing to operate on one predictable structure regardless of the source format.

## 6. Validation

Incoming jobs are validated before being stored.

Invalid records are rejected rather than allowing malformed data to enter the storage layer.

## 7. Deduplication

Jobs are deduplicated using a stable identifier derived from the available job/source information.

This prevents repeated ingestion runs from creating unnecessary duplicate records.

## 8. Failure Handling

Failures are surfaced explicitly through the ingestion result/history rather than being hidden.

This makes it possible to distinguish between:

- successful ingestion
- partial/record-level failures
- source failures
- validation failures

## 9. Extensibility

A second permitted source can be introduced by implementing another source adapter.

The core normalization, validation, deduplication, and storage pipeline does not need to be rewritten.

## 10. Production Improvements

For a production deployment, I would additionally introduce:

- source health metrics
- structured logging
- alerting
- monitoring of ingestion success/failure rates
- persistent job queues for larger workloads
- multiple permitted source adapters
- more comprehensive automated tests

These are intentionally outside the minimum MVP scope.