import { z } from 'zod';

export const FinancialFlagsEnum = [
  'baseline_spending',
  'impulse_spending',
  'comfort_spending',
  'small_reward_purchase',
  'gift_spending',
  'increased_future_planning',
  'other',
] as const;

export const CheckinSchema = z.object({
  date_of_checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  emotion1: z.string().min(1).max(50),
  emotion2: z.string().min(1).max(50),
  emotion3: z.string().min(1).max(50),
  stress: z.number().min(0).max(10),
  life_event_summary: z.string().max(500),
  financial_flags: z.enum(FinancialFlagsEnum),
});

export type Checkin = z.infer<typeof CheckinSchema>;

export const CheckinInputSchema = z.object({
  date_of_checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text_entry: z.string().min(10).max(2000),
});

export type CheckinInput = z.infer<typeof CheckinInputSchema>;
