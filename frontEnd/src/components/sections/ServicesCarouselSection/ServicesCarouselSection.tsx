import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

import styles from "./ServicesCarouselSection.module.css";
import type { IServicesCarouselSectionData } from "../../../interfaces/types";
import { Link } from "react-router-dom";
import { API_URL } from "../../../utils/config";

interface ServicesCarouselSectionProps {
  section: IServicesCarouselSectionData;
}

const withApiUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // garante barra dupla não acontecer
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
};

const ServicesCarouselSection: React.FC<ServicesCarouselSectionProps> = ({ section }) => {
  const { titulo, subtitulo, cards = [], style_overrides, heading_style } = section as any;
  const viewAll = (section as any).view_all;
  console.log('viewAll ', viewAll)
  const showViewAll = !!viewAll?.enabled && typeof viewAll?.href === "string" && viewAll.href.length > 0;

  console.log('sectionnnnnnn ', section)

  const headingClass =
    heading_style === "styleAsH1"
      ? styles.headingAsH1
      : heading_style === "styleAsH3"
        ? styles.headingAsH3
        : styles.headingAsH2;

  return (
    <section
      id="proxima-secao"
      className={styles.sectionRoot}
      style={style_overrides as React.CSSProperties}
    >
      <div className={styles.sectionInner}>
        {(titulo || subtitulo || showViewAll) && (
          <header className={styles.sectionHeader}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.titlesGroup}>
                {titulo && <h2 className={headingClass}>{titulo}</h2>}
                {subtitulo && <p className={styles.sectionSubtitle}>{subtitulo}</p>}
              </div>

              {showViewAll && (
                <Link
                  /* Garantimos que se o href não começar com /, nós adicionamos */
                  to={viewAll.href.startsWith('/') ? viewAll.href : `/${viewAll.href}`}
                  className={styles.viewAllButton}
                >
                  {viewAll.label || "Mostrar todos"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              )}
            </div>
          </header>
        )}

        <div className={styles.carouselWrapper}>
          <Swiper
            modules={[Navigation]}
            navigation
            spaceBetween={24}
            slidesPerView={1.2}
            breakpoints={{
              480: { slidesPerView: 1.3 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 2.5 },
              1440: { slidesPerView: 3 },
            }}
            className={styles.swiper}
          >
            {cards.map((card: any) => {
              // ✅ destino do card
              const to = card.href || `/servicos/${card.slug}`;

              // ✅ imagem do card (novo padrão) com fallback no legado
              const imagePath = card.imagem_url || card.link_botao || "";
              const imageSrc = imagePath ? withApiUrl(imagePath) : "";

              return (
                <SwiperSlide key={card.id}>
                  <Link
                    to={to}
                    className={styles.cardLinkWrapper}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className={styles.card}>
                      <div className={styles.cardImageWrapper}>
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={card.titulo ?? ""}
                            className={styles.cardImage}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.cardImageFallback}>
                            {card.titulo?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className={styles.cardContent}>
                        <h4 className={styles.cardTitle}>{card.titulo}</h4>
                        {card.descricao_curta && (
                          <p className={styles.cardDescription}>{card.descricao_curta}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default ServicesCarouselSection;
