export const parseStyledText = (text: string, highlightColor: string) => {
  if (!text) return "";

  return text
    // *texto* => destaque
    .replace(/\*(.*?)\*/g, `<span style="color:${highlightColor}" class="font-bold">$1</span>`)
    
    // _texto_ => itálico
    .replace(/\_(.*?)\_/g, `<span class="italic">$1</span>`)

    // ~texto~ => sublinhado
    .replace(/\~(.*?)\~/g, `<span class="underline">$1</span>`);
};