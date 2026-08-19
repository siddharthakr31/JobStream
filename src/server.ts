import express from "express";
import db from "./config/database.js";
import { runIngestion } from "./ingestion/runIngestion.js";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.json({
    name: "JobStream",
    status: "running"
  });
});

app.post("/api/ingest", async (_req, res) => {
  try {
    const result = await runIngestion();

    res.json(result);
  } catch {
    res.status(502).json({
      status: "failed",
      message: "Source ingestion failed"
    });
  }
});

app.get("/api/jobs", (_req, res) => {
  const jobs = db
    .prepare(`
      SELECT *
      FROM jobs
      ORDER BY published_at DESC
    `)
    .all();

  res.json({
    count: jobs.length,
    jobs
  });
});

app.get("/api/runs", (_req, res) => {
  const runs = db
    .prepare(`
      SELECT *
      FROM ingestion_runs
      ORDER BY id DESC
      LIMIT 20
    `)
    .all();

  res.json({
    runs
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "JobStream"
  });
});

app.listen(PORT, () => {
  console.log(`JobStream running on http://localhost:${PORT}`);
});