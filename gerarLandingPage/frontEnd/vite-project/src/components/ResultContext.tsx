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
  return useContext(ResultContext);
}
