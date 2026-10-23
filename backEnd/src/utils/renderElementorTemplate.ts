// src/utils/renderElementorTemplate.ts

export interface ElementorSettings {
  [key: string]: any;
}

export interface ElementorNode {
  id: string;
  elType: "container" | "widget";
  widgetType?: string;
  settings?: ElementorSettings;
  elements?: ElementorNode[];
}

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(text: string = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildElementClass(node: ElementorNode) {
  return `elementor-element-${node.id}`;
}

/* =========================================================
   INLINE STYLE (somente o essencial)
========================================================= */

function buildInlineStyle(settings: ElementorSettings = {}) {
  const styles: string[] = [];

  if (settings.width?.size) {
    styles.push(`--width:${settings.width.size}${settings.width.unit || "%"}`);
  }

  if (settings.flex_direction) {
    styles.push(`--flex-direction:${settings.flex_direction}`);
  }

  if (settings.flex_justify_content) {
    styles.push(`--justify-content:${settings.flex_justify_content}`);
  }

  if (settings.flex_align_items) {
    styles.push(`--align-items:${settings.flex_align_items}`);
  }

  if (settings.flex_gap?.size) {
    styles.push(`--gap:${settings.flex_gap.size}px`);
  }

  return styles.join(";");
}

/* =========================================================
   CONTAINER CLASSES
========================================================= */

function buildContainerClasses(node: ElementorNode) {
  const classes = [
    "elementor-element",
    buildElementClass(node),
    "elementor-container",
    "e-con",
    "e-flex",
  ];

  return classes.join(" ");
}

/* =========================================================
   WIDGET CLASSES
========================================================= */

function buildWidgetClasses(node: ElementorNode) {
  const classes = [
    "elementor-element",
    buildElementClass(node),
    "elementor-widget",
  ];

  switch (node.widgetType) {
    case "heading":
      classes.push("elementor-widget-heading");
      break;

    case "button":
      classes.push("elementor-widget-button");
      break;

    case "image":
      classes.push("elementor-widget-image");
      break;

    case "video":
      classes.push("elementor-widget-video");
      break;
  }

  return classes.join(" ");
}

/* =========================================================
   WIDGETS
========================================================= */

function renderHeading(node: ElementorNode) {
  return `
<div
  class="${buildWidgetClasses(node)}"
  data-id="${node.id}"
>

  <div class="elementor-widget-container">

    <h2 class="elementor-heading-title">
      ${node.settings?.title || ""}
    </h2>

  </div>

</div>
`;
}

function renderButton(node: ElementorNode) {
  return `
<div
  class="${buildWidgetClasses(node)}"
  data-id="${node.id}"
>

  <div class="elementor-widget-container">

    <div class="elementor-button-wrapper">

      <a
        href="${node.settings?.link?.url || "#"}"
        class="elementor-button-link elementor-button"
      >

        <span class="elementor-button-content-wrapper">

          <span class="elementor-button-text">
            ${node.settings?.text || "Clique Aqui"}
          </span>

        </span>

      </a>

    </div>

  </div>

</div>
`;
}

function renderImage(node: ElementorNode) {
  return `
<div
  class="${buildWidgetClasses(node)}"
  data-id="${node.id}"
>

  <div class="elementor-widget-container">

    <div class="elementor-image">

      <img
        src="${node.settings?.image?.url || ""}"
        alt=""
      />

    </div>

  </div>

</div>
`;
}

function renderVideo(node: ElementorNode) {
  const videoUrl =
    node.settings?.youtube_url?.replace("watch?v=", "embed/") || "";

  return `
<div
  class="${buildWidgetClasses(node)}"
  data-id="${node.id}"
>

  <div class="elementor-widget-container">

    <div class="elementor-wrapper">

      <iframe
        src="${videoUrl}"
        allowfullscreen
      ></iframe>

    </div>

  </div>

</div>
`;
}

function renderWidget(node: ElementorNode) {
  switch (node.widgetType) {
    case "heading":
      return renderHeading(node);

    case "button":
      return renderButton(node);

    case "image":
      return renderImage(node);

    case "video":
      return renderVideo(node);

    default:
      return "";
  }
}

/* =========================================================
   CONTAINER
========================================================= */

function renderContainer(
  node: ElementorNode,
  renderChildren: (nodes: ElementorNode[]) => string
) {
  const children = renderChildren(node.elements || []);

  return `
<section
  class="${buildContainerClasses(node)}"
  data-id="${node.id}"
  style="${buildInlineStyle(node.settings)}"
>

  <div class="e-con-inner">

    ${children}

  </div>

</section>
`;
}

/* =========================================================
   RECURSIVE
========================================================= */

function renderNodes(nodes: ElementorNode[]): string {
  if (!nodes || !Array.isArray(nodes)) {
    return "";
  }

  return nodes
    .map((node) => {
      if (node.elType === "container") {
        return renderContainer(node, renderNodes);
      }

      if (node.elType === "widget") {
        return renderWidget(node);
      }

      return "";
    })
    .join("");
}

/* =========================================================
   MAIN
========================================================= */

export function renderElementorTemplate(content: ElementorNode[]) {
  return `
<div class="elementor-page elementor">

  ${renderNodes(content)}

</div>
`;
}