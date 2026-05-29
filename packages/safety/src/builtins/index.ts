import type { Guardrail, SafetyDecision } from '@moon-wave/types';

// ─── Hate speech ──────────────────────────────────────────────────────────────

const HATE_PATTERNS = [
  /\b(kill|exterminate|genocide|lynch)\s+(all\s+)?(jews|muslims|christians|blacks|whites|gays|trans)\b/i,
  /\b(n[i1]gg[ae3]rs?|f[a4]gg[o0]ts?|ch[i1]nks?|sp[i1]cs?)\b/i,
];

const hateSpeech: Guardrail = ({ content }) => {
  if (HATE_PATTERNS.some((p) => p.test(content))) {
    return { action: 'block', guardrail: 'hate-speech', reason: 'Hate speech detected', severity: 'critical' };
  }
  return null;
};

// ─── Violence ─────────────────────────────────────────────────────────────────

const VIOLENCE_PATTERNS = [
  /how\s+to\s+(make|build|create|assemble)\s+(a\s+)?(bomb|explosive|weapon|firearm)/i,
  /step[s\s-]*by[s\s-]*step.{0,50}(murder|assassination|mass\s+shooting)/i,
  /\b(torture|maim|decapitat|behead).{0,50}(instruct|how|guide|step)/i,
];

const violence: Guardrail = ({ content }) => {
  if (VIOLENCE_PATTERNS.some((p) => p.test(content))) {
    return { action: 'block', guardrail: 'violence', reason: 'Violent instructions detected', severity: 'critical' };
  }
  return null;
};

// ─── Adult content ────────────────────────────────────────────────────────────

const ADULT_PATTERNS = [
  /\b(pornography|hentai|xxx|adult\s+content)\b/i,
  /\bsexually\s+(explicit|graphic)\b/i,
];

const adultContent: Guardrail = ({ content }) => {
  if (ADULT_PATTERNS.some((p) => p.test(content))) {
    return { action: 'block', guardrail: 'adult-content', reason: 'Adult content detected', severity: 'high' };
  }
  return null;
};

// ─── Self-harm ────────────────────────────────────────────────────────────────

const SELF_HARM_PATTERNS = [
  /how\s+to\s+(commit\s+suicide|kill\s+(my|your)?self|end\s+(my|your)\s+life)/i,
  /(best|fastest|painless)\s+(way|method)\s+to\s+(die|suicide|kill\s+(my|your)self)/i,
  /\bself[-\s]harm\s+(method|instruct|guide|step)/i,
];

const selfHarm: Guardrail = ({ content }) => {
  if (SELF_HARM_PATTERNS.some((p) => p.test(content))) {
    return { action: 'block', guardrail: 'self-harm', reason: 'Self-harm instructions detected', severity: 'critical' };
  }
  return null;
};

// ─── Illegal activity ─────────────────────────────────────────────────────────

const ILLEGAL_PATTERNS = [
  /how\s+to\s+(synthesize|make|cook)\s+(meth|heroin|fentanyl|cocaine|crack|lsd)\b/i,
  /(credit\s+card\s+skimming|carding\s+tutorial)/i,
  /how\s+to\s+(hack|crack|bypass)\s+(a\s+)?(password|bank\s+account|atm)\b/i,
];

const illegalActivity: Guardrail = ({ content }) => {
  if (ILLEGAL_PATTERNS.some((p) => p.test(content))) {
    return { action: 'block', guardrail: 'illegal-activity', reason: 'Illegal activity instructions detected', severity: 'critical' };
  }
  return null;
};

// ─── Prompt injection (input only) ───────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a\s+)?(different|new|jailbroken|unfiltered|dan)\b/i,
  /forget\s+(everything|all).{0,50}(rules|instructions)/i,
  /\[system\]|\[inst\]|<\|im_start\|>|<\|endoftext\|>/i,
  /act\s+as\s+(if\s+you\s+(have\s+no|are\s+free\s+from)|an?\s+(unrestricted|unfiltered|evil))/i,
];

const promptInjection: Guardrail = ({ content, phase }) => {
  if (phase !== 'input') return null;
  if (INJECTION_PATTERNS.some((p) => p.test(content))) {
    return { action: 'block', guardrail: 'prompt-injection', reason: 'Possible prompt injection attempt', severity: 'high' };
  }
  return null;
};

// ─── Input length (input only) ────────────────────────────────────────────────

const MAX_SAFE_INPUT = 50_000;

const inputLength: Guardrail = ({ content, phase }) => {
  if (phase !== 'input') return null;
  if (content.length > MAX_SAFE_INPUT) {
    return {
      action: 'block',
      guardrail: 'input-length',
      reason: `Input exceeds maximum allowed length (${MAX_SAFE_INPUT} chars)`,
      severity: 'medium',
    };
  }
  return null;
};

// ─── Export map ───────────────────────────────────────────────────────────────

export const builtinGuardrails: Record<string, Guardrail> = {
  'hate-speech': hateSpeech,
  'violence': violence,
  'adult-content': adultContent,
  'self-harm': selfHarm,
  'illegal-activity': illegalActivity,
  'prompt-injection': promptInjection,
  'input-length': inputLength,
};

export type BuiltinGuardrailName = keyof typeof builtinGuardrails;
