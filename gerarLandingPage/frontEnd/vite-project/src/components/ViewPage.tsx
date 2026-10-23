import { useEffect, useRef } from "react";

export default function ViewPage() {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        // 1. Busca os dados salvos pelo editor
        const savedData = localStorage.getItem("landing_page_draft");
        
        if (savedData && iframeRef.current) {
            const { html, css } = JSON.parse(savedData);
            const doc = iframeRef.current.contentDocument;

            if (doc) {
                const fullHtml = `
                    <!DOCTYPE html>
                    <html lang="pt-BR">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Great+Vibes&family=Inter:wght@400;600&display=swap" rel="stylesheet">
                        <style>
                            ${css}
                        </style>
                    </head>
                    <body>
                        ${html}
                        </body>
                    </html>
                `;
                doc.open();
                doc.write(fullHtml);
                doc.close();

                // 2. IMPORTANTE: Garantir que o modo edição esteja DESLIGADO
                doc.body.contentEditable = "false";
                
                // Remove qualquer feedback visual de edição (bordas pontilhadas)
                const style = doc.createElement('style');
                style.textContent = `[contenteditable]:hover { outline: none !important; } img:hover { outline: none !important; }`;
                doc.head.appendChild(style);
            }
        }
    }, []);

    return (
        <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
            <iframe
                ref={iframeRef}
                title="Landing Page Publicada"
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none"
                }}
            />
        </div>
    );
}