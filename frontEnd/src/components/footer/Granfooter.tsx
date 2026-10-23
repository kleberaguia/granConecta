import React from "react";
import { Link } from "react-router-dom";
import styles from "./GranFooter.module.css";

type FooterLink = {
  label: string;
  href: string;
};

const exploreLinks: FooterLink[] = [
  { label: "Início", href: "/" },
  { label: "Categorias", href: "/#home-sections" },
  { label: "Lojas", href: "/marketplace" },
  { label: "Prestadores", href: "/?tipo=prestadores" },
  { label: "Gastronomia", href: "/explorar/gastronomia" },
  { label: "Automotivo", href: "/explorar/automotivo" }
];

const accessLinks: FooterLink[] = [
  { label: "Entrada do morador", href: "/login/morador" },
  { label: "Entrada do prestador", href: "/login/prestador" },
  { label: "Cadastro", href: "/cadastro" },
  { label: "Anunciar na GranConecta", href: "/cadastro?tipo=anunciante" }
];

const supportLinks: FooterLink[] = [
  { label: "Termos de uso", href: "/documentos-legais/termos-de-uso" },
  { label: "Política de privacidade", href: "/documentos-legais/politica-de-privacidade" },
  { label: "Ajuda", href: "/ajuda" }
];

const socialLinks = [
  {
    label: "WhatsApp",
    href: "https://wa.me/5500000000000",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L4 20.4l1.3-4A8.4 8.4 0 1 1 20.5 11.8Z" />
        <path d="M9.1 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.4.5c-.1.1-.2.3-.1.5.3.6.8 1.2 1.3 1.7.6.5 1.2.9 1.9 1.2.2.1.4 0 .5-.1l.6-.7c.2-.2.4-.2.7-.1l1.6.8c.3.2.4.3.4.6 0 .5-.4 1.3-.9 1.6-.5.3-1.1.4-1.9.2-1.4-.3-2.9-1.1-4.2-2.3-1.2-1.1-2.3-2.6-2.8-4-.3-.8-.2-1.4.1-1.9l.3-.5Z" />
      </svg>
    )
  },
  {
    label: "Instagram",
    href: "https://instagram.com/granconecta",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.4" />
        <circle cx="17.3" cy="6.8" r=".8" />
      </svg>
    )
  },
  {
    label: "Facebook",
    href: "https://facebook.com/granconecta",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 8.1h2V4.8c-.4-.1-1.6-.2-3-.2-3 0-5 1.8-5 5.2v3H5v3.7h3V24h3.8v-7.5H15l.5-3.7h-3.7v-2.6c0-1.1.3-2.1 2.2-2.1Z" />
      </svg>
    )
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/granconecta",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.3 8.8H1.8V22h3.5V8.8Z" />
        <path d="M3.5 2A2 2 0 1 0 3.5 6a2 2 0 0 0 0-4Z" />
        <path d="M22 14.5V22h-3.5v-6.9c0-1.7-.6-2.9-2.2-2.9-1.2 0-1.9.8-2.2 1.6-.1.3-.1.7-.1 1V22h-3.5s.1-11.8 0-13.2H14v1.9c.5-.8 1.4-2.1 3.5-2.1 2.6 0 4.5 1.7 4.5 5.9Z" />
      </svg>
    )
  }
];

const currentYear = new Date().getFullYear();

const SmartLink: React.FC<FooterLink & { className?: string }> = ({ href, label, className }) => {
  const isExternal = href.startsWith("http");
  const isHash = href.startsWith("#");

  if (isExternal) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }

  if (isHash) {
    return <a className={className} href={href}>{label}</a>;
  }

  return <Link className={className} to={href}>{label}</Link>;
};

export default function GranFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.brandColumn}>
          <Link to="/" className={styles.brand}>
            <span className={styles.brandMark}>G</span>
            <span>
              <strong>GranConecta</strong>
              <small>condomínio, comércio e serviços</small>
            </span>
          </Link>

          <p>
            Uma vitrine local para moradores resolverem o dia a dia e para lojistas
            e prestadores venderem com mais autoridade dentro da comunidade.
          </p>

          <div className={styles.socialList} aria-label="Redes sociais">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={styles.socialButton}
                aria-label={item.label}
                title={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>

        <nav className={styles.linkColumn} aria-label="Explorar">
          <h3>Explorar</h3>
          {exploreLinks.map((link) => (
            <SmartLink key={link.label} {...link} />
          ))}
        </nav>

        <nav className={styles.linkColumn} aria-label="Acessos">
          <h3>Acessos</h3>
          {accessLinks.map((link) => (
            <SmartLink key={link.label} {...link} />
          ))}
        </nav>

        <nav className={styles.linkColumn} aria-label="Suporte">
          <h3>Suporte</h3>
          {supportLinks.map((link) => (
            <SmartLink key={link.label} {...link} />
          ))}
        </nav>
      </div>

      <div className={styles.footerBottom}>
        <span>© {currentYear} GranConecta. Todos os direitos reservados.</span>
        <span>Conectando moradores, lojistas e prestadores.</span>
      </div>
    </footer>
  );
}
