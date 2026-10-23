export class SafeJsonParse {

  static parse(content: string): any {

    if (!content) return {};

    try {
      return JSON.parse(content);
    } catch {}

    try {

      const cleaned = this.cleanJson(content);

      return JSON.parse(cleaned);

    } catch (e) {

      console.error("❌ JSON INVÁLIDO FINAL:");
      console.error(content);

      return {};
    }
  }

  private static cleanJson(content: string): string {

    return content

      // remove markdown
      .replace(/```json/g, "")
      .replace(/```/g, "")

      // remove caracteres invisíveis
      .replace(/[\u0000-\u001F]+/g, "")

      // remove trailing commas
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")

      .trim();
  }
}