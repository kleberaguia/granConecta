import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { Link } from "react-router-dom";

import "swiper/css";
import "swiper/css/navigation";

import styles from "./ServicesCarouselSection.module.css";
import type { IServicesCarouselSectionData } from "../../../interfaces/types";
import { API_URL } from "../../../utils/config";

interface ServicesCarouselSectionProps {
  section: IServicesCarouselSectionData;
}

const withApiUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_URL}${path}`;
  return `${API_URL}/${path}`;
};

const normalizePath = (href?: string) => {
  if (!href) return "#";
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  return href.startsWith("/") ? href : `/${href}`;
};

const getCardBadge = (card: any) =>
  card?.badge ||
  card?.categoria ||
  card?.categoria_nome ||
  card?.tipo ||
  card?.grupo ||
  "";

const ServicesCarouselSection: React.FC<ServicesCarouselSectionProps> = ({ section }) => {
  const {
    titulo,
    subtitulo,
    cards = [],
    style_overrides,
    heading_style,
  } = section as any;

  const viewAll = (section as any).view_all;

  // Mantemos todos os cards válidos.
  // Se não houver imagem, o componente exibe um fallback visual.
  const visibleCards = cards.filter(
    (card: any) => card && (card.id || card.slug || card.titulo)
  );

  if (visibleCards.length === 0) {
    return null;
  }

  const showViewAll =
    !!viewAll?.enabled &&
    typeof viewAll?.href === "string" &&
    viewAll.href.length > 0;

  const headingClass =
    heading_style === "styleAsH1"
      ? styles.headingAsH1
      : heading_style === "styleAsH3"
        ? styles.headingAsH3
        : styles.headingAsH2;

  return (
    <section
      className={styles.sectionRoot}
      style={style_overrides as React.CSSProperties}
    >
      <div className={styles.sectionInner}>
        {(titulo || subtitulo || showViewAll) && (
          <header className={styles.sectionHeader}>
            <div className={styles.sectionHeaderRow}>
              <div className={styles.titlesGroup}>
                {titulo && <h2 className={headingClass}>{titulo}</h2>}
                {subtitulo && (
                  <p className={styles.sectionSubtitle}>{subtitulo}</p>
                )}
              </div>

              {showViewAll && (
                <Link
                  to={normalizePath(viewAll.href)}
                  className={styles.viewAllButton}
                >
                  {viewAll.label || "Ver todos"}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
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
            grabCursor
            watchOverflow
            centeredSlides={false}
            slidesPerGroup={1}
            spaceBetween={14}
            slidesPerView={1.28}
            breakpoints={{
              480: {
                slidesPerView: 1.45,
                spaceBetween: 14,
              },
              640: {
                slidesPerView: 2.05,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2.45,
                spaceBetween: 18,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1280: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className={styles.swiper}
          >
            {visibleCards.map((card: any) => {
              const to = normalizePath(
                card.href || `/servicos/${card.slug || card.id}`
              );

              const imagePath =
                card.imagem_url ||
                card.imagem ||
                card.image_url ||
                card.image ||
                "";
              const imageSrc = withApiUrl(imagePath);
              const badge = getCardBadge(card);
              const initial = String(card.titulo || "?")
                .trim()
                .charAt(0)
                .toUpperCase();

              return (
                <SwiperSlide key={card.id || card.slug || card.titulo}>
                  <Link to={to} className={styles.cardLinkWrapper}>
                    <article className={styles.card}>
                      <div className={styles.cardImageWrapper}>
                        {imageSrc ? (
                          <>
                          <img
                            src={imageSrc}
                            alt={card.titulo ?? ""}
                            className={styles.cardImage}
                            loading="lazy"
                            onError={(event) => {
                              const image = event.currentTarget;
                              image.style.display = "none";
                              const fallback = image.nextElementSibling as HTMLElement | null;
                              if (fallback) fallback.style.display = "grid";
                            }}
                          />
                          <div
                            className={`${styles.cardImageFallback} ${styles.cardImageErrorFallback}`}
                            aria-hidden="true"
                          >
                            {initial}
                          </div>
                        </>
                        ) : (
                          <div
                            className={styles.cardImageFallback}
                            aria-hidden="true"
                          >
                            {initial}
                          </div>
                        )}

                        <div className={styles.cardImageOverlay} />

                        {badge && (
                          <span className={styles.cardBadge}>{badge}</span>
                        )}
                      </div>

                      <div className={styles.cardContent}>
                        <h3 className={styles.cardTitle}>
                          {card.titulo || "Conheça esta opção"}
                        </h3>

                        {card.descricao_curta && (
                          <p className={styles.cardDescription}>
                            {card.descricao_curta}
                          </p>
                        )}

                        <div className={styles.cardFooter}>
                          <span>Ver opções</span>
                          <span
                            className={styles.cardArrow}
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </article>
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
