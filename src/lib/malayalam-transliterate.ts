// Best-effort Manglish -> Malayalam phonetic transliteration, used to suggest a
// Malayalam name while someone types it out in Latin letters (see
// components/forms/MalayalamSuggestion.tsx). This is a small greedy consonant/vowel
// table in the spirit of ITRANS-style schemes, tuned for how Kerala names are
// typically typed casually rather than exhaustive Sanskrit/Arabic loanword coverage
// — e.g. doubled letters (tt/dd/nn/ll/rr) pick the retroflex consonant rather than
// requiring shift-case, since that's how people already type "kutty"/"amma"-style
// words. It's always surfaced as a dismissible suggestion, never applied
// automatically, so a wrong guess just means the user ignores it.

const VIRAMA = "്"; // ്

const VOWELS: Record<string, { independent: string; matra: string }> = {
  aa: { independent: "ആ", matra: "ാ" },
  ee: { independent: "ഈ", matra: "ീ" },
  ii: { independent: "ഈ", matra: "ീ" },
  oo: { independent: "ഊ", matra: "ൂ" },
  uu: { independent: "ഊ", matra: "ൂ" },
  ai: { independent: "ഐ", matra: "ൈ" },
  au: { independent: "ഔ", matra: "ൌ" },
  a: { independent: "അ", matra: "" },
  i: { independent: "ഇ", matra: "ി" },
  u: { independent: "ഉ", matra: "ു" },
  e: { independent: "എ", matra: "െ" },
  o: { independent: "ഒ", matra: "ൊ" },
};

const CONSONANTS: Record<string, string> = {
  ksh: "ക്ഷ",
  chh: "ഛ",
  kh: "ഖ",
  gh: "ഘ",
  ng: "ങ",
  jh: "ഝ",
  ny: "ഞ",
  tt: "ട",
  dd: "ഡ",
  nn: "ണ",
  ll: "ള",
  rr: "റ",
  sh: "ശ",
  zh: "ഴ",
  ch: "ച",
  ph: "ഫ",
  bh: "ഭ",
  th: "ത",
  dh: "ധ",
  k: "ക",
  g: "ഗ",
  c: "ച",
  j: "ജ",
  t: "ത",
  d: "ദ",
  n: "ന",
  p: "പ",
  f: "ഫ",
  b: "ബ",
  m: "മ",
  y: "യ",
  r: "ര",
  l: "ല",
  v: "വ",
  w: "വ",
  s: "സ",
  h: "ഹ",
};

// Longest-key-first so e.g. "ksh"/"chh" are tried before "kh"/"ch" before "k"/"c".
const ALL_KEYS = [...Object.keys(VOWELS), ...Object.keys(CONSONANTS)].sort(
  (a, b) => b.length - a.length,
);

function transliterateWord(word: string): string {
  const lower = word.toLowerCase();
  let output = "";
  let pendingConsonant: string | null = null;
  let i = 0;

  while (i < lower.length) {
    const key = ALL_KEYS.find((candidate) => lower.startsWith(candidate, i));
    if (!key) {
      // Unrecognized letter (x, q, z, …) — flush any pending consonant bare and
      // pass the character through rather than silently dropping it.
      if (pendingConsonant) {
        output += pendingConsonant;
        pendingConsonant = null;
      }
      output += word[i];
      i += 1;
      continue;
    }

    if (key in VOWELS) {
      const { independent, matra } = VOWELS[key];
      if (pendingConsonant) {
        output += pendingConsonant + matra;
        pendingConsonant = null;
      } else {
        output += independent;
      }
    } else {
      if (pendingConsonant) {
        // Two consonants with no vowel between them — close the first with a
        // virama so the pair reads as a cluster (e.g. "ashraf" -> ...ശ്ര...).
        output += pendingConsonant + VIRAMA;
      }
      pendingConsonant = CONSONANTS[key];
    }
    i += key.length;
  }

  if (pendingConsonant) {
    output += pendingConsonant + VIRAMA;
  }

  return output;
}

/**
 * Converts Manglish (Malayalam typed phonetically in Latin letters, e.g. "vidya")
 * into Malayalam script, leaving everything that isn't a run of Latin letters —
 * spaces, punctuation, digits, already-Malayalam text — untouched. That means it's
 * safe to run on a field that's a mix of accepted Malayalam and newly-typed Manglish.
 */
export function transliterateToMalayalam(input: string): string {
  return input.replace(/[a-zA-Z]+/g, (word) => transliterateWord(word));
}
