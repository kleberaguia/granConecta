// ResultContext.tsx
import { createContext, useContext, useState } from "react";

const ResultContext = createContext<any>(null);

export function ResultProvider({ children }: { children: React.ReactNode }) {
  const [result, setResult] = useState<{ html: string; css: string }>({ html: "", css: "" });
  return (
    <ResultContext.Provider value={{ result, setResult }}>
      {children}
    </ResultContext.Provider>
  );
}
export function useResult() {
  const context = useContext(ResultContext);
  if (context === undefined || context === null) {
    throw new Error("useResult deve ser utilizado dentro de um ResultProvider. Verifique se as rotas estão dentro do GeradorContextWrapper no App.tsx.");
  }
  return context;
}