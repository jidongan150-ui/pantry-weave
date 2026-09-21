import {z} from 'zod';
import {recipeSchema} from './recipes.ts';

export const LOCAL_PLAN_KEY = 'pantry-weave-device-plan-v1';
const localPlanSchema = z.object({
  recipes:z.array(recipeSchema).max(5),
  people:z.number().int().min(1).max(20),
  checked:z.array(z.string().max(1000)).max(400),
  status:z.literal(''),
}).strict();

export function parseLocalPlan(text: string) {
  if (text.length > 200000) throw Error('local-plan-size');
  return localPlanSchema.parse(JSON.parse(text));
}
