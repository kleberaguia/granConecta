// templates/components/HeroComponent.ts

interface HeroComponentProps {
  aiData: any;

  variant?: string;

  estilo?: any;

  tokens?: any;
}

export const HeroComponent = ({
  aiData,
  variant = "modern-center",
  estilo,
  tokens
}: HeroComponentProps) => {

  /**
   * =====================================================
   * DADOS CORRETOS DO JSON
   * =====================================================
   */
  const titulo =
    aiData?.hero?.title ||
    aiData?.nome_marca ||
    "Sua Empresa";

  const subtitulo =
    aiData?.hero?.subtitle ||
    aiData?.descricao ||
    "";

  const ctaTexto =
    aiData?.cta?.buttonText ||
    "FALAR AGORA";

  const telefone =
    aiData?.telefone
      ?.replace(/\D/g, "") ||
    "55119999999";

  const heroImage =
    aiData?.hero?.image ||
    aiData?.foto_hero_url ||
    aiData?.hero_image ||
    aiData?.bgUrl ||
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1600&auto=format&fit=crop";

  const logo =
    aiData?.foto_perfil_url ||
    aiData?.logo ||
    "";

  const primary =
    estilo?.primary_color ||
    "#DE1F5A";

  const textColor =
    estilo?.body_text_color ||
    "#ffffff";

  const borderRadius =
    tokens?.borderRadius ||
    "20px";

  /**
   * =====================================================
   * HERO MJV IMPACT
   * =====================================================
   */
  if (variant === "gym-impact") {
    return `
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,900;1,900&display=swap" rel="stylesheet">
      
      <section
        id="hero-section"
        class="relative min-h-screen w-full flex items-center justify-start bg-[#0E0E0E] overflow-hidden py-24 px-6 md:px-20 lg:px-32 bg-cover bg-right md:bg-right-top bg-no-repeat"
        style="
          background-image: linear-gradient(to right, #0E0E0E 0%, #0E0E0E 45%, rgba(14,14,14,0.6) 70%, transparent 100%), url('${heroImage}');
        "
      >
        <div class="relative z-10 max-w-4xl w-full text-left flex flex-col items-start">
          
          <div class="border-l-[6px] pl-6 md:pl-8 mb-6" style="border-color: ${primary};">
            <h1 
              class="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic text-white tracking-tight leading-[1.05]"
              style="font-family: 'Montserrat', sans-serif !important;"
            >
              ${titulo}
            </h1>
          </div>

          <p class="text-gray-400 text-sm md:text-base max-w-xl leading-relaxed mb-8 font-medium">
            ${subtitulo}
          </p>

          <div class="flex">
            <a
              href="https://wa.me/${telefone}"
              target="_blank"
              class="inline-flex items-center justify-center gap-3 font-black text-[11px] md:text-xs uppercase tracking-widest text-white px-8 py-4 transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(222,31,90,0.3)]"
              style="
                background: ${primary};
                border-radius: ${borderRadius};
              "
            >
              <span class="text-sm">➔</span>
              <span>${ctaTexto}</span>
            </a>
          </div>

        </div>

        <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0E0E0E] to-transparent pointer-events-none"></div>
      </section>
    `;
  }
  if (variant === "mjv-impact") {
    return `
      <section id="hero-section" class="relative overflow-hidden py-32" style="background: radial-gradient(circle at top left, ${primary}30, transparent 40%), #0E0E0E;">
        <div class="max-w-7xl mx-auto px-6 text-center">
          <h1 class="text-6xl md:text-8xl font-black uppercase italic mb-8 text-white leading-none">${titulo}</h1>
          <p class="max-w-3xl mx-auto text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed">${subtitulo}</p>
          <a href="https://wa.me/${telefone}" target="_blank" class="inline-flex px-10 py-5 text-lg font-black uppercase tracking-wider transition-all hover:scale-105 shadow-2xl" style="background:${primary}; color:white; border-radius:${tokens?.borderRadius || "20px"};">${ctaTexto}</a>
        </div>
      </section>
    `;
  }

  /**
   * =====================================================
   * HERO LUXURY DARK
   * =====================================================
   */
  if (variant === "luxury-dark") {

    return `
      <section
        id="hero-section"
        class="relative overflow-hidden min-h-screen flex items-center"
        style="
          background:
            linear-gradient(
              135deg,
              #020617 0%,
              #0f172a 50%,
              #111827 100%
            );
        "
      >

        <div
          class="absolute inset-0 opacity-20"
          style="
            background-image:
              url('${heroImage}');
            background-size: cover;
            background-position: center;
          "
        ></div>

        <div class="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">

          <div class="max-w-3xl">

            ${
              logo
                ? `
                <img
                  src="${logo}"
                  alt="${titulo}"
                  class="w-24 h-24 object-cover rounded-2xl mb-8 shadow-2xl"
                />
              `
                : ""
            }

            <span
              class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-6"
              style="
                background:${primary}20;
                color:${primary};
                border:1px solid ${primary}50;
              "
            >
              ${aiData?.categoria || "NEGÓCIO PREMIUM"}
            </span>

            <h1
              class="text-5xl md:text-7xl font-black leading-tight mb-8"
              style="color:${textColor}"
            >
              ${titulo}
            </h1>

            <p
              class="text-xl md:text-2xl leading-relaxed mb-10 text-slate-300"
            >
              ${subtitulo}
            </p>

            <div class="flex flex-wrap gap-4">

              <a
                href="https://wa.me/${telefone}"
                target="_blank"
                class="px-8 py-5 font-bold text-lg transition-all hover:scale-105"
                style="
                  background:${primary};
                  color:white;
                  border-radius:${borderRadius};
                "
              >
                ${ctaTexto}
              </a>

            </div>

          </div>

        </div>

      </section>
    `;
  }

  /**
   * =====================================================
   * HERO SPLIT CLEAN
   * =====================================================
   */
  if (variant === "split-clean") {

    return `
      <section
        id="hero-section"
        class="relative overflow-hidden py-24 bg-white"
      >

        <div class="max-w-7xl mx-auto px-6">

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>

              <span
                class="inline-block px-4 py-2 rounded-full text-sm font-bold mb-6"
                style="
                  background:${primary}15;
                  color:${primary};
                "
              >
                ${aiData?.categoria || "PROFISSIONAL"}
              </span>

              <h1
                class="text-5xl md:text-6xl font-black leading-tight mb-8"
                style="
                  color:${estilo?.body_text_color || "#0f172a"};
                "
              >
                ${titulo}
              </h1>

              <p
                class="text-xl leading-relaxed mb-10 text-slate-600"
              >
                ${subtitulo}
              </p>

              <div class="flex flex-wrap gap-4">

                <a
                  href="https://wa.me/${telefone}"
                  target="_blank"
                  class="px-8 py-4 font-bold transition-all hover:scale-105 shadow-xl"
                  style="
                    background:${primary};
                    color:white;
                    border-radius:${borderRadius};
                  "
                >
                  ${ctaTexto}
                </a>

              </div>

            </div>

            <div class="relative">

              <div
                class="absolute -inset-4 blur-3xl opacity-20"
                style="background:${primary}"
              ></div>

              <img
                src="${heroImage}"
                alt="${titulo}"
                class="relative w-full h-[600px] object-cover shadow-2xl"
                style="
                  border-radius:${borderRadius};
                "
              />

            </div>

          </div>

        </div>

      </section>
    `;
  }

  /**
   * =====================================================
   * HERO GLASSMORPHISM
   * =====================================================
   */
  if (variant === "glassmorphism") {

    return `
      <section
        id="hero-section"
        class="relative overflow-hidden min-h-screen flex items-center"
      >

        <div
          class="absolute inset-0"
          style="
            background-image:url('${heroImage}');
            background-size:cover;
            background-position:center;
          "
        ></div>

        <div
          class="absolute inset-0"
          style="
            background:
              linear-gradient(
                135deg,
                rgba(15,23,42,0.75),
                rgba(15,23,42,0.45)
              );
          "
        ></div>

        <div class="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">

          <div
            class="max-w-3xl backdrop-blur-xl border border-white/10 p-10 shadow-2xl"
            style="
              border-radius:${borderRadius};
              background:rgba(255,255,255,0.08);
            "
          >

            <h1
              class="text-5xl md:text-7xl font-black mb-8 text-white"
            >
              ${titulo}
            </h1>

            <p
              class="text-xl leading-relaxed mb-10 text-slate-200"
            >
              ${subtitulo}
            </p>

            <a
              href="https://wa.me/${telefone}"
              target="_blank"
              class="inline-flex px-8 py-5 font-bold text-lg transition-all hover:scale-105"
              style="
                background:${primary};
                color:white;
                border-radius:${borderRadius};
              "
            >
              ${ctaTexto}
            </a>

          </div>

        </div>

      </section>
    `;
  }

  /**
   * =====================================================
   * HERO DEFAULT
   * =====================================================
   */
  return `
    <section
      id="hero-section"
      class="relative overflow-hidden py-28"
      style="
        background:
          linear-gradient(
            135deg,
            ${primary}15,
            transparent
          );
      "
    >

      <div class="max-w-7xl mx-auto px-6 text-center">

        ${
          logo
            ? `
            <img
              src="${logo}"
              alt="${titulo}"
              class="w-28 h-28 object-cover rounded-3xl mx-auto mb-8 shadow-2xl"
            />
          `
            : ""
        }

        <h1
          class="text-5xl md:text-7xl font-black leading-tight mb-8"
          style="
            color:${estilo?.body_text_color || "#0f172a"};
          "
        >
          ${titulo}
        </h1>

        <p
          class="max-w-3xl mx-auto text-xl leading-relaxed mb-12 text-slate-600"
        >
          ${subtitulo}
        </p>

        <div class="flex justify-center">

          <a
            href="https://wa.me/${telefone}"
            target="_blank"
            class="px-10 py-5 font-bold text-lg shadow-2xl transition-all hover:scale-105"
            style="
              background:${primary};
              color:white;
              border-radius:${borderRadius};
            "
          >
            ${ctaTexto}
          </a>

        </div>

      </div>

    </section>
  `;
};