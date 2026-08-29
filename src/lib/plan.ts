import type { ProductPlan, WorkStep } from "./types";
import { WORK_STEPS } from "./types";

export const DEFAULT_PRODUCT_PLANS: Omit<ProductPlan, "id">[] = [
  {
    name: "Sourdough loaf",
    match_words: "sourdough,levain,country loaf",
    is_default: 1,
    starter_hours: 37,
    mix_hours: 24,
    form_hours: 19,
    proof_hours: 18,
    bake_hours: 2,
  },
  {
    name: "Focaccia",
    match_words: "focaccia",
    is_default: 0,
    starter_hours: 28,
    mix_hours: 16,
    form_hours: 6,
    proof_hours: 5,
    bake_hours: 1.5,
  },
  {
    name: "Cookies",
    match_words: "cookie,cookies",
    is_default: 0,
    starter_hours: null,
    mix_hours: 3,
    form_hours: 1.5,
    proof_hours: null,
    bake_hours: 0.75,
  },
  {
    name: "Cake / cupcakes",
    match_words: "cake,cupcake",
    is_default: 0,
    starter_hours: null,
    mix_hours: 5,
    form_hours: 4.5,
    proof_hours: null,
    bake_hours: 2.5,
  },
  {
    name: "Croissants",
    match_words: "croissant",
    is_default: 0,
    starter_hours: null,
    mix_hours: 16,
    form_hours: 4,
    proof_hours: 2.5,
    bake_hours: 1,
  },
  {
    name: "Muffins",
    match_words: "muffin",
    is_default: 0,
    starter_hours: null,
    mix_hours: 2,
    form_hours: null,
    proof_hours: null,
    bake_hours: 1,
  },
  {
    name: "Cinnamon rolls",
    match_words: "cinnamon,roll",
    is_default: 0,
    starter_hours: null,
    mix_hours: 12,
    form_hours: 4,
    proof_hours: 2,
    bake_hours: 1,
  },
];

export const STEP_LABELS: Record<WorkStep, string> = {
  starter: "Feed starter",
  mix: "Mix",
  form: "Form / shape",
  proof: "Proof",
  bake: "Bake",
};

export function stepLabel(step: WorkStep): string {
  return STEP_LABELS[step];
}

export function hoursForStep(plan: ProductPlan, step: WorkStep): number | null {
  const key = `${step}_hours` as const;
  const value = plan[key];
  return value == null ? null : value;
}

export function matchProductPlan(description: string, plans: ProductPlan[]): ProductPlan {
  const haystack = description.toLowerCase();
  const specific = plans.find(
    (plan) =>
      !plan.is_default &&
      plan.match_words
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean)
        .some((word) => haystack.includes(word)),
  );
  if (specific) return specific;
  return plans.find((plan) => plan.is_default) || plans[0];
}

export function plannedSteps(
  dueAt: string,
  plan: ProductPlan,
  subtractHoursFn: (stamp: string, hours: number) => string,
): { step: WorkStep; scheduled_at: string }[] {
  return WORK_STEPS.flatMap((step) => {
    const hours = hoursForStep(plan, step);
    if (hours == null) return [];
    return [{ step, scheduled_at: subtractHoursFn(dueAt, hours) }];
  });
}
