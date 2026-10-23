import React, { useState, useCallback, useMemo } from "react";
import {
  Upload,
  // Layout,
  // Type,
  // MousePointer2,
  // AlignLeft,
  // AlignCenter,
  // AlignRight,
  // Maximize,
  // Highlighter,
  Trash2,
  //ChevronRight,
  Plus
} from "lucide-react";

import { InputField, ColorPicker } from "./EditorUI";

import toast from "react-hot-toast";

interface ISlide {
  titulo: string;
  subtitulo: string;
  bgUrl: string;
  buttonText: string;

  hero_align?: string;
  hero_layout_mode?: string;
  hero_img_position?: string;

  hero_solid_color?: string;
  hero_bg_type?: string;
  hero_grad_1?: string;
  hero_grad_2?: string;

  hero_title_color?: string;
  hero_sub_color?: string;

  hero_button_bg?: string;
  hero_button_color?: string;
}

interface HeroEditorProps {
  aiData: any;

  handleInputChange: (
    field: string,
    value: any
  ) => void;

  heroFileInputRef: React.RefObject<HTMLInputElement>;

  floatingFileInputRef?: React.RefObject<HTMLInputElement>;

  primaryColor: string;
}

export const HeroEditor = ({
  aiData,
  handleInputChange,
  heroFileInputRef,
  primaryColor
}: HeroEditorProps) => {

  // =========================================================================
  // 🔥 SAFETY
  // =========================================================================

  if (typeof handleInputChange !== "function") {
    console.error(
      "❌ HeroEditor: handleInputChange não foi passado"
    );

    return (
      <div className="p-4 text-red-500 text-sm">
        Erro interno no editor do Hero.
      </div>
    );
  }

  // =========================================================================
  // 🧠 STATES
  // =========================================================================

  // const [highlightWord, setHighlightWord] =
  //   useState("");

  // const [highlightColor, setHighlightColor] =
  //   useState(primaryColor || "#3b82f6");

  const [activeSlideIndex, setActiveSlideIndex] =
    useState(0);

  // =========================================================================
  // 🖼️ SLIDES
  // =========================================================================

  const slides: ISlide[] = useMemo(() => {
    return Array.isArray(aiData?.hero_slides)
      ? aiData.hero_slides
      : [];
  }, [aiData]);

  const temSlides = slides.length > 0;

  // =========================================================================
  // 🔥 ALTERAÇÃO GLOBAL
  // =========================================================================

  const handleSlideFieldChange = useCallback(
    (field: string, value: any) => {

      console.log(
        "✏️ HERO ALTERADO:",
        field,
        value
      );

      // ============================================================
      // MODO CARROSSEL
      // ============================================================

      if (temSlides) {

        const updatedSlides = slides.map(
          (slide: ISlide, idx: number) => {

            if (idx === activeSlideIndex) {
              return {
                ...slide,
                [field]: value
              };
            }

            return slide;
          }
        );

        handleInputChange(
          "hero_slides",
          updatedSlides
        );

        return;
      }

      // ============================================================
      // MODO HERO ÚNICO
      // ============================================================

      handleInputChange(field, value);

    },
    [
      handleInputChange,
      slides,
      activeSlideIndex,
      temSlides
    ]
  );

  // =========================================================================
  // 🔥 HELPERS
  // =========================================================================

  const getSlideValue = (
    field: keyof ISlide,
    fallbackField?: string
  ) => {

    // MODO SLIDE
    if (temSlides) {
      return (
        slides?.[activeSlideIndex]?.[field] || ""
      );
    }

    // MODO NORMAL
    if (fallbackField) {
      return aiData?.[fallbackField] || "";
    }

    return "";
  };

  // =========================================================================
  // 📤 UPLOAD HERO
  // =========================================================================

  const handleHeroUpload = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {

      const file = e.target.files?.[0];

      if (!file) return;

      const reader = new FileReader();

      reader.onloadend = () => {

        const image = reader.result;

        // SLIDE
        if (temSlides) {

          const updatedSlides = slides.map(
            (
              slide: ISlide,
              idx: number
            ) => {

              if (idx === activeSlideIndex) {
                return {
                  ...slide,
                  bgUrl: image
                };
              }

              return slide;
            }
          );

          handleInputChange(
            "hero_slides",
            updatedSlides
          );

        } else {

          // HERO NORMAL
          handleInputChange(
            "hero_background",
            image
          );
        }

        toast.success(
          "Imagem do hero atualizada!"
        );
      };

      reader.readAsDataURL(file);

    },
    [
      activeSlideIndex,
      slides,
      temSlides,
      handleInputChange
    ]
  );

  // =========================================================================
  // ➕ ADD SLIDE
  // =========================================================================

  const addSlide = () => {

    const newSlide: ISlide = {
      titulo: "Novo Slide",
      subtitulo: "Seu subtítulo aqui",
      bgUrl: "",
      buttonText: "Saiba Mais",

      hero_align: "center",
      hero_layout_mode: "center",
      hero_img_position: "center",

      hero_solid_color: "#111827",

      hero_bg_type: "image",

      hero_grad_1: "#111827",
      hero_grad_2: "#1f2937",

      hero_title_color: "#ffffff",
      hero_sub_color: "#e5e7eb",

      hero_button_bg: primaryColor,
      hero_button_color: "#ffffff"
    };

    const updatedSlides = [
      ...slides,
      newSlide
    ];

    handleInputChange(
      "hero_slides",
      updatedSlides
    );

    setActiveSlideIndex(
      updatedSlides.length - 1
    );
  };

  // =========================================================================
  // 🗑️ REMOVE SLIDE
  // =========================================================================

  const removeSlide = (index: number) => {

    const updatedSlides = slides.filter(
      (_, idx) => idx !== index
    );

    handleInputChange(
      "hero_slides",
      updatedSlides
    );

    setActiveSlideIndex(0);
  };

  // =========================================================================
  // 🚀 RENDER
  // =========================================================================

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">

      {/* ========================================================= */}
      {/* 🎞️ SLIDES */}
      {/* ========================================================= */}

      {temSlides && (
        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">

          <div className="flex items-center justify-between mb-3">

            <h3 className="text-xs font-black uppercase text-gray-500">
              Slides do Hero
            </h3>

            <button
              onClick={addSlide}
              className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg"
            >
              <Plus size={12} />
              Novo
            </button>
          </div>

          <div className="space-y-2">

            {slides.map((slide, idx) => (

              <div
                key={idx}
                className={`
                  flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all
                  ${
                    activeSlideIndex === idx
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-100 bg-white"
                  }
                `}
                onClick={() =>
                  setActiveSlideIndex(idx)
                }
              >

                <div>
                  <p className="text-xs font-bold">
                    {slide.titulo || `Slide ${idx + 1}`}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(idx);
                  }}
                  className="text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 📝 TEXTOS */}
      {/* ========================================================= */}

      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">

        <InputField
          label="Título do Hero"
          value={
            getSlideValue(
              "titulo",
              "hero_title"
            ) as string
          }
          onChange={(v: string) =>
            handleSlideFieldChange(
              "titulo",
              v
            )
          }
          isLong
        />

        <InputField
          label="Subtítulo"
          value={
            getSlideValue(
              "subtitulo",
              "hero_subtitle"
            ) as string
          }
          onChange={(v: string) =>
            handleSlideFieldChange(
              "subtitulo",
              v
            )
          }
          isLong
        />

        <InputField
          label="Texto do Botão"
          value={
            getSlideValue(
              "buttonText",
              "hero_button_text"
            ) as string
          }
          onChange={(v: string) =>
            handleSlideFieldChange(
              "buttonText",
              v
            )
          }
        />
      </div>

      {/* ========================================================= */}
      {/* 🖼️ IMAGEM */}
      {/* ========================================================= */}

      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">

        <div className="flex items-center justify-between mb-3">

          <h3 className="text-xs font-black uppercase text-gray-500">
            Imagem Hero
          </h3>

          <button
            onClick={() =>
              heroFileInputRef.current?.click()
            }
            className="flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold"
          >
            <Upload size={14} />
            Upload
          </button>
        </div>

        <input
          ref={heroFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleHeroUpload}
        />

        {(getSlideValue("bgUrl") ||
          aiData?.hero_background) && (
          <img
            src={
              (getSlideValue("bgUrl") as string) ||
              aiData?.hero_background
            }
            className="w-full h-40 object-cover rounded-xl"
          />
        )}
      </div>

      {/* ========================================================= */}
      {/* 🎨 CORES */}
      {/* ========================================================= */}

      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">

        <h3 className="text-xs font-black uppercase text-gray-500 mb-4">
          Cores do Hero
        </h3>

        <div className="grid grid-cols-2 gap-4">

          <ColorPicker
            label="Título"
            value={
              (getSlideValue(
                "hero_title_color"
              ) as string) || "#ffffff"
            }
            onChange={(v: string) =>
              handleSlideFieldChange(
                "hero_title_color",
                v
              )
            }
          />

          <ColorPicker
            label="Subtítulo"
            value={
              (getSlideValue(
                "hero_sub_color"
              ) as string) || "#e5e7eb"
            }
            onChange={(v: string) =>
              handleSlideFieldChange(
                "hero_sub_color",
                v
              )
            }
          />

          <ColorPicker
            label="Botão"
            value={
              (getSlideValue(
                "hero_button_bg"
              ) as string) || primaryColor
            }
            onChange={(v: string) =>
              handleSlideFieldChange(
                "hero_button_bg",
                v
              )
            }
          />

          <ColorPicker
            label="Texto Botão"
            value={
              (getSlideValue(
                "hero_button_color"
              ) as string) || "#ffffff"
            }
            onChange={(v: string) =>
              handleSlideFieldChange(
                "hero_button_color",
                v
              )
            }
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📐 ALINHAMENTO */}
      {/* ========================================================= */}

      <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">

        <h3 className="text-xs font-black uppercase text-gray-500 mb-3">
          Alinhamento
        </h3>

        <select
          value={
            (getSlideValue(
              "hero_align",
              "hero_align"
            ) as string) || "center"
          }
          onChange={(e) =>
            handleSlideFieldChange(
              "hero_align",
              e.target.value
            )
          }
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold"
        >
          <option value="left">
            Esquerda
          </option>

          <option value="center">
            Centro
          </option>

          <option value="right">
            Direita
          </option>
        </select>
      </div>
    </div>
  );
};