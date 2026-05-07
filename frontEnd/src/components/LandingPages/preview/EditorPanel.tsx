import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Palette, Layout, Settings, Image as ImageIcon,
  HelpCircle, Footprints, Eye, EyeOff,
  GripVertical, Info, Star, Rocket,
  ShoppingBag, ClipboardCheck,
  Briefcase
} from "lucide-react";

import { AccordionItem, ColorPicker, InputField } from "./EditorComponentes/EditorUI";
import { HeroEditor } from "./EditorComponentes/HeroEditor";
import { HeaderEditor } from "./EditorComponentes/HeaderEditor";
import { GalleryEditor } from "./EditorComponentes/GalleryEditor";
import { FooterEditor } from "./EditorComponentes/FooterEditor";
import { SortableSections } from "./SortableSections";
import { AboutEditor } from "./EditorComponentes/AboutEditor";
import { TestimonialsEditor } from "./EditorComponentes/TestimonialsEditor";
import { FaqEditor } from "./EditorComponentes/FaqEditor";
import { VitrineEditor } from "./EditorComponentes/VitrineEditor";
import { CTAEditor } from "./EditorComponentes/CTAEditor";
import api from "../../../api/api";
import toast from "react-hot-toast";
import { slugify } from "../../../utils/slugify";
import { ServicesEditor } from "./EditorComponentes/ServicesEditor";
import { API_URL } from "../../../utils/config";

/**
 * ✅ VisibilityToggle (Sub-componente)
 * Responsável apenas pela interface de ligar/desligar seções.
 */
const VisibilityToggle = ({ section, aiData, onToggle }: any) => {
  const key = `show_${section}`;
  const isVisible = aiData[key] !== false;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle(key, !isVisible);
      }}
      className={`p-1 rounded-md transition-colors ${isVisible ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300 hover:bg-gray-100'}`}
    >
      {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );
};

const themes = [
  {
    "name": "Luxury Minimal",
    "colors": {
      "primary": "#000000",
      "secondary": "#FFD700",
      "background": "#FFFFFF",
      "accent": "#C0A060"
    },
    "typography": {
      "title": "Playfair Display",
      "body": "Lato"
    },
    "style": "Minimalista, sofisticado, com detalhes dourados sutis"
  },
  {
    "name": "Tech Futurista",
    "colors": {
      "primary": "#0A0A0A",
      "secondary": "#00FFFF",
      "background": "#1C1C1C",
      "accent": "#8A2BE2"
    },
    "typography": {
      "title": "Orbitron",
      "body": "Montserrat"
    },
    "style": "Futurista, gradientes neon, elementos geométricos"
  },
  {
    "name": "Nature Orgânica",
    "colors": {
      "primary": "#2E8B57",
      "secondary": "#F5F5DC",
      "background": "#FFFFFF",
      "accent": "#8B4513"
    },
    "typography": {
      "title": "Quicksand",
      "body": "Nunito"
    },
    "style": "Natural, sustentável, com texturas orgânicas"
  },
  {
    "name": "Creative Pop",
    "colors": {
      "primary": "#FF1493",
      "secondary": "#FFD700",
      "background": "#00CED1",
      "accent": "#000000"
    },
    "typography": {
      "title": "Poppins",
      "body": "Baloo"
    },
    "style": "Colorido, divertido, com blocos de cor e ilustrações"
  },
  {
    "name": "Corporate Premium",
    "colors": {
      "primary": "#001F3F",
      "secondary": "#AAAAAA",
      "background": "#FFFFFF",
      "accent": "#C0C0C0"
    },
    "typography": {
      "title": "Helvetica Neue",
      "body": "Roboto"
    },
    "style": "Profissional, modular, com gráficos sofisticados"
  }

]

