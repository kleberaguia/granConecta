interface GalleryComponentProps {
  items: any[];
  variant?: string;
  estilo?: any;
  tokens?: any;
  aiData?: any;
}

export const GalleryComponent = ({
  items,
  variant,
  estilo,
  tokens,
  aiData
}: GalleryComponentProps) => {

  return `
    <section>
      ${items.map((item: any) => `
        <img src="${item.imagem}" />
      `).join("")}
    </section>
  `;
};