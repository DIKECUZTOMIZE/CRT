import HomeSliderModel from "../../model/home-slider.model.js";

const defaultSlides = [
  {
    id: "default-slide-1",
    title: "AI & Web3 Hackathon",
    subtitle: "Build, ship, and pitch your next big idea.",
    description: "Discover top challenges and innovation-driven events.",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1920&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1920&auto=format&fit=crop",
    ],
    link: "",
    order: 1,
    isActive: true,
  },
  {
    id: "default-slide-2",
    title: "Algorithmic Battles",
    subtitle: "Code, compete, and climb the leaderboard.",
    description: "Join skill-based competitions and coding sprints.",
    image:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920&auto=format&fit=crop",
    ],
    link: "",
    order: 2,
    isActive: true,
  },
  {
    id: "default-slide-3",
    title: "Developer Grants",
    subtitle: "Create, validate, and launch with support.",
    description: "Explore funding-ready events and community growth programs.",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1920&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1920&auto=format&fit=crop",
    ],
    link: "",
    order: 3,
    isActive: true,
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeHomeSliderSlide = (slide = {}) => {
  const normalized = slide?.toObject ? slide.toObject() : { ...slide };
  const images = Array.isArray(normalized.images)
    ? normalized.images.filter(Boolean).map((item) => String(item))
    : [];

  const imageFromSingle = normalized.image ? String(normalized.image) : "";
  const primaryImage = images[0] || imageFromSingle;

  return {
    id: normalized._id ? String(normalized._id) : normalized.id || "",
    _id: normalized._id ? String(normalized._id) : undefined,
    title: String(normalized.title || "Untitled Slide"),
    subtitle: String(normalized.subtitle || ""),
    description: String(normalized.description || ""),
    image: primaryImage,
    images: images.length ? images : (imageFromSingle ? [imageFromSingle] : []),
    link: String(normalized.link || ""),
    order: toNumber(normalized.order, 0),
    isActive: normalized.isActive !== false,
    createdAt: normalized.createdAt || null,
    updatedAt: normalized.updatedAt || null,
  };
};

export const getHomeSliderSlidesService = async () => {
  try {
    const slides = await HomeSliderModel.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

    if (slides.length) {
      return slides.map(normalizeHomeSliderSlide);
    }

    return defaultSlides;
  } catch (error) {
    return defaultSlides;
  }
};

export const getHomeSliderSlidesAdminService = async () => {
  try {
    const slides = await HomeSliderModel.find({}).sort({ order: 1, createdAt: -1 }).lean();
    return slides.map(normalizeHomeSliderSlide);
  } catch (error) {
    return defaultSlides.map((slide) => ({ ...slide, id: slide.id }));
  }
};

export const createHomeSliderSlideService = async (payload = {}) => {
  const title = String(payload.title || "").trim();
  const subtitle = String(payload.subtitle || "").trim();
  const description = String(payload.description || "").trim();
  const link = String(payload.link || "").trim();
  const rawImages = Array.isArray(payload.images)
    ? payload.images.filter(Boolean).map((item) => String(item))
    : [];
  const fallbackImage = payload.image ? String(payload.image).trim() : "";
  const imageList = rawImages.length ? rawImages : (fallbackImage ? [fallbackImage] : []);

  const hasAnyContent = Boolean(title || subtitle || description || link || imageList.length);
  if (!hasAnyContent) {
    throw new Error("Add at least one field or poster image before saving.");
  }

  const slide = await HomeSliderModel.create({
    title: title || "Untitled Slide",
    subtitle,
    description,
    image: imageList[0] || "",
    images: imageList,
    link,
    order: toNumber(payload.order, 0),
    isActive: payload.isActive !== false,
  });

  return normalizeHomeSliderSlide(slide);
};

export const updateHomeSliderSlideService = async (slideId, payload = {}) => {
  const slide = await HomeSliderModel.findById(slideId);
  if (!slide) {
    return null;
  }

  if (payload.title !== undefined) slide.title = String(payload.title || "").trim() || "Untitled Slide";
  if (payload.subtitle !== undefined) slide.subtitle = String(payload.subtitle || "").trim();
  if (payload.description !== undefined) slide.description = String(payload.description || "").trim();

  const incomingImages = Array.isArray(payload.images)
    ? payload.images.filter(Boolean).map((item) => String(item))
    : [];
  const fallbackImage = payload.image !== undefined ? String(payload.image || "").trim() : "";

  if (payload.images !== undefined) {
    slide.images = incomingImages;
    slide.image = incomingImages[0] || "";
  } else if (payload.image !== undefined) {
    slide.image = fallbackImage;
    slide.images = fallbackImage ? [fallbackImage] : [];
  }

  if (payload.link !== undefined) slide.link = String(payload.link || "").trim();
  if (payload.order !== undefined) slide.order = toNumber(payload.order, 0);
  if (payload.isActive !== undefined) slide.isActive = Boolean(payload.isActive);

  const hasAnyContent = Boolean(
    slide.title || slide.subtitle || slide.description || slide.link || (slide.images?.length || slide.image)
  );

  if (!hasAnyContent) {
    throw new Error("Add at least one field or poster image before saving.");
  }

  await slide.save();
  return normalizeHomeSliderSlide(slide);
};

export const deleteHomeSliderSlideService = async (slideId) => {
  const result = await HomeSliderModel.findByIdAndDelete(slideId);
  return Boolean(result);
};