export function EditorPanel({
  aiData,
  primaryColor,
  setPrimaryColor,
  bodyBgColor,
  setBodyBgColor,
  textColor,
  setTextColor,
  handleInputChange,
  onSave,
  isPrestador,
  storeId,
  categoriaTipo,
  setEstilos
}: any) {

  const [openSection, setOpenSection] = useState<string | null>("design");

  // ✅ CENTRAL DE REFERÊNCIAS (Refs)
  // Declaradas aqui no topo para serem distribuídas aos editores filhos.
  const capaFileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const floatingFileInputRef = useRef<HTMLInputElement>(null); // Corrigido: fora do sub-componente



  const behavior = useMemo(() => {
    const t = String(categoriaTipo || "").toLowerCase().trim();

    console.log('aiData ', aiData)

    // Se vier 'loja', 'vendas', ou for o ID 50 (se você quiser forçar pelo ID)
    if (t === 'loja' || t === 'vendedor') return 'loja';

    return 'servico'; // padrão
  }, [categoriaTipo]);

  const ehLoja = behavior === 'loja';
  const ehServico = behavior === 'servico';

  const habilitarListasExtras = useMemo(() => {
    return (aiData.combos && Array.isArray(aiData.combos)) ||
      (aiData.bebidas && Array.isArray(aiData.bebidas));
  }, [aiData.combos, aiData.bebidas]);

  const toggle = useCallback((id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  }, []);

  // --- HELPERS DE RENDERIZAÇÃO E UPLOAD ---
  const handleFooterLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleInputChange("footer_logo_url", reader.result);
      reader.readAsDataURL(file);
    }
  }, [handleInputChange]);

  const renderInput = useCallback((label: string, value: string, field: string) => (
    <div className="flex flex-col gap-1 mb-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-medium outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  ), [handleInputChange]);

  const handleCapaUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Arquivo selecionado:", file.name, file.size); // Debug 1

    const loading = toast.loading("Subindo capa...");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/lojas/store/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // Adicione isso para monitorar o progresso no console
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log(`Upload: ${progress}%`);
        }
      });

      console.log("Resposta completa do servidor:", response.data); // Debug 2

      const { filename } = response.data;

      if (filename) {
        handleInputChange("capa_url", filename);
        toast.success("Capa ok!", { id: loading });
      } else {
        // Caso o backend retorne 200 mas sem o filename
        toast.error("Resposta do servidor incompleta", { id: loading });
      }
    } catch (error: any) {
      console.error("Erro detalhado:", error.response?.data || error.message);
      toast.error(error.response?.data?.error || "Erro no upload", { id: loading });
    }
  }, [handleInputChange]);

  return (
    <div className="w-full lg:w-96 bg-white shadow-2xl rounded-2xl flex flex-col h-[90vh] border-r overflow-hidden">
      <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <div>
          <h3 className="text-xl font-black italic text-gray-800">Console Editor</h3>
          <p className="text-[9px] text-gray-400 font-bold uppercase">
            {isPrestador ? "Modo Prestador" : "Modo Vendedor"} • {behavior}
          </p>
        </div>
        <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-bold uppercase">v2.5</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-gray-50/30">

        {/* --- CONFIGURAÇÕES GERAIS --- */}
        <AccordionItem title="Configurações Gerais" id="store_settings" active={openSection} onToggle={toggle} icon={<Settings size={16} className="text-green-600" />}>
          <div className="space-y-4 p-1">
            <InputField
              label="Nome do Negócio"
              value={aiData.store_name}
              onChange={(v: string) => handleInputChange("store_name", v)}
            />

            {/* NOVO CAMPO: Slug da Loja */}
            <InputField
              label="Link da Página (Slug)"
              value={aiData.store_slug}
              onChange={(v: string) => handleInputChange("store_slug", slugify(v))}
            />

            <InputField
              label="WhatsApp"
              value={aiData.store_whatsapp}
              onChange={(v: string) => handleInputChange("store_whatsapp", v)}
            />

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Capa Marketplace</label>
              <div
                onClick={() => capaFileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 bg-white h-24 flex items-center justify-center"
              >
                {aiData.capa_url ? (
                  <img src={`${API_URL}/uploads/images/${aiData.capa_url}`} className="w-full h-full object-cover" alt="Capa" />
                ) : (
                  <ImageIcon size={20} className="text-gray-300" />
                )}
              </div>
              <input
                type="file"
                ref={capaFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCapaUpload}
              />
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Identidade Visual" id="design" active={openSection} onToggle={toggle} icon={<Palette size={16} />}>
          <div className="flex flex-col gap-4 p-2">

            {/* Lista de Super Temas */}
            <div className="grid grid-cols-1 gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Super Temas Premium</span>
              {themes.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setEstilos({
                      primaryColor: theme.colors.primary,
                      bodyBgColor: theme.colors.background,
                      // Se o fundo for branco, o texto deve ser escuro; se for escuro, o texto deve ser claro
                      textColor: theme.colors.background === "#FFFFFF" ? "#1a1a1a" : "#fafafa",
                      fontFamily: theme.typography.title
                    });
                  }}
                  className={`group flex flex-col p-3 border rounded-xl transition-all text-left bg-white ${primaryColor === theme.colors.primary ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-100 hover:border-blue-300'
                    }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-gray-700">{theme.name}</span>
                    <div className="flex -space-x-1.5">
                      <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.colors.primary }} />
                      <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.colors.secondary }} />
                      <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.colors.background }} />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">{theme.style}</p>
                </button>
              ))}
            </div>

            <hr className="border-gray-100" />

            {/* Ajuste Manual (ColorPickers) */}
            <div className="grid grid-cols-3 gap-2">
              <ColorPicker label="Tema" value={primaryColor} onChange={setPrimaryColor} />
              <ColorPicker label="Fundo" value={bodyBgColor} onChange={setBodyBgColor} />
              <ColorPicker label="Texto" value={textColor} onChange={setTextColor} />
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Cabeçalho" id="header" active={openSection} onToggle={toggle} icon={<Settings size={16} />}>
          <HeaderEditor aiData={aiData} handleInputChange={handleInputChange} logoFileInputRef={logoFileInputRef} textColor={textColor} />
        </AccordionItem>

        <AccordionItem
          title="Capa (Hero)" id="hero" active={openSection} onToggle={toggle} icon={<Layout size={16} />}
          action={<VisibilityToggle section="hero" aiData={aiData} onToggle={handleInputChange} />}
        >
          <HeroEditor
            aiData={aiData}
            handleInputChange={handleInputChange}
            heroFileInputRef={heroFileInputRef}
            floatingFileInputRef={floatingFileInputRef} // ✅ Passando Ref obrigatória
            primaryColor={primaryColor}

          />
        </AccordionItem>

        {/* --- 🟢 SEÇÕES LOJA --- */}
        {ehLoja && (
          <React.Fragment key="loja-group">
            <AccordionItem
              title={aiData.produtos_titulo || "Vitrine"} id="vitrine" active={openSection} onToggle={toggle}
              icon={<ShoppingBag size={16} className="text-orange-600" />}
              action={<VisibilityToggle section="vitrine" aiData={aiData} onToggle={handleInputChange} />}
            >
              <VitrineEditor field="produtos" aiData={aiData} handleInputChange={handleInputChange} primaryColor={primaryColor} store_id={storeId} />
            </AccordionItem>

            {habilitarListasExtras && (
              <AccordionItem title="Listas Adicionais" id="extras" active={openSection} onToggle={toggle} icon={<ShoppingBag size={16} className="text-red-500" />}>
                <div className="space-y-6">
                  {aiData.combos && (
                    <div className="border-b pb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase">Combos</span>
                        <VisibilityToggle section="combos" aiData={aiData} onToggle={handleInputChange} />
                      </div>
                      {aiData.show_combos !== false && <VitrineEditor field="combos" aiData={aiData} handleInputChange={handleInputChange} store_id={storeId} primaryColor={primaryColor} />}
                    </div>
                  )}
                  {aiData.bebidas && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase">Bebidas</span>
                        <VisibilityToggle section="bebidas" aiData={aiData} onToggle={handleInputChange} />
                      </div>
                      {aiData.show_bebidas !== false && <VitrineEditor field="bebidas" aiData={aiData} handleInputChange={handleInputChange} store_id={storeId} primaryColor={primaryColor} />}
                    </div>
                  )}
                </div>
              </AccordionItem>
            )}
          </React.Fragment>
        )}

        {/* --- 🔵 SEÇÕES SERVIÇO --- */}
        {ehServico && (
          <React.Fragment key="servico-group">
            <AccordionItem
              title="Galeria" id="gallery" active={openSection} onToggle={toggle}
              icon={<ImageIcon size={16} className="text-blue-600" />}
              action={<VisibilityToggle section="gallery" aiData={aiData} onToggle={handleInputChange} />}
            >
              <GalleryEditor aiData={aiData} handleInputChange={handleInputChange} galleryFileInputRef={galleryFileInputRef} />
            </AccordionItem>
            <AccordionItem
              title={aiData.services_title || "Nossos Serviços"}
              id="services"
              active={openSection}
              onToggle={toggle}
              icon={<Briefcase size={16} className="text-orange-500" />}
              action={<VisibilityToggle section="services" aiData={aiData} onToggle={handleInputChange} />}
            >
              <ServicesEditor
                aiData={aiData}
                handleInputChange={handleInputChange}
                primaryColor={primaryColor}
              />
            </AccordionItem>
            <AccordionItem
              title="Iscas (Leads)" id="iscas" active={openSection} onToggle={toggle}
              icon={<ClipboardCheck size={16} className="text-purple-600" />}
              action={<VisibilityToggle section="lead_magnet" aiData={aiData} onToggle={handleInputChange} />}
            >
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Estilo do Layout</label>
                    <select
                      value={aiData.magnet_layout || "classic"}
                      onChange={(e) => handleInputChange("magnet_layout", e.target.value)}
                      className="w-full p-2 bg-gray-50 border rounded-lg text-[11px] font-bold outline-none"
                    >
                      <option value="classic">Clássico</option>
                      <option value="modern">Moderno</option>
                      <option value="glass">Glassmorphism</option>
                      <option value="split">Split Image</option>
                      <option value="minimal">Minimalista</option>
                    </select>
                  </div>
                  {/* NOVO: COR DE FUNDO DA SEÇÃO */}
                  <ColorPicker
                    label="Fundo da Seção"
                    value={aiData.magnet_bg_section || "#ffffff"}
                    onChange={(v: string) => handleInputChange("magnet_bg_section", v)}
                  />
                </div>

                <InputField label="Título da Isca" value={aiData.magnet_titulo} onChange={(v: string) => handleInputChange("magnet_titulo", v)} />
                <InputField label="Subtítulo/Descrição" value={aiData.magnet_subtitulo} onChange={(v: string) => handleInputChange("magnet_subtitulo", v)} isLong />

                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Texto do Botão" value={aiData.magnet_btn} onChange={(v: string) => handleInputChange("magnet_btn", v)} />
                  <ColorPicker label="Cor do Botão" value={aiData.magnet_btn_bg || primaryColor} onChange={(v: string) => handleInputChange("magnet_btn_bg", v)} />
                </div>
              </div>
            </AccordionItem>
          </React.Fragment>
        )}

        <AccordionItem title="Sobre Nós" id="sobre" active={openSection} onToggle={toggle} icon={<Info size={16} />} action={<VisibilityToggle section="sobre" aiData={aiData} onToggle={handleInputChange} />}>
          <AboutEditor aiData={aiData} handleInputChange={handleInputChange} />
        </AccordionItem>

        <AccordionItem title="CTA" id="cta" active={openSection} onToggle={toggle} icon={<Rocket size={16} />} action={<VisibilityToggle section="cta" aiData={aiData} onToggle={handleInputChange} />}>
          <CTAEditor aiData={aiData} handleInputChange={handleInputChange} />
        </AccordionItem>

        <AccordionItem title="Depoimentos" id="testimonials" active={openSection} onToggle={toggle} icon={<Star size={16} />} action={<VisibilityToggle section="testimonials" aiData={aiData} onToggle={handleInputChange} />}>
          <TestimonialsEditor aiData={aiData} handleInputChange={handleInputChange} />
        </AccordionItem>

        <AccordionItem title="FAQ" id="faq" active={openSection} onToggle={toggle} icon={<HelpCircle size={16} />} action={<VisibilityToggle section="faq" aiData={aiData} onToggle={handleInputChange} />}>
          <FaqEditor aiData={aiData} handleInputChange={handleInputChange} />
        </AccordionItem>

        <AccordionItem title="Rodapé" id="footer" active={openSection} onToggle={toggle} icon={<Footprints size={16} />} action={<VisibilityToggle section="footer" aiData={aiData} onToggle={handleInputChange} />}>
          <FooterEditor
            aiData={aiData}
            handleInputChange={handleInputChange}
            footerLogoInputRef={footerLogoInputRef}
            renderInput={renderInput} // ✅ Passando Prop obrigatória
            handleFooterLogoUpload={handleFooterLogoUpload} // ✅ Passando Prop obrigatória
          />
        </AccordionItem>

        <AccordionItem title="Ordem" id="structure" active={openSection} onToggle={toggle} icon={<GripVertical size={16} />}>
          <SortableSections aiData={aiData} handleInputChange={handleInputChange} />
        </AccordionItem>

      </div>

      <div className="p-4 border-t bg-white sticky bottom-0">
        <button onClick={onSave} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] shadow-lg hover:bg-blue-700 transition-all">
          <Rocket size={16} /> Publicar Site
        </button>
      </div>
    </div>
  );
}