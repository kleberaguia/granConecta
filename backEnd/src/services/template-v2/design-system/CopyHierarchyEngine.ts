export type SupportingCopyRole = "supporting" | "statement" | "microcopy";

export class CopyHierarchyEngine {
  static classifySupportingCopy(value: string): SupportingCopyRole {
    const text = String(value || "").trim();
    if (!text) return "supporting";
    if (text.length <= 42 && !/[.!?]{2,}/.test(text)) return "statement";
    if (text.length <= 78) return "supporting";
    return "microcopy";
  }

  static splitTitle(value: string): { leading: string; accent: string } {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    if (words.length <= 1) return { leading: words[0] || "", accent: "" };

    const accentSize = words.length >= 6 ? 2 : 1;
    return {
      leading: words.slice(0, -accentSize).join(" "),
      accent: words.slice(-accentSize).join(" "),
    };
  }
}
