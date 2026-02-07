import { z } from 'zod';

// Domain types
export const DomainSchema = z.enum(['finance', 'mental', 'physical']);
export type Domain = z.infer<typeof DomainSchema>;

export const TrendSchema = z.enum(['up', 'down', 'flat']);
export type Trend = z.infer<typeof TrendSchema>;

// Domain risk
export const DomainRiskSchema = z.object({
  domain: DomainSchema,
  score: z.number().min(0).max(100),
  trend: TrendSchema,
  drivers: z.array(z.string()),
});
export type DomainRisk = z.infer<typeof DomainRiskSchema>;

// Dependency edge
export const DependencyEdgeSchema = z.object({
  from: DomainSchema,
  to: DomainSchema,
  strength: z.number().min(0).max(1),
  label: z.string(),
});
export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

// Evidence for insights
export const EvidenceSchema = z.object({
  metric: z.string(),
  values: z.array(z.number()),
  dates: z.array(z.string()),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

// Insight
export const InsightSchema = z.object({
  id: z.string(),
  title: z.string(),
  explanation: z.string(),
  evidence: EvidenceSchema,
  confidence: z.number().min(0).max(1),
});
export type Insight = z.infer<typeof InsightSchema>;

// Dashboard payload
export const DashboardPayloadSchema = z.object({
  domains: z.array(DomainRiskSchema),
  edges: z.array(DependencyEdgeSchema),
  insights: z.array(InsightSchema),
});
export type DashboardPayload = z.infer<typeof DashboardPayloadSchema>;

// Check-in
export const CheckInSchema = z.object({
  stress: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  note: z.string().optional(),
  date: z.string().optional(),
});
export type CheckIn = z.infer<typeof CheckInSchema>;

export const CheckInRecordSchema = CheckInSchema.extend({
  id: z.string(),
  date: z.string(),
});
export type CheckInRecord = z.infer<typeof CheckInRecordSchema>;

// Transactions
export const TransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  amount: z.number(),
  category: z.string(),
  description: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionsSummarySchema = z.object({
  totalsByCategory: z.record(z.number()),
  recentTransactions: z.array(TransactionSchema),
});
export type TransactionsSummary = z.infer<typeof TransactionsSummarySchema>;

// Health
export const HealthDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});
export type HealthDataPoint = z.infer<typeof HealthDataPointSchema>;

export const HealthSummarySchema = z.object({
  sleepSeries: z.array(HealthDataPointSchema),
  stepsSeries: z.array(HealthDataPointSchema),
});
export type HealthSummary = z.infer<typeof HealthSummarySchema>;