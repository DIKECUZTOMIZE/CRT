import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarRange,
  UserCircle,
  Image as ImageIcon,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
  Trash2,
  Upload,
  Star,
} from "lucide-react";

import { useAdminAuth } from "../feature/Auth/hooks/useAdminAuth.js";
import { useAdminDashboard } from "../feature/Dashboard/hooks/useAdminDashboard.js";
import { AdminEventDetailsPage } from "../feature/EventDetails/index.js";
import { eventStatusFilters, getEventSummary } from "../feature/EventList/index.js";
import { UserList } from "../feature/UserList/index.js";
import { OrganizerList } from "../feature/OrganizerList/index.js";

const sidebarLinks = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { id: "events", label: "Event List", icon: CalendarRange, path: "/admin/events" },
  { id: "home-slider", label: "Home Slider", icon: ImageIcon, path: "/admin/home-slider" },
  { id: "users", label: "User List", icon: Users, path: "/admin/users" },
  { id: "organizers", label: "Organizer List", icon: Building2, path: "/admin/organizers" },
  { id: "profile", label: "Profile", icon: UserCircle, path: "/admin/profile" },
];

const normalizeSocialUrl = (platform, value) => {
  if (!value || typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const cleanValue = trimmed.replace(/^@+/, "").replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  if (!cleanValue) return "";

  const formatted = cleanValue.replace(/^\/+/, "");

  if (platform === "instagram") return `https://instagram.com/${formatted}`;
  if (platform === "twitter") return `https://x.com/${formatted}`;
  if (platform === "linkedin") return `https://linkedin.com/in/${formatted}`;

  return `https://${formatted}`;
};

const renderSocialLink = (platform, value) => {
  const href = normalizeSocialUrl(platform, value);

  if (!href) {
    return <span className="text-slate-400">Not provided</span>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-emerald-300 underline decoration-emerald-500/50 underline-offset-4 transition hover:text-emerald-200"
    >
      {value}
    </a>
  );
};

const AdminDashboard = ({ initialSection = "dashboard" }) => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user, loading, logout, refreshUser } = useAdminAuth();
  const { dashboardData, search, setSearch, filteredUsers, filteredOrganizers, filteredEvents, isLoading: isDashboardLoading, isError } = useAdminDashboard();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [eventFilter, setEventFilter] = useState("All");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statusDraft, setStatusDraft] = useState("upcoming");
  const [statusReason, setStatusReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [sliderSlides, setSliderSlides] = useState([]);
  const [sliderLoading, setSliderLoading] = useState(false);
  const [sliderDraft, setSliderDraft] = useState({ title: "", subtitle: "", description: "", link: "", image: "", images: [], order: 0, isActive: true });
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    description: "",
    eventMode: "Offline",
    location: "",
    state: "",
    district: "",
    city: "",
    pinCode: "",
    onlineLink: "",
    venueAddress: "",
    eventDate: "",
    eventStartTime: "",
    eventEndTime: "",
    totalSeats: "",
    totalPrizePool: "",
    entries: [],
    prizes: [],
    participation: {
      enabled: false,
      mode: "Solo",
      minTeamSize: "",
      maxTeamSize: "",
    },
    participationSteps: [],
    eventRules: [],
    securityRequirements: [],
    schedules: [],
    organizerTeam: [],
    bannerUrl: "",
    cardImageUrl: "",
    organizerContact: {
      name: "",
      whatsapp: "",
    },
  });
  const eventSummary = useMemo(() => getEventSummary(dashboardData.events), [dashboardData.events]);
  const detailEvent = useMemo(() => {
    if (!eventId) return selectedEvent;

    if (selectedEvent) {
      return selectedEvent;
    }

    return (
      dashboardData.events.find((event) => String(event.id || event._id) === String(eventId)) ||
      null
    );
  }, [dashboardData.events, eventId, selectedEvent]);
  const visibleEvents = useMemo(() => {
    const list = filteredEvents.filter((event) => {
      const matchesFilter = eventFilter === "All" ? true : event.status === eventFilter;
      return matchesFilter;
    });

    return list;
  }, [eventFilter, filteredEvents]);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    if (!eventId) {
      setSelectedEvent(null);
      return;
    }

    const match = dashboardData.events.find(
      (event) => String(event.id || event._id) === String(eventId)
    );

    setSelectedEvent(match || null);

    let isMounted = true;

    const loadEventDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const fullEvent = payload?.data?.event || payload?.event || null;

        if (isMounted && fullEvent) {
          setSelectedEvent(fullEvent);
        }
      } catch (error) {
        if (isMounted) {
          setSelectedEvent(match || null);
        }
      }
    };

    loadEventDetails();

    return () => {
      isMounted = false;
    };
  }, [dashboardData.events, eventId]);

  useEffect(() => {
    if (detailEvent?.status) {
      setStatusDraft(String(detailEvent.status).toLowerCase());
      setStatusReason(detailEvent.statusReason || "");
    }
  }, [detailEvent?.status, detailEvent?.statusReason]);

  useEffect(() => {
    if (detailEvent) {
      setEditForm(hydrateEditFormFromEvent(detailEvent));
    }
  }, [detailEvent]);

  const fetchSliderSlides = async () => {
    setSliderLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/home-slider/admin", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to load home slider slides.");
      }

      const slides = Array.isArray(payload?.data) ? payload.data : [];
      setSliderSlides(slides);
    } catch (error) {
      toast.error(error?.message || "Unable to load home slider slides.");
      setSliderSlides([]);
    } finally {
      setSliderLoading(false);
    }
  };

  const handleSliderUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const form = new FormData();
    files.forEach((file) => form.append("images", file));

    try {
      const response = await fetch("http://localhost:3000/api/upload/images", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Image upload failed.");
      }

      const uploadedUrls = Array.isArray(payload?.data?.urls) ? payload.data.urls : [];
      if (!uploadedUrls.length) {
        throw new Error("No image URLs were returned.");
      }

      const nextImages = [...(sliderDraft.images || []), ...uploadedUrls];
      setSliderDraft((prev) => ({
        ...prev,
        images: nextImages,
        image: nextImages[0] || prev.image || "",
      }));
      toast.success(`${uploadedUrls.length} poster image(s) uploaded successfully.`);
    } catch (error) {
      toast.error(error?.message || "Unable to upload poster images.");
    }
  };

  const removeSliderImage = (indexToRemove) => {
    setSliderDraft((prev) => {
      const nextImages = (prev.images || []).filter((_, index) => index !== indexToRemove);
      const nextPrimaryImage = nextImages[0] || "";

      return {
        ...prev,
        images: nextImages,
        image: nextPrimaryImage,
      };
    });
  };

  const setPrimarySliderImage = (imageUrl) => {
    setSliderDraft((prev) => {
      const nextImages = Array.isArray(prev.images) ? prev.images : [];
      const reordered = [imageUrl, ...nextImages.filter((item) => item !== imageUrl)];

      return {
        ...prev,
        image: imageUrl,
        images: reordered,
      };
    });
  };

  const handleSliderCreate = async () => {
    const posterImages = Array.isArray(sliderDraft.images) && sliderDraft.images.length
      ? sliderDraft.images
      : sliderDraft.image
        ? [sliderDraft.image]
        : [];

    const hasAnyContent = Boolean(
      sliderDraft.title.trim() ||
      sliderDraft.subtitle.trim() ||
      sliderDraft.description.trim() ||
      sliderDraft.link.trim() ||
      posterImages.length
    );

    if (!hasAnyContent) {
      toast.error("Add at least one field or poster image before saving.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/home-slider/", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: sliderDraft.title || "Untitled Slide",
          subtitle: sliderDraft.subtitle,
          description: sliderDraft.description,
          link: sliderDraft.link,
          image: posterImages[0] || "",
          images: posterImages,
          order: sliderDraft.order,
          isActive: sliderDraft.isActive,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to save slider slide.");
      }

      toast.success("Poster slide saved.");
      setSliderDraft({ title: "", subtitle: "", description: "", link: "", image: "", images: [], order: 0, isActive: true });
      await fetchSliderSlides();
    } catch (error) {
      toast.error(error?.message || "Unable to save poster slide.");
    }
  };

  const handleSliderDelete = async (slideId) => {
    if (!slideId) return;

    const confirmed = window.confirm("Remove this home slider slide?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/home-slider/${slideId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Unable to remove slider slide.");
      }

      toast.success("Slider slide removed.");
      await fetchSliderSlides();
    } catch (error) {
      toast.error(error?.message || "Unable to remove slider slide.");
    }
  };

  useEffect(() => {
    if (activeSection === "home-slider") {
      fetchSliderSlides();
    }
  }, [activeSection]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const handleSideNav = (path, id) => {
    setActiveSection(id);
    navigate(path, { replace: false });
  };

  const handleSectionOpen = (section) => {
    if (!section) return;
    setActiveSection(section);

    const targetPath = section === "dashboard" ? "/admin/dashboard" : "/admin/dashboard";
    navigate(targetPath, { replace: false });
  };

  const handleEventOpen = (event) => {
    if (!event) return;

    setSelectedEvent(event);
    const eventPath = event.id || event._id || event.title;
    navigate(`/admin/events/${encodeURIComponent(String(eventPath))}`, { replace: false });
  };

  const handleEventBack = () => {
    setSelectedEvent(null);
    navigate("/admin/events", { replace: false });
  };

  const handleStatusUpdate = async () => {
    if (!eventId || !detailEvent || !statusDraft) return;

    const normalizedReason =
      statusDraft === "cancelled" || statusDraft === "postponed"
        ? (statusReason || "").trim()
        : "";

    if ((statusDraft === "cancelled" || statusDraft === "postponed") && !normalizedReason) {
      toast.error("Please add a reason before marking this event as cancelled or postponed.");
      return;
    }

    try {
      setUpdatingStatus(true);
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: statusDraft,
          statusReason: normalizedReason,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to update event status.");
      }

      const nextEvent = {
        ...detailEvent,
        status: String(payload?.data?.event?.status || statusDraft).replace(/^\w/, (s) => s.toUpperCase()),
        statusReason: payload?.data?.event?.statusReason || normalizedReason,
      };

      setSelectedEvent(nextEvent);
      navigate(`/admin/events/${encodeURIComponent(String(eventId))}`, { replace: false });
      toast.success("Event status updated successfully.");
    } catch (error) {
      toast.error(error?.message || "Unable to update event status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventId || !detailEvent) return;

    const confirmed = window.confirm(`Delete "${detailEvent.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingEvent(true);
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete event.");
      }

      toast.success("Event deleted successfully.");
      setSelectedEvent(null);
      navigate("/admin/events", { replace: false });
    } catch (error) {
      toast.error(error?.message || "Unable to delete event.");
    } finally {
      setDeletingEvent(false);
    }
  };

  const hydrateEditFormFromEvent = (event) => {
    if (!event) {
      return {
        title: "",
        category: "",
        description: "",
        eventMode: "Offline",
        location: "",
        state: "",
        district: "",
        city: "",
        pinCode: "",
        onlineLink: "",
        venueAddress: "",
        eventDate: "",
        eventStartTime: "",
        eventEndTime: "",
        totalSeats: "",
        totalPrizePool: "",
        entries: [],
        prizes: [],
        participation: {
          enabled: false,
          mode: "Solo",
          minTeamSize: "",
          maxTeamSize: "",
        },
        participationSteps: [],
        eventRules: [],
        securityRequirements: [],
        schedules: [],
        organizerTeam: [],
        bannerUrl: "",
        cardImageUrl: "",
        organizerContact: {
          name: "",
          whatsapp: "",
        },
      };
    }

    return {
      title: event.title || "",
      category: event.category || "",
      description: event.description || "",
      eventMode: event.eventMode || "Offline",
      location: event.location || "",
      state: event.state || "",
      district: event.district || "",
      city: event.city || "",
      pinCode: event.pinCode || "",
      onlineLink: event.onlineLink || "",
      venueAddress: event.venueAddress || "",
      eventDate: event.eventDate || "",
      eventStartTime: event.eventStartTime || event.eventTime || "",
      eventEndTime: event.eventEndTime || "",
      totalSeats: event.totalSeats ?? "",
      totalPrizePool: event.totalPrizePool ?? "",
      entries: Array.isArray(event.entries) ? event.entries : [],
      prizes: Array.isArray(event.prizes) ? event.prizes : [],
      participation: {
        enabled: Boolean(event.participation?.enabled ?? false),
        mode: event.participation?.mode || "Solo",
        minTeamSize: event.participation?.minTeamSize ?? "",
        maxTeamSize: event.participation?.maxTeamSize ?? "",
      },
      participationSteps: Array.isArray(event.participationSteps) ? event.participationSteps : [],
      eventRules: Array.isArray(event.eventRules) ? event.eventRules : [],
      securityRequirements: Array.isArray(event.securityRequirements) ? event.securityRequirements : [],
      schedules: Array.isArray(event.schedules) ? event.schedules : [],
      organizerTeam: Array.isArray(event.organizerTeam) ? event.organizerTeam : [],
      bannerUrl: event.bannerUrl || event.imageUrl || "",
      cardImageUrl: event.cardImageUrl || event.bannerUrl || "",
      organizerContact: {
        name: event.organizerContact?.name || event.organizerName || "",
        whatsapp: event.organizerContact?.whatsapp || "",
      },
    };
  };

  const handleEditOpen = async () => {
    if (!detailEvent) return;

    try {
      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const payload = await response.json();
        const freshEvent = payload?.data?.event || payload?.event || detailEvent;
        setSelectedEvent(freshEvent);
        setEditForm(hydrateEditFormFromEvent(freshEvent));
      } else {
        setEditForm(hydrateEditFormFromEvent(detailEvent));
      }
    } catch {
      setEditForm(hydrateEditFormFromEvent(detailEvent));
    }

    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
  };

  const openProfileEditor = () => {
    setProfileDraft({
      username: user?.username || "",
      email: user?.email || "",
      fullName: user?.fullName || "",
      roleTitle: user?.roleTitle || "",
      phone: user?.phone || "",
      avatar: user?.avatar || "",
      bio: user?.bio || "",
      socials: {
        instagram: user?.socials?.instagram || "",
        twitter: user?.socials?.twitter || "",
        linkedin: user?.socials?.linkedin || "",
      },
      isVerified: Boolean(user?.isVerified ?? true),
    });
    setProfileEditOpen(true);
  };

  const closeProfileEditor = () => {
    setProfileEditOpen(false);
    setProfileDraft(null);
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const uploadProfileImage = async (file) => {
    if (!file) return "";

    const form = new FormData();
    form.append("image", file);

    setUploadingProfileImage(true);

    try {
      const response = await fetch("http://localhost:3000/api/upload/image", {
        method: "POST",
        credentials: "include",
        body: form,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Image upload failed.");
      }

      const uploadedUrl = payload?.data?.url || payload?.url || "";
      if (!uploadedUrl) {
        throw new Error("No image URL returned by the server.");
      }

      return uploadedUrl;
    } catch (error) {
      toast.error(error?.message || "Unable to upload image.");
      return "";
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user || !profileDraft) return;

    const adminId = user.id || user._id;
    if (!adminId) {
      toast.error("Admin session not found.");
      return;
    }

    const payload = {
      username: String(profileDraft.username || "").trim(),
      email: String(profileDraft.email || "").trim(),
      fullName: String(profileDraft.fullName || "").trim(),
      roleTitle: String(profileDraft.roleTitle || "").trim(),
      phone: String(profileDraft.phone || "").trim(),
      avatar: String(profileDraft.avatar || "").trim(),
      bio: String(profileDraft.bio || "").trim(),
      role: "ADMIN",
      isVerified: Boolean(profileDraft.isVerified),
      socials: {
        instagram: String(profileDraft.socials?.instagram || "").trim(),
        twitter: String(profileDraft.socials?.twitter || "").trim(),
        linkedin: String(profileDraft.socials?.linkedin || "").trim(),
      },
    };

    if (!payload.username || !payload.email) {
      toast.error("Username and email are required.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch(`http://localhost:3000/api/admin/users/${adminId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Unable to update profile.");
      }

      await refreshUser();
      toast.success("Admin profile updated successfully.");
      closeProfileEditor();
    } catch (error) {
      toast.error(error?.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditFieldChangeNested = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      organizerContact: {
        ...prev.organizerContact,
        [field]: value,
      },
    }));
  };

  const updateArrayItem = (key, index, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addArrayItem = (key, defaults) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { ...defaults }],
    }));
  };

  const removeArrayItem = (key, index) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const buildStableArrayKey = (prefix, item, index) => {
    if (item && typeof item === "object") {
      const id =
        item._id ||
        item.id ||
        item.name ||
        item.title ||
        item.type ||
        item.category ||
        item.position ||
        item.text ||
        item.label ||
        prefix;
      const secondary =
        item.role ||
        item.contact ||
        item.customName ||
        item.reward ||
        item.date ||
        item.time ||
        item.whatsapp ||
        "";
      return `${prefix}-${String(id)}-${String(secondary)}-${index}`;
    }

    return `${prefix}-${String(item ?? "item")}-${index}`;
  };

  const resolveEditValue = (currentValue, fallbackValue) =>
    currentValue === undefined ? fallbackValue : currentValue;

  const sanitizeAdminEventPayload = (source) => {
    const allowedKeys = new Set([
      "title",
      "category",
      "tagline",
      "description",
      "bannerUrl",
      "cardImageUrl",
      "eventMode",
      "state",
      "district",
      "city",
      "location",
      "venueAddress",
      "pinCode",
      "onlineLink",
      "eventDate",
      "eventEndDate",
      "eventStartTime",
      "eventEndTime",
      "eventTime",
      "registrationStart",
      "registrationEnd",
      "eventStart",
      "eventEnd",
      "schedules",
      "seatAvailability",
      "totalSeats",
      "customSeatDetails",
      "entries",
      "participation",
      "totalPrizePool",
      "prizes",
      "eventRules",
      "securityRequirements",
      "participationSteps",
      "organizerTeam",
      "organizerContact",
      "customFields",
      "status",
      "statusReason",
    ]);

    const payload = {};

    Object.entries(source || {}).forEach(([key, value]) => {
      if (!allowedKeys.has(key)) return;

      if (Array.isArray(value)) {
        payload[key] = value
          .map((item) => {
            if (!item || typeof item !== "object") return item;
            return Object.fromEntries(
              Object.entries(item).flatMap(([nestedKey, nestedValue]) => {
                if (nestedValue === undefined || nestedValue === null || nestedValue === "") {
                  return [];
                }
                return [[nestedKey, nestedValue]];
              })
            );
          })
          .filter((item) => {
            if (!item || typeof item !== "object") return !!item;
            return Object.keys(item).length > 0;
          });
        return;
      }

      if (value && typeof value === "object") {
        payload[key] = Object.fromEntries(
          Object.entries(value).flatMap(([nestedKey, nestedValue]) => {
            if (nestedValue === undefined || nestedValue === null || nestedValue === "") {
              return [];
            }
            return [[nestedKey, nestedValue]];
          })
        );
        return;
      }

      if (value === undefined || value === null) {
        return;
      }

      payload[key] = value;
    });

    if (payload.totalSeats !== undefined && payload.totalSeats !== "") {
      payload.totalSeats = Number(payload.totalSeats);
    }

    if (payload.totalPrizePool !== undefined && payload.totalPrizePool !== "") {
      payload.totalPrizePool = Number(payload.totalPrizePool);
    }

    if (payload.entries?.length) {
      payload.entries = payload.entries.map((entry) => ({
        ...entry,
        category: entry.category || "General / All",
        customName: entry.customName || "",
        participationType: entry.participationType || "Solo",
        isPaid: entry.isPaid || "No",
        price: entry.price === undefined || entry.price === "" ? 0 : Number(entry.price),
      }));
    }

    if (payload.prizes?.length) {
      payload.prizes = payload.prizes.map((prize) => ({
        ...prize,
        position: prize.position || "General",
        amount: prize.amount === undefined || prize.amount === "" ? undefined : Number(prize.amount),
        reward: prize.reward || "",
      }));
    }

    if (payload.eventRules?.length) {
      payload.eventRules = payload.eventRules
        .filter((rule) => typeof rule?.text === "string" && rule.text.trim().length > 0)
        .map((rule) => ({ type: rule.type || "Rule", text: rule.text.trim() }));
    }

    if (payload.securityRequirements?.length) {
      payload.securityRequirements = payload.securityRequirements
        .filter((item) => typeof item?.text === "string" && item.text.trim().length > 0)
        .map((item) => ({
          type: item.type && item.type.trim().length > 0 ? item.type : "Security Requirement",
          text: item.text.trim(),
        }));
    }

    if (payload.participationSteps?.length) {
      payload.participationSteps = payload.participationSteps
        .filter((step) => typeof step?.text === "string" && step.text.trim().length > 0)
        .map((step) => ({ text: step.text.trim() }));
    }

    if (payload.organizerTeam?.length) {
      payload.organizerTeam = payload.organizerTeam
        .filter((member) => typeof member?.name === "string" && member.name.trim().length > 0)
        .map((member) => ({
          name: member.name.trim(),
          role: member.role && member.role.trim().length > 0 ? member.role.trim() : "Organizer Team",
          contact: member.contact && member.contact.trim().length > 0 ? member.contact.trim() : "",
        }));
    }

    if (payload.organizerContact && typeof payload.organizerContact === "object") {
      const contact = payload.organizerContact;
      payload.organizerContact = {
        name: contact.name || "",
        whatsapp: contact.whatsapp || "",
      };
    }

    if (payload.participation && typeof payload.participation === "object") {
      payload.participation = {
        enabled: Boolean(payload.participation.enabled ?? false),
        mode: payload.participation.mode || "Solo",
        minTeamSize: payload.participation.minTeamSize ?? undefined,
        maxTeamSize: payload.participation.maxTeamSize ?? undefined,
      };
    }

    if (payload.status === undefined || payload.status === "") {
      payload.status = detailEvent?.status || "upcoming";
    }

    return payload;
  };

  const uploadAdminEventImage = async (fieldName, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("http://localhost:3000/api/upload/image", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Image upload failed.");
      }

      const uploadedUrl = payload?.data?.url || payload?.url || "";
      if (!uploadedUrl) {
        throw new Error("No image URL returned by the server.");
      }

      setEditForm((prev) => ({
        ...prev,
        [fieldName]: uploadedUrl,
      }));
      toast.success("Image uploaded successfully.");
    } catch (error) {
      toast.error(error?.message || "Unable to upload image.");
    }
  };

  const handleEditSave = async () => {
    if (!eventId || !detailEvent) return;

    try {
      const payload = sanitizeAdminEventPayload({
        ...detailEvent,
        ...editForm,
        title: resolveEditValue(editForm.title, detailEvent.title || ""),
        category: resolveEditValue(editForm.category, detailEvent.category || ""),
        description: resolveEditValue(editForm.description, detailEvent.description || ""),
        eventMode: resolveEditValue(editForm.eventMode, detailEvent.eventMode || "Offline"),
        location: resolveEditValue(editForm.location, detailEvent.location || ""),
        pinCode: resolveEditValue(editForm.pinCode, detailEvent.pinCode || ""),
        onlineLink: resolveEditValue(editForm.onlineLink, detailEvent.onlineLink || ""),
        venueAddress: resolveEditValue(editForm.venueAddress, detailEvent.venueAddress || ""),
        eventDate: resolveEditValue(editForm.eventDate, detailEvent.eventDate || ""),
        eventStartTime: resolveEditValue(editForm.eventStartTime, detailEvent.eventStartTime || detailEvent.eventTime || ""),
        eventEndTime: resolveEditValue(editForm.eventEndTime, detailEvent.eventEndTime || ""),
        totalSeats: editForm.totalSeats === undefined || editForm.totalSeats === "" ? (detailEvent.totalSeats ?? 0) : Number(editForm.totalSeats),
        totalPrizePool: editForm.totalPrizePool === undefined || editForm.totalPrizePool === "" ? (detailEvent.totalPrizePool ?? 0) : Number(editForm.totalPrizePool),
        entries: Array.isArray(editForm.entries) ? editForm.entries : (Array.isArray(detailEvent.entries) ? detailEvent.entries : []),
        prizes: Array.isArray(editForm.prizes) ? editForm.prizes : (Array.isArray(detailEvent.prizes) ? detailEvent.prizes : []),
        participation: {
          enabled: Boolean(editForm.participation?.enabled ?? detailEvent.participation?.enabled ?? false),
          mode: resolveEditValue(editForm.participation?.mode, detailEvent.participation?.mode || "Solo"),
          minTeamSize: editForm.participation?.minTeamSize ?? detailEvent.participation?.minTeamSize ?? undefined,
          maxTeamSize: editForm.participation?.maxTeamSize ?? detailEvent.participation?.maxTeamSize ?? undefined,
        },
        participationSteps: Array.isArray(editForm.participationSteps) ? editForm.participationSteps : (Array.isArray(detailEvent.participationSteps) ? detailEvent.participationSteps : []),
        eventRules: Array.isArray(editForm.eventRules) ? editForm.eventRules : (Array.isArray(detailEvent.eventRules) ? detailEvent.eventRules : []),
        securityRequirements: Array.isArray(editForm.securityRequirements) ? editForm.securityRequirements : (Array.isArray(detailEvent.securityRequirements) ? detailEvent.securityRequirements : []),
        schedules: Array.isArray(editForm.schedules) ? editForm.schedules : (Array.isArray(detailEvent.schedules) ? detailEvent.schedules : []),
        organizerTeam: Array.isArray(editForm.organizerTeam) ? editForm.organizerTeam : (Array.isArray(detailEvent.organizerTeam) ? detailEvent.organizerTeam : []),
        bannerUrl: resolveEditValue(editForm.bannerUrl, detailEvent.bannerUrl || detailEvent.imageUrl || ""),
        cardImageUrl: resolveEditValue(editForm.cardImageUrl, detailEvent.cardImageUrl || detailEvent.bannerUrl || ""),
        organizerContact: {
          ...(detailEvent.organizerContact || {}),
          ...(editForm.organizerContact || {}),
          name: resolveEditValue(editForm.organizerContact?.name, detailEvent.organizerContact?.name || detailEvent.organizerName || ""),
          whatsapp: resolveEditValue(editForm.organizerContact?.whatsapp, detailEvent.organizerContact?.whatsapp || ""),
        },
        status: resolveEditValue(detailEvent.status, "upcoming"),
      });

      const response = await fetch(`http://localhost:3000/api/events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to update event.");
      }

      const serverEvent = result?.data?.event || result?.event || null;
      const refreshedEvent = serverEvent || {
        ...detailEvent,
        ...payload,
        totalSeats: Number(payload.totalSeats || 0),
        organizerContact: payload.organizerContact,
        organizerName: payload.organizerContact?.name || detailEvent.organizerName,
      };

      setSelectedEvent(refreshedEvent);
      setIsEditModalOpen(false);
      toast.success("Event updated successfully.");
    } catch (error) {
      toast.error(error?.message || "Unable to update event.");
    }
  };

  if (loading || isDashboardLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-4 text-sm font-medium text-slate-300 shadow-sm">
          Loading admin workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 text-slate-100 sm:p-5">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 lg:flex-row">
        <aside className="w-full shrink-0 rounded-[28px] border border-slate-800 bg-slate-900 p-4 lg:min-h-[calc(100vh-2.5rem)] lg:w-72">
          <div className="flex h-full flex-col">
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-black text-slate-950">
                CRT
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Admin</div>
                <div className="text-sm font-bold text-white">Control Panel</div>
              </div>
            </div>

            <nav className="space-y-2">
              {sidebarLinks.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSideNav(item.path, item.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_3px_0_0_#10b981]"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

          </div>
        </aside>

        <section className="flex-1 rounded-[28px] border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400">
                {activeSection === "dashboard" ? "Dashboard" : activeSection === "events" ? "Event List" : activeSection === "users" ? "User List" : activeSection === "organizers" ? "Organizer List" : "Profile"}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-white">
                {activeSection === "dashboard" ? "Platform Overview" : activeSection === "events" ? "Event List" : activeSection === "users" ? "User List" : activeSection === "organizers" ? "Organizer List" : "Admin Profile"}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </header>

          {activeSection === "home-slider" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">Home Hero Slider</h2>
                    <p className="mt-1 text-sm text-slate-400">Upload and manage the dynamic slider on the user homepage.</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Slide title
                      <input value={sliderDraft.title} onChange={(event) => setSliderDraft((prev) => ({ ...prev, title: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500" placeholder="Hackathon 2026" />
                    </label>

                    <label className="block text-sm font-medium text-slate-300">
                      Subtitle
                      <input value={sliderDraft.subtitle} onChange={(event) => setSliderDraft((prev) => ({ ...prev, subtitle: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500" placeholder="Build, ship, and pitch your next big idea." />
                    </label>

                    <label className="block text-sm font-medium text-slate-300">
                      Description
                      <textarea value={sliderDraft.description} onChange={(event) => setSliderDraft((prev) => ({ ...prev, description: event.target.value }))} rows={3} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500" placeholder="Discover top challenges and innovation-led events." />
                    </label>

                    <label className="block text-sm font-medium text-slate-300">
                      Link (optional)
                      <input value={sliderDraft.link} onChange={(event) => setSliderDraft((prev) => ({ ...prev, link: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500" placeholder="https://example.com" />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10">
                      <Upload className="h-4 w-4" />
                      Upload poster images
                      <input type="file" accept="image/*" multiple onChange={handleSliderUpload} className="hidden" />
                    </label>

                    {sliderDraft.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {sliderDraft.images.map((imageUrl, index) => (
                          <div key={`${imageUrl}-${index}`} className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
                            <div className="relative">
                              <img src={imageUrl} alt={`Poster preview ${index + 1}`} className="h-28 w-full object-cover" />
                              <div className="absolute left-1 top-1 flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPrimarySliderImage(imageUrl)}
                                  title={sliderDraft.image === imageUrl ? "Primary poster" : "Set as primary poster"}
                                  className="flex items-center gap-1 rounded-full border border-emerald-400/60 bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300"
                                >
                                  <Star className="h-3 w-3" />
                                  {sliderDraft.image === imageUrl ? "Main" : "Set"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSliderImage(index)}
                                  title="Remove poster image"
                                  className="flex items-center gap-1 rounded-full border border-rose-400/60 bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-rose-300"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <label className="flex-1 text-sm font-medium text-slate-300">
                        Order
                        <input type="number" min="0" value={sliderDraft.order} onChange={(event) => setSliderDraft((prev) => ({ ...prev, order: Number(event.target.value) || 0 }))} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
                      </label>

                      <label className="flex items-center gap-2 pt-6 text-sm font-medium text-slate-300">
                        <input type="checkbox" checked={sliderDraft.isActive} onChange={(event) => setSliderDraft((prev) => ({ ...prev, isActive: event.target.checked }))} className="h-4 w-4 accent-emerald-500" />
                        Active
                      </label>
                    </div>

                    <button type="button" onClick={handleSliderCreate} className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400">Save slider</button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <h3 className="mb-4 text-lg font-bold text-white">Saved slides</h3>

                {sliderLoading ? (
                  <div className="py-10 text-center text-sm text-slate-400">Loading slides...</div>
                ) : sliderSlides.length === 0 ? (
                  <div className="py-10 text-center text-sm text-slate-400">No slider slides yet.</div>
                ) : (
                  <div className="space-y-3">
                    {sliderSlides.map((slide) => (
                      <div key={slide.id || slide._id || slide.title} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-3 md:flex-row md:items-center">
                        <img src={slide.image} alt={slide.title} className="h-24 w-full rounded-xl object-cover md:w-40" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{slide.title}</h4>
                            {!slide.isActive && <span className="rounded-full border border-slate-600 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-400">Inactive</span>}
                          </div>
                          {slide.subtitle && <p className="mt-1 text-sm text-slate-300">{slide.subtitle}</p>}
                          {slide.description && <p className="mt-1 text-sm text-slate-400">{slide.description}</p>}
                          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-emerald-400">Order: {slide.order}</p>
                        </div>
                        <button type="button" onClick={() => handleSliderDelete(slide.id || slide._id)} className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20">Delete</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "dashboard" && (
            <>
              <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dashboardData.summary.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{card.label}</span>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-white">{card.value}</div>
                    <div className="mt-1 text-[10px] text-emerald-400">{card.change} vs last month</div>
                  </div>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Recent activity</h2>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">Live</span>
                  </div>

                  <div className="space-y-3">
                    {dashboardData.recentActivity.map((item, index) => (
                      <button
                        key={`${item.title}-${item.detail}-${item.time}-${index}`}
                        type="button"
                        onClick={() => handleSectionOpen(item.section)}
                        className="flex w-full items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-emerald-500/40 hover:bg-slate-900"
                      >
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        <div className="flex-1">
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="mt-1 text-sm text-slate-400">{item.detail}</div>
                        </div>
                        <div className="text-[11px] text-slate-500">{item.time}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                  <h2 className="text-lg font-bold text-white">Quick actions</h2>
                  <div className="mt-4 space-y-3">
                    {dashboardData.quickActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleSectionOpen(action.section)}
                        className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-left text-sm font-medium text-slate-200 transition hover:border-emerald-500/40 hover:text-emerald-400"
                      >
                        <span>{action.label}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === "events" && (
            eventId && detailEvent ? (
              <AdminEventDetailsPage
                event={detailEvent}
                eventId={eventId}
                onBack={handleEventBack}
                statusDraft={statusDraft}
                setStatusDraft={setStatusDraft}
                statusReason={statusReason}
                setStatusReason={setStatusReason}
                updatingStatus={updatingStatus}
                onStatusUpdate={handleStatusUpdate}
                onEditOpen={handleEditOpen}
                deletingEvent={deletingEvent}
                onDeleteEvent={handleDeleteEvent}
              />
            ) : (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">All event records</h2>
                    <p className="mt-1 text-sm text-slate-400">Track event health, approvals, and registration trends.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200">Export</button>
                    <button type="button" className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400">+ Add Event</button>
                  </div>
                </div>

                <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                  {eventSummary.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{item.label}</div>
                      <div className="mt-2 text-xl font-black text-white">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="w-full max-w-md">
                    <input
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search events by title, organizer, category, location, status..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {eventStatusFilters.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setEventFilter(filter)}
                        className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition ${
                          eventFilter === filter
                            ? "bg-emerald-500 text-slate-950"
                            : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500/40 hover:text-white"
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <div className="max-h-[460px] overflow-auto">
                    <table className="w-full table-fixed text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-sm">
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="w-[28%] px-4 py-3 font-medium">Event</th>
                          <th className="w-[26%] px-4 py-3 font-medium">Organizer</th>
                          <th className="w-[18%] px-4 py-3 font-medium">Status</th>
                          <th className="w-[28%] px-4 py-3 font-medium">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleEvents.map((row, index) => (
                          <tr
                            key={`${row.title || "event"}-${row.organizer || "organizer"}-${row.id || row._id || index}`}
                            onClick={() => handleEventOpen(row)}
                            className="cursor-pointer border-b border-slate-800 last:border-b-0 transition hover:bg-slate-800/60"
                          >
                            <td className="max-w-0 truncate px-4 py-3 font-medium text-white" title={row.title}>{row.title}</td>
                            <td className="max-w-0 truncate px-4 py-3 text-slate-300" title={row.organizer}>{row.organizer}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${row.status === "Live" ? "bg-emerald-500/10 text-emerald-400" : row.status === "Upcoming" ? "bg-sky-500/10 text-sky-400" : row.status === "Completed" ? "bg-violet-500/10 text-violet-400" : row.status === "Cancelled" ? "bg-rose-500/10 text-rose-400" : row.status === "Ended" ? "bg-slate-500/10 text-slate-300" : row.status === "Postponed" ? "bg-amber-500/10 text-amber-400" : "bg-slate-700 text-slate-200"}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="max-w-0 truncate px-4 py-3 text-slate-300" title={row.category || "General"}>{row.category || "General"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {activeSection === "users" && <UserList />}

          {activeSection === "organizers" && <OrganizerList />}

          {activeSection === "profile" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.fullName || user.username || "Admin"} className="h-16 w-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-xl font-black text-slate-950">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "A"}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-white">{user?.fullName || user?.username || "Admin"}</h2>
                    <p className="text-[11px] font-medium text-emerald-400">{user?.email || "admin@crt.com"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={openProfileEditor}
                    className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-400"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="text-sm text-slate-400">Access Level</div>
                  <div className="mt-2 text-lg font-bold text-white">{user?.roleTitle || "Super Admin"}</div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                  <div className="text-sm text-slate-400">Status</div>
                  <div className="mt-2 text-lg font-bold text-emerald-400">{user?.isVerified ? "Active" : "Pending"}</div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Personal Info</h3>
                <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Full Name</span><span className="font-medium text-white text-right">{user?.fullName || "Not provided"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Role Title</span><span className="font-medium text-white text-right">{user?.roleTitle || "Super Admin"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Email</span><span className="font-medium text-white text-right break-all">{user?.email || "Not provided"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Phone</span><span className="font-medium text-white text-right">{user?.phone || "Not provided"}</span></div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">About / Bio</h3>
                <p className="text-sm leading-6 text-slate-300">{user?.bio || "No bio available yet."}</p>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Social Links</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">Instagram</span>
                    {renderSocialLink("instagram", user?.socials?.instagram)}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">Twitter</span>
                    {renderSocialLink("twitter", user?.socials?.twitter)}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-400">LinkedIn</span>
                    {renderSocialLink("linkedin", user?.socials?.linkedin)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>


      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm logout</h3>
                <p className="text-sm text-slate-400">Are you sure you want to sign out?</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleLogoutCancel}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-400"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {profileEditOpen && profileDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Admin Profile</p>
                <h3 className="mt-2 text-2xl font-black text-white">Edit profile</h3>
              </div>
              <button type="button" onClick={closeProfileEditor} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200">
                Close
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-700 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3 shadow-inner shadow-slate-900/70">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-lg shadow-emerald-500/10">
                {profileDraft.avatar ? (
                  <img src={profileDraft.avatar} alt="Admin avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-200">
                    {(profileDraft.fullName || profileDraft.username || "A").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                    ADMIN
                  </span>
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">
                    {profileDraft.isVerified ? "Active" : "Pending"}
                  </span>
                </div>
                <div className="mt-2 text-sm font-medium text-emerald-400">{profileDraft.email || "admin@crt.com"}</div>
                <div className="mt-1 text-xs text-slate-400">JPG, PNG or WEBP (Max 2MB)</div>
                <label className="mt-2 inline-flex cursor-pointer items-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:border-emerald-400 hover:bg-emerald-500/15">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const uploadedUrl = await uploadProfileImage(file);
                    if (uploadedUrl) {
                      handleProfileFieldChange("avatar", uploadedUrl);
                      toast.success("Profile image updated successfully.");
                    }
                  }} className="hidden" />
                  {uploadingProfileImage ? "Uploading..." : "Upload image"}
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Personal Info</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Full Name</span>
                    <input value={profileDraft.fullName} onChange={(event) => handleProfileFieldChange("fullName", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Role Title</span>
                    <input value={profileDraft.roleTitle} onChange={(event) => handleProfileFieldChange("roleTitle", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Username</span>
                    <input value={profileDraft.username} onChange={(event) => handleProfileFieldChange("username", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Email Address</span>
                    <input type="email" value={profileDraft.email} onChange={(event) => handleProfileFieldChange("email", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                    <span>Phone</span>
                    <input value={profileDraft.phone} onChange={(event) => handleProfileFieldChange("phone", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">About / Bio</h4>
                <label className="block text-sm text-slate-300">
                  <textarea rows={4} value={profileDraft.bio} onChange={(event) => handleProfileFieldChange("bio", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                </label>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Social Links</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Instagram</span>
                    <input value={profileDraft.socials?.instagram || ""} onChange={(event) => handleProfileFieldChange("socials", { ...profileDraft.socials, instagram: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>Twitter</span>
                    <input value={profileDraft.socials?.twitter || ""} onChange={(event) => handleProfileFieldChange("socials", { ...profileDraft.socials, twitter: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                  <label className="space-y-2 text-sm text-slate-300">
                    <span>LinkedIn</span>
                    <input value={profileDraft.socials?.linkedin || ""} onChange={(event) => handleProfileFieldChange("socials", { ...profileDraft.socials, linkedin: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-500" />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300">
                <input type="checkbox" checked={profileDraft.isVerified} onChange={(event) => handleProfileFieldChange("isVerified", event.target.checked)} className="h-4 w-4 accent-emerald-500" />
                Verified admin
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeProfileEditor} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200">
                Cancel
              </button>
              <button type="button" onClick={handleProfileSave} disabled={savingProfile} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70">
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Edit Event</p>
                <h3 className="mt-2 text-2xl font-black text-white">Update event details</h3>
              </div>
              <button
                type="button"
                onClick={handleEditClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Title</span>
                <input
                  value={editForm.title}
                  onChange={(event) => handleEditFieldChange("title", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Category</span>
                <input
                  value={editForm.category}
                  onChange={(event) => handleEditFieldChange("category", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Event mode</span>
                <select
                  value={editForm.eventMode}
                  onChange={(event) => handleEditFieldChange("eventMode", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                >
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Location</span>
                <input
                  value={editForm.location}
                  onChange={(event) => handleEditFieldChange("location", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">State</span>
                <input
                  value={editForm.state}
                  onChange={(event) => handleEditFieldChange("state", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">District</span>
                <input
                  value={editForm.district}
                  onChange={(event) => handleEditFieldChange("district", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">City</span>
                <input
                  value={editForm.city}
                  onChange={(event) => handleEditFieldChange("city", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">PIN code</span>
                <input
                  value={editForm.pinCode}
                  onChange={(event) => handleEditFieldChange("pinCode", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Venue address</span>
                <input
                  value={editForm.venueAddress}
                  onChange={(event) => handleEditFieldChange("venueAddress", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Online link</span>
                <input
                  value={editForm.onlineLink}
                  onChange={(event) => handleEditFieldChange("onlineLink", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Date</span>
                <input
                  type="date"
                  value={editForm.eventDate}
                  onChange={(event) => handleEditFieldChange("eventDate", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Start time</span>
                <input
                  value={editForm.eventStartTime}
                  onChange={(event) => handleEditFieldChange("eventStartTime", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">End time</span>
                <input
                  value={editForm.eventEndTime}
                  onChange={(event) => handleEditFieldChange("eventEndTime", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Total seats</span>
                <input
                  type="number"
                  min="0"
                  value={editForm.totalSeats}
                  onChange={(event) => handleEditFieldChange("totalSeats", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Contact name</span>
                <input
                  value={editForm.organizerContact.name}
                  onChange={(event) => handleEditFieldChangeNested("name", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">WhatsApp</span>
                <input
                  value={editForm.organizerContact.whatsapp}
                  onChange={(event) => handleEditFieldChangeNested("whatsapp", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Banner image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadAdminEventImage("bannerUrl", file);
                    }
                    event.target.value = "";
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Card image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadAdminEventImage("cardImageUrl", file);
                    }
                    event.target.value = "";
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
                />
              </label>

              <label className="md:col-span-2 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Description</span>
                <textarea
                  rows={5}
                  value={editForm.description}
                  onChange={(event) => handleEditFieldChange("description", event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Participation Format</h4>
                  <button type="button" onClick={() => setEditForm((prev) => ({ ...prev, participation: { ...prev.participation, enabled: true } }))} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">{editForm.participation?.enabled ? "Enabled" : "Enable"}</button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select value={editForm.participation?.mode || "Solo"} onChange={(event) => setEditForm((prev) => ({ ...prev, participation: { ...prev.participation, mode: event.target.value } }))} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
                    <option value="Solo">Solo</option>
                    <option value="Team">Team</option>
                    <option value="Both">Both</option>
                  </select>
                  <input type="number" min="0" value={editForm.participation?.minTeamSize ?? ""} onChange={(event) => setEditForm((prev) => ({ ...prev, participation: { ...prev.participation, minTeamSize: event.target.value } }))} placeholder="Min team size" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                  <input type="number" min="0" value={editForm.participation?.maxTeamSize ?? ""} onChange={(event) => setEditForm((prev) => ({ ...prev, participation: { ...prev.participation, maxTeamSize: event.target.value } }))} placeholder="Max team size" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Entry options & pricing</h4>
                  <button type="button" onClick={() => addArrayItem("entries", { category: "General / All", customName: "", participationType: "Solo", isPaid: "No", price: 0 })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add tier</button>
                </div>
                <div className="space-y-3">
                  {(editForm.entries || []).map((entry, index) => (
                    <div key={buildStableArrayKey("entry", entry, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Tier {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("entries", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={entry.category || ""} onChange={(event) => updateArrayItem("entries", index, "category", event.target.value)} placeholder="Category" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={entry.customName || ""} onChange={(event) => updateArrayItem("entries", index, "customName", event.target.value)} placeholder="Custom name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <select value={entry.participationType || "Solo"} onChange={(event) => updateArrayItem("entries", index, "participationType", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                          <option value="Solo">Solo</option>
                          <option value="Team">Team</option>
                          <option value="Both">Both</option>
                        </select>
                        <select value={entry.isPaid || "No"} onChange={(event) => updateArrayItem("entries", index, "isPaid", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
                          <option value="No">Free</option>
                          <option value="Yes">Paid</option>
                        </select>
                        <input type="number" min="0" value={entry.price ?? 0} onChange={(event) => updateArrayItem("entries", index, "price", Number(event.target.value) || 0)} placeholder="Price" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2" />
                      </div>
                    </div>
                  ))}
                  {(editForm.entries || []).length === 0 && <p className="text-sm text-slate-400">No entry options added yet.</p>}
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Prizes & rewards</h4>
                  <button type="button" onClick={() => addArrayItem("prizes", { category: "General / Open Event", position: "Winner", amount: 0, reward: "" })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add prize</button>
                </div>
                <div className="space-y-3">
                  {(editForm.prizes || []).map((prize, index) => (
                    <div key={buildStableArrayKey("prize", prize, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Prize {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("prizes", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={prize.category || ""} onChange={(event) => updateArrayItem("prizes", index, "category", event.target.value)} placeholder="Category" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={prize.position || ""} onChange={(event) => updateArrayItem("prizes", index, "position", event.target.value)} placeholder="Position" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input type="number" min="0" value={prize.amount ?? 0} onChange={(event) => updateArrayItem("prizes", index, "amount", Number(event.target.value) || 0)} placeholder="Amount" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={prize.reward || ""} onChange={(event) => updateArrayItem("prizes", index, "reward", event.target.value)} placeholder="Reward / perk" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2" />
                      </div>
                    </div>
                  ))}
                  {(editForm.prizes || []).length === 0 && <p className="text-sm text-slate-400">No prize rows added yet.</p>}
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Rules & Regulations</h4>
                  <button type="button" onClick={() => addArrayItem("eventRules", { type: "Rule", text: "" })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add rule</button>
                </div>
                <div className="space-y-3">
                  {(editForm.eventRules || []).map((rule, index) => (
                    <div key={buildStableArrayKey("rule", rule, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Rule {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("eventRules", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={rule.type || ""} onChange={(event) => updateArrayItem("eventRules", index, "type", event.target.value)} placeholder="Type" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <textarea rows={3} value={rule.text || ""} onChange={(event) => updateArrayItem("eventRules", index, "text", event.target.value)} placeholder="Rules details" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2" />
                      </div>
                    </div>
                  ))}
                  {(editForm.eventRules || []).length === 0 && <p className="text-sm text-slate-400">No rules added yet.</p>}
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">How to participate</h4>
                  <button type="button" onClick={() => addArrayItem("participationSteps", { text: "" })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add step</button>
                </div>
                <div className="space-y-3">
                  {(editForm.participationSteps || []).map((step, index) => (
                    <div key={buildStableArrayKey("step", step, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Step {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("participationSteps", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <textarea rows={3} value={step.text || ""} onChange={(event) => updateArrayItem("participationSteps", index, "text", event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                    </div>
                  ))}
                  {(editForm.participationSteps || []).length === 0 && <p className="text-sm text-slate-400">No participation steps added yet.</p>}
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Organizer & Helpdesk Info</h4>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input value={editForm.organizerContact?.name || ""} onChange={(event) => handleEditFieldChangeNested("name", event.target.value)} placeholder="Lead organizer name" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                  <input value={editForm.organizerContact?.whatsapp || ""} onChange={(event) => handleEditFieldChangeNested("whatsapp", event.target.value)} placeholder="WhatsApp number" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" />
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Organizer Team</h4>
                  <button type="button" onClick={() => addArrayItem("organizerTeam", { name: "", role: "Organizer Team", contact: "" })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add member</button>
                </div>
                <div className="space-y-3">
                  {(editForm.organizerTeam || []).map((member, index) => (
                    <div key={buildStableArrayKey("member", member, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Member {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("organizerTeam", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <input value={member.name || ""} onChange={(event) => updateArrayItem("organizerTeam", index, "name", event.target.value)} placeholder="Name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={member.role || ""} onChange={(event) => updateArrayItem("organizerTeam", index, "role", event.target.value)} placeholder="Role" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={member.contact || ""} onChange={(event) => updateArrayItem("organizerTeam", index, "contact", event.target.value)} placeholder="Contact" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                      </div>
                    </div>
                  ))}
                  {(editForm.organizerTeam || []).length === 0 && <p className="text-sm text-slate-400">No team members added yet.</p>}
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Event Schedule & Timeline</h4>
                  <button type="button" onClick={() => addArrayItem("schedules", { type: "Event", customType: "", date: "", time: "" })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add schedule</button>
                </div>
                <div className="space-y-3">
                  {(editForm.schedules || []).map((schedule, index) => (
                    <div key={buildStableArrayKey("schedule", schedule, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Schedule {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("schedules", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-3">
                        <input value={schedule.type || ""} onChange={(event) => updateArrayItem("schedules", index, "type", event.target.value)} placeholder="Type" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input value={schedule.customType || ""} onChange={(event) => updateArrayItem("schedules", index, "customType", event.target.value)} placeholder="Custom type" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input type="date" value={schedule.date || ""} onChange={(event) => updateArrayItem("schedules", index, "date", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <input type="time" value={schedule.time || ""} onChange={(event) => updateArrayItem("schedules", index, "time", event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-3" />
                      </div>
                    </div>
                  ))}
                  {(editForm.schedules || []).length === 0 && <p className="text-sm text-slate-400">No schedule entries added yet.</p>}
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-bold text-white">Security & compliance</h4>
                  <button type="button" onClick={() => addArrayItem("securityRequirements", { type: "Other", text: "" })} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-400">Add requirement</button>
                </div>
                <div className="space-y-3">
                  {(editForm.securityRequirements || []).map((requirement, index) => (
                    <div key={buildStableArrayKey("security", requirement, index)} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Requirement {index + 1}</span>
                        <button type="button" onClick={() => removeArrayItem("securityRequirements", index)} className="text-xs text-rose-400">Remove</button>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={requirement.type || ""} onChange={(event) => updateArrayItem("securityRequirements", index, "type", event.target.value)} placeholder="Type" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
                        <textarea rows={3} value={requirement.text || ""} onChange={(event) => updateArrayItem("securityRequirements", index, "text", event.target.value)} placeholder="Requirement details" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2" />
                      </div>
                    </div>
                  ))}
                  {(editForm.securityRequirements || []).length === 0 && <p className="text-sm text-slate-400">No security requirements added yet.</p>}
                </div>
              </div>

              {(editForm.bannerUrl || editForm.cardImageUrl) && (
                <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                  {editForm.bannerUrl && (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">Banner preview</div>
                      <img src={editForm.bannerUrl} alt="Banner preview" className="h-32 w-full rounded-xl object-cover" />
                    </div>
                  )}
                  {editForm.cardImageUrl && (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
                      <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-slate-400">Card preview</div>
                      <img src={editForm.cardImageUrl} alt="Card preview" className="h-32 w-full rounded-xl object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleEditClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;
