import { z } from "zod";

export const JobSchema = z.object({
  sourceId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  description: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  publishedAt: z.string().optional()
});

export type Job = z.infer<typeof JobSchema>;