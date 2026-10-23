import { useEffect, useRef, useState } from "react";
import { useResult } from "./ResultContext";
import { useNavigate } from "react-router-dom";

const meusProdutosDoBanco = [
    { id: 1, url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80' },
    { id: 2, url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80' },
    { id: 3, url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80' },
];

const COMPONENT_LIBRARY = {
    hero: `
        <section class="luxury-hero added-section" style="padding: 100px 20px; color: white; min-height: 500px; display: flex; align-items: center; background: #1a1a1a; background-size: cover; background-position: center; background-repeat: no-repeat;">
            <div style="max-width: 1100px; margin: 0 auto; width: 100%;">
                <h1 contenteditable="true" style="font-size: 48px; margin-bottom: 20px; font-family: serif;">Título do Seu Site</h1>
                <p contenteditable="true" style="font-size: 20px; opacity: 0.9; max-width: 600px;">Descreva seu valor principal aqui de forma clara e elegante.</p>
            </div>
        </section>`,
    vitrine: `
        <section class="added-section" style="padding: 60px 20px; background: #fff;">
            <div style="max-width: 1200px; margin: 0 auto; text-align: center;">
                <h2 contenteditable="true" style="font-family: serif; font-size: 32px;">Nossos Destaques</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-top: 30px;">
                    <div class="product-card" style="background: #fff; border: 1px solid #eee; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;">
                        <div class="product-img" style="height: 250px; width: 100%; background-image: url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80'); background-size: cover; background-position: center; cursor:pointer;"></div>
                        <div style="padding: 15px;">
                            <h4 contenteditable="true" style="margin: 0 0 10px; font-size: 18px;">Nome do Produto</h4>
                            <p style="color: #b8917b; font-weight: bold; font-size: 20px; margin-bottom: 15px;">R$ 00,00</p>
                            <button class="buy-button" style="width: 100%; padding: 12px; background: #b8917b; color: white; border: none; cursor: pointer; border-radius: 6px; font-weight: bold;">🛒 Comprar Agora</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>`,
    textoImagem: `
        <section class="added-section" style="padding: 80px 20px; background: #f9f9f9;">
            <div style="max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 50px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <h2 contenteditable="true" style="font-size: 36px; font-family: serif;">Sua História</h2>
                    <p contenteditable="true" style="color: #666; line-height: 1.6; font-size: 18px;">Descreva seus serviços ou missão aqui de forma detalhada.</p>
                </div>
                <div style="flex: 1; min-width: 300px; height: 400px; border-radius: 15px; overflow: hidden;">
                    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80" style="width: 100%; height: 100%; object-fit: cover; cursor:pointer;" />
                </div>
            </div>
        </section>`,
    depoimentos: `
        <section class="added-section" style="padding: 60px 20px; background: #fff;">
            <div style="max-width: 1000px; margin: 0 auto; text-align: center;">
                <h2 contenteditable="true" style="font-family: serif; font-size: 28px; margin-bottom: 40px;">O que dizem os clientes</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px;">
                    <div style="padding: 30px; background: #fdf8f5; border-radius: 20px; border: 1px solid #f1e4dc;">
                        <p contenteditable="true" style="font-style: italic; color: #555;">"Excelente atendimento e qualidade impecável."</p>
                        <h4 contenteditable="true" style="margin-top: 20px; color: #b8917b;">— Cliente Satisfeito</h4>
                    </div>
                </div>
            </div>
        </section>`,
    faq: `
        <section class="added-section" style="padding: 60px 20px; background: #f9f9f9;">
            <div style="max-width: 800px; margin: 0 auto;">
                <h2 contenteditable="true" style="text-align: center; font-family: serif; margin-bottom: 40px;">Dúvidas Frequentes</h2>
                <div style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">
                    <h4 contenteditable="true">Como funciona a entrega?</h4>
                    <p contenteditable="true" style="color: #777; font-size: 14px;">Entregamos em todo o Brasil com segurança.</p>
                </div>
            </div>
        </section>`,
    rodape: `
        <footer class="added-section" style="padding: 60px 20px; background: #1a1a1a; color: #fff; border-top: 1px solid #333;">
            <div style="max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px;">
                <div>
                    <div class="logo-placeholder" style="width: 150px; height: 60px; background: #333; display: flex; align-items: center; justify-content: center; border: 1px dashed #666; cursor: pointer; margin-bottom: 20px;">
                        <span style="font-size: 12px; color: #999;">Clique p/ Logo</span>
                    </div>
                    <p contenteditable="true" style="font-size: 14px; color: #aaa;">Sua marca, sua história.</p>
                </div>
                <div>
                    <h4 style="color: #b8917b; margin-bottom: 20px;">Redes Sociais</h4>
                    <div class="social-links" style="display: flex; gap: 10px;">
                        <a href="#" data-name="whatsapp" class="social-icon" style="color:#fff; text-decoration:none; font-size:12px; border:1px solid #444; padding:5px 10px; border-radius:4px; opacity: 0.3;">WhatsApp</a>
                        <a href="#" data-name="instagram" class="social-icon" style="color:#fff; text-decoration:none; font-size:12px; border:1px solid #444; padding:5px 10px; border-radius:4px; opacity: 0.3;">Instagram</a>
                    </div>
                </div>
            </div>
        </footer>`
};

export default function Preview() {
    const { result } = useResult();
    const navigate = useNavigate();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [activeElementId, setActiveElementId] = useState<string | null>(null);
    const [heroBg1, setHeroBg1] = useState("#1a1a1a");
    const [heroBg2, setHeroBg2] = useState("#3a2b22");
    const [heroDirection, setHeroDirection] = useState("to right");

    const applyStyle = (command: string, value: string | null = null) => {
        iframeRef.current?.contentDocument?.execCommand(command, false, value || "");
    };

    const addComponent = (key: keyof typeof COMPONENT_LIBRARY) => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
            const container = doc.querySelector('.luxury-container') || doc.body;
            const tempDiv = doc.createElement('div');
            tempDiv.innerHTML = COMPONENT_LIBRARY[key];
            container.appendChild(tempDiv.firstElementChild!);
        }
    };

    const updateHeroBackground = (style: string) => {
        const doc = iframeRef.current?.contentDocument;
        const hero = doc?.querySelector(".luxury-hero") as HTMLElement;
        if (hero) {
            hero.style.backgroundImage = style;
            hero.style.backgroundColor = "transparent";
            hero.style.backgroundSize = "cover";
            hero.style.backgroundPosition = "center";
            hero.style.backgroundRepeat = "no-repeat";
        }
    };

    const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const res = event.target?.result;
                if (typeof res === "string") updateHeroBackground(`url(${res})`);
            };
            reader.readAsDataURL(file);
        }
    };

    const changeHeroAlignment = (align: "left" | "center" | "right") => {
        const doc = iframeRef.current?.contentDocument;
        const hero = doc?.querySelector(".luxury-hero") as HTMLElement;
        if (hero) {
            hero.classList.remove("hero-align-left", "hero-align-center", "hero-align-right");
            hero.classList.add(`hero-align-${align}`);
        }
    };

    const selectPhotoFromDatabase = (url: string) => {
        const doc = iframeRef.current?.contentDocument;
        if (doc && activeElementId) {
            const el = doc.getElementById(activeElementId) as HTMLElement;
            if (el) {
                el.style.backgroundImage = `url(${url})`;
                el.style.backgroundSize = "cover"; // Padroniza o preenchimento
                el.style.backgroundPosition = "center";
                setIsGalleryOpen(false);
            }
        }
    };

    useEffect(() => {
        updateHeroBackground(`linear-gradient(${heroDirection}, ${heroBg1}, ${heroBg2})`);
    }, [heroBg1, heroBg2, heroDirection]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === 'OPEN_GALLERY') {
                setActiveElementId(event.data.elementId);
                setIsGalleryOpen(true);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSave = () => {
        const doc = iframeRef.current?.contentDocument;
        if (doc) {
            const cleanHtml = doc.body.cloneNode(true) as HTMLElement;
            cleanHtml.querySelectorAll('.del-btn').forEach(btn => btn.remove());
            cleanHtml.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
            
            const dataToSave = {
                html: cleanHtml.querySelector('.luxury-container')?.innerHTML,
                css: result.css,
                usuarioId: "usuarioId", // Conforme instrução
                condominioId: null       // Opcional conforme instrução
            };
            localStorage.setItem("landing_page_draft", JSON.stringify(dataToSave));
            alert("Landing Page salva com sucesso!");
        }
    };

    useEffect(() => {
        if (iframeRef.current && result.html) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                const scriptEditor = `
                <script>
                    document.body.contentEditable = 'true';
                    document.addEventListener('click', (e) => {
                        const target = e.target;
                        if(document.body.contentEditable !== 'true') return;

                        if (target.classList.contains('product-img')) {
                            const id = target.id || 'img-' + Date.now();
                            target.id = id;
                            window.parent.postMessage({ type: 'OPEN_GALLERY', elementId: id }, '*');
                        } 
                        else if (target.tagName === 'IMG' || target.closest('.logo-placeholder')) {
                            const placeholder = target.closest('.logo-placeholder') || target;
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.onchange = (ev) => {
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                    if(target.tagName === 'IMG') target.src = re.target.result;
                                    else placeholder.innerHTML = '<img src="'+re.target.result+'" style="max-height:100%; object-fit:contain;">';
                                };
                                reader.readAsDataURL(ev.target.files[0]);
                            };
                            input.click();
                        }

                        if (target.classList.contains('social-icon')) {
                            e.preventDefault();
                            const link = prompt("Link da Rede Social:");
                            if(link !== null) {
                                target.setAttribute('href', link || '#');
                                target.style.opacity = (link && link !== '#') ? "1" : "0.3";
                            }
                        }
                    }, true);

                    document.addEventListener('mouseover', (e) => {
                        const section = e.target.closest('section, footer');
                        if (section && !section.classList.contains('luxury-hero') && !section.querySelector('.del-btn')) {
                            const btn = document.createElement('button');
                            btn.innerHTML = '✕'; btn.className = 'del-btn';
                            btn.style = 'position:absolute; top:10px; right:10px; background:red; color:white; border:none; width:25px; height:25px; cursor:pointer; border-radius:50%; z-index:100; font-size:12px;';
                            btn.onclick = () => section.remove();
                            section.style.position = 'relative';
                            section.appendChild(btn);
                        }
                    });
                </script>`;

                const fullHtml = `
                    <html>
                        <head>
                            <style>
                                ${result.css}
                                .luxury-hero { display: flex; align-items: center; background-size: cover; background-position: center; min-height: 500px; }
                                .hero-align-left { justify-content: flex-start; text-align: left; }
                                .hero-align-center { justify-content: center; text-align: center; }
                                .hero-align-right { justify-content: flex-end; text-align: right; }
                                .product-img { background-size: cover !important; background-position: center !important; transition: 0.3s; }
                                .product-card:hover .product-img { transform: scale(1.02); }
                                [contenteditable]:focus { outline: 2px solid #b8917b; border-radius: 4px; }
                            </style>
                        </head>
                        <body>
                            <main class="luxury-container">${result.html}</main>
                            ${scriptEditor}
                        </body>
                    </html>`;
                doc.open(); doc.write(fullHtml); doc.close();
            }
        }
    }, [result]);

    return (
        <div style={containerStyle}>
            <div style={sidebarStyle}>
                <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Estúdio Design</h3>

                <div style={groupStyle}>
                    <label style={labelStyle}>Adicionar Seções</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button onClick={() => addComponent('hero')} style={blockBtnStyle}>➕ Hero</button>
                        <button onClick={() => addComponent('vitrine')} style={blockBtnStyle}>➕ Vitrine</button>
                        <button onClick={() => addComponent('textoImagem')} style={blockBtnStyle}>➕ Texto+Foto</button>
                        <button onClick={() => addComponent('depoimentos')} style={blockBtnStyle}>💬 Depoimentos</button>
                        <button onClick={() => addComponent('faq')} style={blockBtnStyle}>❓ FAQ</button>
                        <button onClick={() => addComponent('rodape')} style={blockBtnStyle}>👣 Rodapé</button>
                    </div>
                </div>

                <div style={groupStyle}>
                    <label style={labelStyle}>Fundo do Topo</label>
                    <input type="file" accept="image/*" onChange={handleHeroImageUpload} style={{ fontSize: "11px", marginBottom: '5px' }} />
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <input type="color" value={heroBg1} onChange={(e) => setHeroBg1(e.target.value)} style={colorCircle} />
                        <input type="color" value={heroBg2} onChange={(e) => setHeroBg2(e.target.value)} style={colorCircle} />
                    </div>
                    <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                        <button onClick={() => setHeroDirection("to right")} style={heroDirection === "to right" ? activeSmallBtn : smallBtnStyle}>👉</button>
                        <button onClick={() => setHeroDirection("to left")} style={heroDirection === "to left" ? activeSmallBtn : smallBtnStyle}>👈</button>
                        <button onClick={() => setHeroDirection("to bottom")} style={heroDirection === "to bottom" ? activeSmallBtn : smallBtnStyle}>👇</button>
                    </div>
                </div>

                <div style={groupStyle}>
                    <label style={labelStyle}>Alinhamento</label>
                    <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => changeHeroAlignment("left")} style={smallBtnStyle}>⬅️</button>
                        <button onClick={() => changeHeroAlignment("center")} style={smallBtnStyle}>⏺️</button>
                        <button onClick={() => changeHeroAlignment("right")} style={smallBtnStyle}>➡️</button>
                    </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                    <button onClick={() => navigate("/publicado")} style={btnStyle}>👁️ Ver Resultado</button>
                    <button onClick={handleSave} style={{ ...btnStyle, background: "#10b981", color: "white", border: "none" }}>💾 Salvar Agora</button>
                </div>
            </div>

            <div style={mainAreaStyle}>
                <div style={toolbarStyle}>
                    <button onClick={() => applyStyle("bold")} style={toolbarBtn}><b>B</b></button>
                    <button onClick={() => applyStyle("italic")} style={toolbarBtn}><i>I</i></button>
                    <input type="color" onChange={(e) => applyStyle("foreColor", e.target.value)} style={colorCircle} />
                </div>
                <iframe ref={iframeRef} style={iframeStyle} title="Editor" />
            </div>

            {isGalleryOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0 }}>Galeria do Banco</h3>
                            <button onClick={() => setIsGalleryOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                            {meusProdutosDoBanco.map(prod => (
                                <img key={prod.id} src={prod.url} onClick={() => selectPhotoFromDatabase(prod.url)} style={galleryImgStyle} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Estilos
const containerStyle: React.CSSProperties = { display: "flex", background: "#f1f5f9", height: "100vh", fontFamily: 'sans-serif' };
const sidebarStyle: React.CSSProperties = { width: "280px", background: "white", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", borderRight: "1px solid #ddd" };
const mainAreaStyle: React.CSSProperties = { flex: 1, padding: "20px", display: "flex", flexDirection: "column" };
const groupStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "#f8fafc", borderRadius: "8px" };
const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase" };
const colorCircle: React.CSSProperties = { width: "26px", height: "26px", border: "1px solid #ddd", borderRadius: "50%", cursor: "pointer", padding: "0" };
const btnStyle: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", cursor: "pointer", fontWeight: "bold", marginBottom: "8px", background: "#f1f5f9" };
const blockBtnStyle: React.CSSProperties = { padding: "8px", background: "white", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "11px", textAlign: 'left' };
const smallBtnStyle: React.CSSProperties = { flex: 1, padding: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer", borderRadius: "4px" };
const activeSmallBtn: React.CSSProperties = { ...smallBtnStyle, background: "#3b82f6", color: "white", borderColor: "#3b82f6" };
const toolbarStyle: React.CSSProperties = { background: "white", padding: "10px", borderRadius: "8px", display: "flex", gap: "10px", marginBottom: "15px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", alignItems: "center" };
const toolbarBtn: React.CSSProperties = { padding: "5px 12px", border: "1px solid #ddd", background: "white", cursor: "pointer", borderRadius: "4px" };
const iframeStyle: React.CSSProperties = { width: "100%", height: "100%", border: "none", background: "white", borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { background: 'white', padding: '20px', borderRadius: '12px', width: '450px', maxHeight: '80vh', overflowY: 'auto' };
const galleryImgStyle: React.CSSProperties = { width: '100%', height: '100px', objectFit: 'cover', cursor: 'pointer', borderRadius: '6px', border: '1px solid #eee' };