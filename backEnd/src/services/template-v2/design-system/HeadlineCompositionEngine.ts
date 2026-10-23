import type { VisualDNA } from "./VisualDNAEngine";

export type HeadlineSegment = {
  text: string;
  emphasis?: boolean;
  italic?: boolean;
};

export type HeadlineComposition = {
  treatment: VisualDNA["headlineTreatment"];
  lines: HeadlineSegment[][];
  accentWord?: string;
};

export class HeadlineCompositionEngine {
  static resolve(title: string, dna: VisualDNA): HeadlineComposition {
    const clean = String(title || "").replace(/\s+/g, " ").trim();
    if (!clean) return { treatment: dna.headlineTreatment, lines: [] };

    const words = clean.split(" ");
    const accentIndex = resolveAccentIndex(words);
    const accentWord = words[accentIndex];

    const targetLines =
      dna.headlineTreatment === "cinematic-stack" ? 3 :
      dna.headlineTreatment === "commerce-bold" ? 2 :
      clean.length > 48 ? 3 : 2;

    const lineWords = balanceWords(words, targetLines);

    return {
      treatment: dna.headlineTreatment,
      accentWord,
      lines: lineWords.map((line, lineIndex) =>
        line.map((word) => ({
          text: word,
          emphasis: word === accentWord &&
            ["accent-word", "mixed-scale", "editorial-break"].includes(dna.headlineTreatment),
          italic: word === accentWord &&
            ["quiet-luxury", "editorial-break"].includes(dna.headlineTreatment),
        })),
      ),
    };
  }

  static render(title: string, dna: VisualDNA): string {
    const composition = this.resolve(title, dna);
    if (!composition.lines.length) return "";

    return `<h1 class="gc-art-headline gc-art-headline--${escapeAttr(composition.treatment)}">` +
      composition.lines.map((line, index) =>
        `<span class="gc-art-headline__line gc-art-headline__line--${index + 1}">` +
        line.map(segment => {
          const classes = [
            "gc-art-headline__word",
            segment.emphasis ? "is-emphasis" : "",
            segment.italic ? "is-italic" : "",
          ].filter(Boolean).join(" ");
          return `<span class="${classes}">${escapeHtml(segment.text)}</span>`;
        }).join(" ") +
        `</span>`
      ).join("") +
      `</h1>`;
  }
}

function resolveAccentIndex(words: string[]): number {
  const meaningful = words
    .map((word, index) => ({ word: normalize(word), index }))
    .filter(({ word }) => word.length >= 5 && !STOP.has(word));

  if (meaningful.length) {
    meaningful.sort((a, b) => b.word.length - a.word.length);
    return meaningful[0]!.index;
  }
  return Math.max(0, Math.floor(words.length / 2));
}

function balanceWords(words: string[], lineCount: number): string[][] {
  if (words.length <= lineCount) return words.map(word => [word]);

  const total = words.reduce((sum, word) => sum + word.length + 1, 0);
  const target = total / lineCount;
  const result: string[][] = [[]];
  let current = 0;

  for (const word of words) {
    const active = result[result.length - 1]!;
    const projected = current + word.length + (active.length ? 1 : 0);

    if (projected > target && result.length < lineCount && active.length) {
      result.push([word]);
      current = word.length;
    } else {
      active.push(word);
      current = projected;
    }
  }
  return result;
}

const STOP = new Set(["para", "com", "uma", "como", "seus", "suas", "voce", "você", "mais", "deixe"]);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\w]/g, "");
}

function escapeHtml(value: string): string {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
