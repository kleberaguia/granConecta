import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function BannerCarousel() {
  const navigate = useNavigate();

  const ads = [
    {
      id: 1,
      title: "Divino Acalentum",
      subtitle: "Artigos religiosos que aquecem o coração e fortalecem a fé.",
      image: "https://images.unsplash.com/photo-1548625361-024829ad0004?auto=format&fit=crop&q=80&w=1920", // Troque pela sua imagem
      buttonText: "Visitar Loja",
      link: "/pagina/divino-acalentum",
      color: "#f39c12"
    },
    {
      id: 2,
      title: "Cortes Premium",
      subtitle: "Açougue com carnes selecionadas e atendimento profissional.",
      image: "https://images.unsplash.com/photo-1607067384583-2dc705668477?auto=format&fit=crop&q=80&w=1920", // Imagem de açougue
      buttonText: "Ver Ofertas",
      link: "/pagina/acougue-central",
      color: "#e74c3c"
    }
  ];

  return (
    <div style={{ width: "100%", height: "450px", marginBottom: "40px" }}>
      <Swiper
        spaceBetween={0}
        centeredSlides={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        style={{ height: "100%", borderRadius: "15px" }}
      >
        {ads.map((ad) => (
          <SwiperSlide key={ad.id}>
            <div style={{
              width: "100%",
              height: "100%",
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%), url(${ad.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              padding: "0 10%",
              color: "white",
              position: "relative"
            }}>
              {/* Elemento gráfico de detalhe (igual à sua imagem) */}
              <div style={{
                position: "absolute",
                right: 0,
                bottom: 0,
                width: "30%",
                height: "100%",
                background: ad.color,
                clipPath: "polygon(100% 0, 0% 100%, 100% 100%)",
                opacity: 0.8
              }} />

              <div style={{ maxWidth: "500px", zIndex: 2 }}>
                <h2 style={{ fontSize: "3rem", margin: "0 0 10px 0", fontWeight: 800 }}>
                  {ad.title}
                </h2>
                <p style={{ fontSize: "1.2rem", marginBottom: "25px", opacity: 0.9 }}>
                  {ad.subtitle}
                </p>
                <button 
                  onClick={() => navigate(ad.link)}
                  style={{
                    padding: "12px 30px",
                    backgroundColor: ad.color,
                    color: "white",
                    border: "none",
                    borderRadius: "50px",
                    fontSize: "1rem",
                    fontWeight: "bold",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                  }}
                >
                  {ad.buttonText}
                </button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}