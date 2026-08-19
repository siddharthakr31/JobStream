import axios from "axios";

const HIMALAYAS_API =
  "https://himalayas.app/jobs/api?limit=20&offset=0";

export interface RawJob {
  title?: string;
  companyName?: string;
  employmentType?: string;
  description?: string;
  applicationLink?: string;
  pubDate?: number;
  locationRestrictions?: string[];
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchHimalayasJobs(): Promise<RawJob[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.get(HIMALAYAS_API, {
        timeout: 10000
      });

      if (!Array.isArray(response.data.jobs)) {
        throw new Error("Invalid source response");
      }

      return response.data.jobs;
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await sleep(1000 * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
}