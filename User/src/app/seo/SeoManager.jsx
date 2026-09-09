import { useEffect } from "react";
import { useLocation } from "react-router";

import { defaultSeo, getRouteSeo } from "./seoConfig";
import { applySeoMeta } from "./seoUtils";

export const SeoManager = ({ pathname } = {}) => {
  const routerLocation = useLocation();
  const location = pathname ? { pathname } : routerLocation;
  const currentPath = location?.pathname || window.location.pathname;

  useEffect(() => {
    const seo = getRouteSeo(currentPath);
    const finalSeo = { ...defaultSeo, ...seo, keywords: seo.keywords || defaultSeo.keywords };

    applySeoMeta(finalSeo);
  }, [currentPath]);

  return null;
};

export default SeoManager;
