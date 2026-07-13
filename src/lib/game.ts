// Shared game rules — used by both the client (display) and the server
// (authoritative grading). Keep these in sync in one place so a tampered
// client can never award itself a score the server won't reproduce.

export const MAX_HP = 5;
export const TIMER_SECS = 100;
export const QUESTIONS_PER_STAGE = 10;

/** Points for a correct answer given how long it took (seconds). */
export function scoreForAnswer(timeSpent: number): number {
  const spent = clampTime(timeSpent);
  return Math.max(10, 30 - spent * 2);
}

/** Clamp a client-reported time to a sane range so it can't inflate score. */
export function clampTime(timeSpent: number): number {
  if (!Number.isFinite(timeSpent) || timeSpent < 0) return TIMER_SECS;
  return Math.min(Math.round(timeSpent), TIMER_SECS);
}

export interface RawAttempt {
  questionId: string;
  answer: string;
  timeSpent: number;
}

export interface GradedAttempt {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface GradedSession {
  attempts: GradedAttempt[];
  correct: number;
  total: number;
  score: number;
  hpLeft: number;
  passed: boolean;
}

/**
 * Authoritatively grade a run. `answerKey` maps questionId -> correct answer
 * (from the DB). Replays the HP rule: start at MAX_HP, each wrong answer costs
 * 1 HP, the run ends (fail) if HP hits 0. Passing requires surviving every
 * question with HP left.
 */
export function gradeSession(rawAttempts: RawAttempt[], answerKey: Map<string, string>): GradedSession {
  let hp = MAX_HP;
  let correct = 0;
  let score = 0;
  let dead = false;

  const attempts: GradedAttempt[] = [];

  for (const a of rawAttempts) {
    const key = answerKey.get(a.questionId);
    // Unknown question id => treat as wrong (can't be verified)
    const isCorrect = key !== undefined && a.answer === key;
    const spent = clampTime(a.timeSpent);

    if (isCorrect) {
      correct++;
      score += scoreForAnswer(spent);
    } else if (!dead) {
      hp = Math.max(0, hp - 1);
      if (hp === 0) dead = true;
    }

    attempts.push({ questionId: a.questionId, answer: a.answer, isCorrect, timeSpent: spent });
  }

  const total = rawAttempts.length;
  // Survived every question without HP hitting 0.
  const passed = !dead && total > 0;

  return { attempts, correct, total, score, hpLeft: dead ? 0 : hp, passed };
}
