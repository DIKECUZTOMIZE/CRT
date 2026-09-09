export const SITE_URL = String(import.meta.env.VITE_SITE_URL || "https://yourdomain.com").replace(/\/$/, "");
export const DEFAULT_OG_IMAGE = String(import.meta.env.VITE_OG_IMAGE || `${SITE_URL}/og-image.svg`).trim();

const hasMetaNameSelector = (selector) => selector.startsWith("meta[name='") || selector.startsWith("meta[name=\"");
const hasMetaPropertySelector = (selector) => selector.startsWith("meta[property='") || selector.startsWith("meta[property=\"");
const hasLinkSelector = (selector) => selector.startsWith("link[");

const getSelectorAttributeValue = (selector, attributeName) => {
  const attributePattern = `${attributeName}=`;
  const startIndex = selector.indexOf(attributePattern);

  if (startIndex === -1) {
    return null;
  }

  const quoteIndex = startIndex + attributePattern.length;
  const quoteChar = selector[quoteIndex];

  if (!quoteChar || (quoteChar !== "'" && quoteChar !== '"')) {
    return null;
  }

  const valueStartIndex = quoteIndex + 1;
  const valueEndIndex = selector.indexOf(quoteChar, valueStartIndex);

  if (valueEndIndex === -1) {
    return selector.slice(valueStartIndex);
  }

  return selector.slice(valueStartIndex, valueEndIndex);
};

export const setMetaTag = (selector, attributes = {}) => {
  const tag = document.head.querySelector(selector) || document.createElement(hasLinkSelector(selector) ? "link" : "meta");

  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      tag.removeAttribute(key);
      return;
    }

    tag.setAttribute(key, value);
  });

  if (hasMetaNameSelector(selector)) {
    const nameAttribute = getSelectorAttributeValue(selector, "name");
    if (nameAttribute) {
      tag.setAttribute("name", nameAttribute);
    }
  }

  if (hasMetaPropertySelector(selector)) {
    const propertyAttribute = getSelectorAttributeValue(selector, "property");
    if (propertyAttribute) {
      tag.setAttribute("property", propertyAttribute);
    }
  }

  if (!tag.parentNode) {
    document.head.appendChild(tag);
  }

  return tag;
};

export const applySeoMeta = (seo = {}) => {
  if (!seo || typeof seo !== "object") {
    return;
  }

  document.title = seo.title || document.title;

  setMetaTag("meta[name='description']", {
    name: "description",
    content: seo.description,
  });

  if (seo.keywords) {
    setMetaTag("meta[name='keywords']", {
      name: "keywords",
      content: seo.keywords,
    });
  }

  setMetaTag("link[rel='canonical']", {
    rel: "canonical",
    href: seo.canonical,
  });

  setMetaTag("meta[name='robots']", {
    name: "robots",
    content: seo.robots,
  });

  setMetaTag("meta[property='og:title']", {
    property: "og:title",
    content: seo.title,
  });

  setMetaTag("meta[property='og:description']", {
    property: "og:description",
    content: seo.description,
  });

  setMetaTag("meta[property='og:type']", {
    property: "og:type",
    content: seo.type,
  });

  setMetaTag("meta[property='og:url']", {
    property: "og:url",
    content: seo.canonical,
  });

  setMetaTag("meta[property='og:image']", {
    property: "og:image",
    content: seo.image || DEFAULT_OG_IMAGE,
  });

  setMetaTag("meta[property='og:image:width']", {
    property: "og:image:width",
    content: "1200",
  });

  setMetaTag("meta[property='og:image:height']", {
    property: "og:image:height",
    content: "630",
  });

  setMetaTag("meta[property='og:site_name']", {
    property: "og:site_name",
    content: "CRT",
  });

  setMetaTag("meta[name='twitter:card']", {
    name: "twitter:card",
    content: "summary_large_image",
  });

  setMetaTag("meta[name='twitter:title']", {
    name: "twitter:title",
    content: seo.title,
  });

  setMetaTag("meta[name='twitter:description']", {
    name: "twitter:description",
    content: seo.description,
  });

  setMetaTag("meta[name='twitter:image']", {
    name: "twitter:image",
    content: seo.image || DEFAULT_OG_IMAGE,
  });
};
