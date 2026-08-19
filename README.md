# JobStream

A resilient job ingestion service that fetches jobs from a permitted public source, normalizes and validates the data, removes duplicates, and stores the resulting records.

## Architecture

```text
Himalayas Source
       ↓
 Source Adapter
       ↓
 Retry + Backoff
       ↓
 Normalization
       ↓
 Validation
       ↓
 Deduplication
       ↓
 SQLite Storage