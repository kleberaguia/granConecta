import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import style from './HeroSection.module.css';
import type { IHeroSectionData } from '../../interfaces/types';
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

type ActiveHeroContent = {
  titulo: string;
  subtitulo: string;
};

export default function HeroSection({ section }: { section: IHeroSectionData }) {
  const isSliderMode = section.imagens_slider && section.imagens_slider.length > 0;
  const videoUrl = API_BASE + section.fundo_video_url;
  const isVideoMode = !isSliderMode && !!videoUrl;


  console.log('video hero', videoUrl)

  const [activeContent, setActiveContent] = useState<ActiveHeroContent>(() => {
    if (isSliderMode) {
      return {
        titulo: section.imagens_slider![0].titulo,
        subtitulo: section.imagens_slider![0].subtitulo,
      };
    }
    return {
      titulo: section.titulo || '',
      subtitulo: section.subtitulo || '',
    };
  });

  const handleSlideChange = (swiperInstance: any) => {
    if (!isSliderMode) return;
    const newIndex = swiperInstance.realIndex;
    const newSlideData = section.imagens_slider![newIndex];

    if (newSlideData) {
      setActiveContent({
        titulo: newSlideData.titulo,
        subtitulo: newSlideData.subtitulo,
      });
    }
  };

  const heroStyles = section.style_overrides || {};

  return (
    <section className={style.heroWrapper} style={heroStyles}>

      {/* O Overlay de Texto (Fica por cima de tudo) */}
      <div className={style.heroOverlay}>
        <div className={style.heroContent}>
          <h1 className={style.heroTitle}>{activeContent.titulo}</h1>
          <p className={style.heroSubtitle}>{activeContent.subtitulo}</p>

          <div className={style.heroButtons}>
            {section.texto_botao1 && (
              // <a href={section.link_botao1 ?? '#'} className={style.heroButtonPrimary}>
              // <a href="" className={style.heroButtonPrimary}>
              // {section.texto_botao1}
              // </a>

              <a href="#proxima-secao" className={style.heroButtonPrimary}>
                {section.texto_botao1}
              </a>
            )}
            {section.texto_botao2 && (

              // <a href={section.link_botao2 ?? '#'} className={style.heroButtonSecondary}>
              <a href={`${window.location.origin}/login/prestador`} className={style.heroButtonSecondary}>
                {section.texto_botao2}
              </a>
            )}
          </div>
        </div>
      </div>
      {isSliderMode ? (
        // OPÇÃO 1: SLIDER
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          onSlideChange={handleSlideChange}
          loop={true}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          className={style.heroSlider}
        >
          {section.imagens_slider!.map((slide, idx) => (
            <SwiperSlide key={idx}>
              <div
                className={style.slideImage}
                style={{ backgroundImage: `url(${slide.imagem_url})` }}
                aria-label={slide.titulo}
              ></div>
            </SwiperSlide>
          ))}
        </Swiper>

      ) : isVideoMode ? (
        <div className={style.heroVideoWrapper}>
          <video
            className={style.heroVideo}
            autoPlay
            muted
            loop
            playsInline

          >
            <source src={videoUrl} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        </div>

      ) : (
        <div
          className={style.heroStaticImage}
          style={{ backgroundImage: `url(${section.imagem_fundo})` }}
          aria-label={section.titulo || 'Imagem de fundo'}
        ></div>
      )}
    </section>
  );
}