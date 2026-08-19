import db from "../config/database.js";
import { fetchHimalayasJobs } from "../sources/himalayas.js";
import { normalizeJob } from "./normalize.js";

export async function runIngestion() {
  const start = new Date().toISOString();

  const run = db
    .prepare(`
      INSERT INTO ingestion_runs (source, status, started_at)
      VALUES (?, ?, ?)
    `)
    .run("himalayas", "running", start);

  const runId = Number(run.lastInsertRowid);

  try {
    const rawJobs = await fetchHimalayasJobs();

    let accepted = 0;
    let inserted = 0;
    let duplicates = 0;
    let rejected = 0;

    const insertJob = db.prepare(`
      INSERT INTO jobs (
        source_id,
        source,
        title,
        company,
        location,
        employment_type,
        description,
        source_url,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(source, source_id) DO NOTHING
    `);

    const transaction = db.transaction(() => {
      for (const raw of rawJobs) {
        const job = normalizeJob(raw);

        if (!job) {
          rejected++;
          continue;
        }

        accepted++;

        const result = insertJob.run(
          job.sourceId,
          "himalayas",
          job.title,
          job.company,
          job.location ?? null,
          job.employmentType ?? null,
          job.description ?? null,
          job.sourceUrl ?? null,
          job.publishedAt ?? null
        );

        if (result.changes === 1) {
          inserted++;
        } else {
          duplicates++;
        }
      }
    });

    transaction();

    db.prepare(`
      UPDATE ingestion_runs
      SET status = ?,
          fetched = ?,
          accepted = ?,
          inserted = ?,
          duplicates = ?,
          rejected = ?,
          finished_at = ?
      WHERE id = ?
    `).run(
      "success",
      rawJobs.length,
      accepted,
      inserted,
      duplicates,
      rejected,
      new Date().toISOString(),
      runId
    );

    return {
      status: "success",
      fetched: rawJobs.length,
      accepted,
      inserted,
      duplicates,
      rejected
    };
  } catch (error) {
    db.prepare(`
      UPDATE ingestion_runs
      SET status = ?,
          error = ?,
          finished_at = ?
      WHERE id = ?
    `).run(
      "failed",
      error instanceof Error ? error.message : "Unknown error",
      new Date().toISOString(),
      runId
    );

    throw error;
  }
}