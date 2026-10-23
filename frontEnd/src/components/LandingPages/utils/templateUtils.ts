export const processarEstilosNoJson = (jsonTemplate: any, { primaryColor, bodyBgColor, textColor }: any) => {
  const strJson = JSON.stringify(jsonTemplate);

  // Substitui as cores padrão pelas cores escolhidas no editor
  return JSON.parse(strJson
    .replace(/#DE1F5A/g, primaryColor)
    .replace(/#0E0E0E/g, bodyBgColor)
    .replace(/#FFFFFF/g, textColor)
  );
};

export const updateWidgetSettings = (jsonTemplate: any, widgetId: string, newSettings: any) => {
  const data = JSON.parse(JSON.stringify(jsonTemplate));

  const findAndReplace = (elements: any[]): boolean => {
    for (let element of elements) {
      if (element.id === widgetId) {
        element.settings = { ...element.settings, ...newSettings };
        return true;
      }
      if (element.elements && element.elements.length > 0) {
        if (findAndReplace(element.elements)) return true;
      }
    }
    return false;
  };

  if (data.content) {
    findAndReplace(data.content);
  }
  return data;
};

export const findElementByProperty = (elements: any[], property: string, value: string): any => {
  for (const element of elements) {
    // Busca por classe CSS ou metadado personalizado que você define no Elementor
    if (element.settings?.css_classes?.includes(value)) return element;

    // Busca recursiva em sub-containers
    if (element.elements) {
      const found = findElementByProperty(element.elements, property, value);
      if (found) return found;
    }
  }
  return null;
};

export const findElementByClass = (elements: any[], className: string): any => {
  if (!elements || !Array.isArray(elements)) return null;

  for (const element of elements) {
    // Verifica se o widget/container tem a classe nas configurações
    const classes = element.settings?.css_classes || "";
    if (typeof classes === 'string' && classes.includes(className)) {
      return element;
    }

    // Continua a busca recursiva em filhos
    if (element.elements) {
      const found = findElementByClass(element.elements, className);
      if (found) return found;
    }
  }
  return null;
};

export const updateWidgetContent = (container: any, widgetType: string, newSettings: any) => {
  if (!container || !container.elements) return false;

  for (const element of container.elements) {
    // Verifica se é o widget que procuramos (ex: 'heading')
    if (element.widgetType === widgetType) {
      element.settings = { ...element.settings, ...newSettings };
      return true; // Sucesso!
    }

    // Se não for, busca nos filhos deste elemento recursivamente
    if (element.elements) {
      if (updateWidgetContent(element, widgetType, newSettings)) return true;
    }
  }
  return false;
};