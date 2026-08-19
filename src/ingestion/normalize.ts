import { RawJob } from "../sources/himalayas.js";
import { Job, JobSchema } from "../models/job.js";

export function normalizeJob(raw: RawJob): Job | null {
  const result = JobSchema.safeParse({
    sourceId: raw.applicationLink || raw.title,
    title: raw.title?.trim(),
    company: raw.companyName?.trim(),
    location: raw.locationRestrictions?.join(", "),
    employmentType: raw.employmentType,
    description: raw.description,
    sourceUrl: raw.applicationLink,
    publishedAt: raw.pubDate
      ? new Date(raw.pubDate).toISOString()
      : undefined
  });

  if (!result.success) {
    console.error("Invalid job:", result.error.issues);
    return null;
  }

  return result.data;
}