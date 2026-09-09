import { useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { createEvent, getEventById, updateEvent } from "../api/events.api.js";

const removeEmpty = (value) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? "" : trimmed;
  }
  return value;
};

const sanitizeArray = (items = []) =>
  items
    .map((item) => {
      if (!item || typeof item !== "object") return item;

      const cleaned = Object.fromEntries(
        Object.entries(item).map(([key, value]) => [key, removeEmpty(value)])
      );

      return cleaned;
    })
    .filter((item) => {
      if (!item || typeof item !== "object") return false;

      if (item.fieldType !== undefined || item.isRequired !== undefined) {
        return typeof item.fieldName === "string" && item.fieldName.trim().length > 0;
      }

      if (item.fieldName !== undefined) {
        return typeof item.fieldName === "string" && item.fieldName.trim().length > 0;
      }

      if (item.name !== undefined) {
        return typeof item.name === "string" && item.name.trim().length > 0;
      }

      if (item.text !== undefined) {
        return typeof item.text === "string" && item.text.trim().length > 0;
      }

      if (item.position !== undefined) {
        return typeof item.position === "string" && item.position.trim().length > 0;
      }

      return Object.values(item).some(
        (value) => value !== undefined && value !== null && value !== "" && value !== false
      );
    });

const parseTimeValue = (value) => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const meridiemMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})\s*([AaPp][Mm])$/);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const meridiem = meridiemMatch[3].toUpperCase();

    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;

    return new Date(0, 0, 0, hours, minutes, 0);
  }

  const standardMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})$/);
  if (standardMatch) {
    const hours = Number(standardMatch[1]);
    const minutes = Number(standardMatch[2]);
    return new Date(0, 0, 0, hours, minutes, 0);
  }

  return null;
};

const combineDateTime = (dateValue, timeValue) => {
  if (!dateValue) return null;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;

  const time = parseTimeValue(timeValue);
  if (!time) return date;

  const nextDate = new Date(date);
  nextDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return nextDate;
};

const deriveEventStatus = (eventData = {}) => {
  const incomingStatus = String(eventData.status || "").trim().toLowerCase();

  if (["cancelled", "postponed", "upcoming", "live", "completed", "ended"].includes(incomingStatus)) {
    return incomingStatus;
  }

  const start = combineDateTime(eventData.eventDate || eventData.eventStart, eventData.eventStartTime || eventData.eventTime);
  const end = combineDateTime(eventData.eventEndDate || eventData.eventEnd || eventData.eventDate || eventData.eventStart, eventData.eventEndTime || eventData.eventTime || eventData.eventStartTime);

  if (!start && !end) return "upcoming";

  const now = new Date();
  if (end && now > end) return "completed";
  if (start && now >= start && end && now < end) return "live";
  if (start && now < start) return "upcoming";
  return "upcoming";
};

const sanitizeEventPayload = (formData, eventId = null) => {
  const allowedKeys = new Set([
    "title",
    "category",
    "tagline",
    "description",
    "bannerUrl",
    "cardImageUrl",
    "eventMode",
    "location",
    "state",
    "district",
    "city",
    "pinCode",
    "venueAddress",
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
    "participationMode",
    "minTeamSize",
    "maxTeamSize",
    "hasParticipationType",
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

  Object.keys(formData || {}).forEach((key) => {
    if (!allowedKeys.has(key)) return;

    const value = formData[key];

    if (Array.isArray(value)) {
      payload[key] = sanitizeArray(value);
      return;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      payload[key] = Object.fromEntries(
        Object.entries(value).map(([nestedKey, nestedValue]) => [nestedKey, removeEmpty(nestedValue)])
      );
      return;
    }

    payload[key] = removeEmpty(value);
  });

  const participationEnabled = payload.hasParticipationType === "Yes" || payload.hasParticipationType === true;
  const participationMode = payload.participationMode || "Solo";
  const minTeamSize = payload.minTeamSize === undefined || payload.minTeamSize === "" ? undefined : Number(payload.minTeamSize);
  const maxTeamSize = payload.maxTeamSize === undefined || payload.maxTeamSize === "" ? undefined : Number(payload.maxTeamSize);

  delete payload.hasParticipationType;
  delete payload.participationMode;
  delete payload.minTeamSize;
  delete payload.maxTeamSize;
  delete payload.selectedPrizeCategory;
  delete payload.customPrizeCategory;
  delete payload.hasCustomFields;

  if (payload.totalSeats !== undefined && payload.totalSeats !== "") {
    payload.totalSeats = Number(payload.totalSeats);
  }

  if (payload.totalPrizePool !== undefined && payload.totalPrizePool !== "") {
    payload.totalPrizePool = Number(payload.totalPrizePool);
  }

  if (payload.eventStartTime && !payload.eventTime) {
    payload.eventTime = payload.eventStartTime;
  }

  if (payload.eventEndTime && !payload.eventTime) {
    payload.eventTime = payload.eventEndTime;
  }

  const primaryAddress = String(payload.venueAddress || payload.location || "").trim();
  const fallbackAddress = String(payload.location || payload.venueAddress || "").trim();

  if (primaryAddress) {
    payload.venueAddress = primaryAddress;
    payload.location = primaryAddress;
  } else if (fallbackAddress) {
    payload.venueAddress = fallbackAddress;
    payload.location = fallbackAddress;
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

  payload.participation = {
    enabled: participationEnabled,
    mode: participationEnabled ? participationMode : "Solo",
    minTeamSize: participationEnabled && (participationMode === "Team" || participationMode === "Both") ? minTeamSize : undefined,
    maxTeamSize: participationEnabled && (participationMode === "Team" || participationMode === "Both") ? maxTeamSize : undefined,
  };

  payload.customFields = sanitizeArray(payload.customFields || []).filter(
    (field) => typeof field.fieldName === "string" && field.fieldName.trim().length > 0
  );
  payload.organizerTeam = sanitizeArray(payload.organizerTeam || []);
  payload.eventRules = sanitizeArray(payload.eventRules || []).filter(
    (field) => typeof field.text === "string" && field.text.trim().length > 0
  );
  payload.securityRequirements = sanitizeArray(payload.securityRequirements || [])
    .filter((field) => typeof field.text === "string" && field.text.trim().length > 0)
    .map((field) => ({
      type: field.type && field.type.trim().length > 0 ? field.type : "Security Requirement",
      text: field.text.trim(),
    }));
  payload.participationSteps = sanitizeArray(payload.participationSteps || []);
  payload.schedules = sanitizeArray(payload.schedules || []);

  if (eventId) {
    payload.status = payload.status ? deriveEventStatus(payload) : "upcoming";
  } else {
    payload.status = "upcoming";
  }

  return payload;
};

const stringifyComparableValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(stringifyComparableValue).filter(Boolean);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nestedValue]) => [key, stringifyComparableValue(nestedValue)])
    );
  }
  return value;
};

const populateFormFromEvent = (event) => {
  if (!event || typeof event !== "object") {
    return {};
  }

  const storedLocation = event.venueAddress || event.location || "";

  return {
    title: event.title || "",
    category: event.category || "",
    tagline: event.tagline || "",
    eventMode: event.eventMode || "Offline",
    status: event.status || "upcoming",
    statusReason: event.statusReason || "",
    location: storedLocation,
    venueAddress: storedLocation,
    onlineLink: event.onlineLink || "",
    description: event.description || "",
    bannerUrl: event.bannerUrl || "",
    cardImageUrl: event.cardImageUrl || "",
    eventDate: event.eventDate || "",
    eventEndDate: event.eventEndDate || "",
    eventStartTime: event.eventStartTime || "",
    eventEndTime: event.eventEndTime || "",
    eventTime: event.eventTime || "",
    registrationStart: event.registrationStart || "",
    registrationEnd: event.registrationEnd || "",
    eventStart: event.eventStart || "",
    eventEnd: event.eventEnd || "",
    schedules: Array.isArray(event.schedules) ? event.schedules : [],
    seatAvailability: event.seatAvailability || "",
    totalSeats: event.totalSeats ?? "",
    customSeatDetails: event.customSeatDetails || "",
    entries: Array.isArray(event.entries) ? event.entries : [],
    hasParticipationType: event.participation?.enabled ? "Yes" : "No",
    participationMode: event.participation?.mode || "Solo",
    minTeamSize: event.participation?.minTeamSize ?? "",
    maxTeamSize: event.participation?.maxTeamSize ?? "",
    totalPrizePool: event.totalPrizePool ?? "",
    prizes: Array.isArray(event.prizes) ? event.prizes : [],
    eventRules: Array.isArray(event.eventRules) ? event.eventRules : [],
    securityRequirements: Array.isArray(event.securityRequirements) ? event.securityRequirements : [],
    participationSteps: Array.isArray(event.participationSteps) ? event.participationSteps : [],
    organizerTeam: Array.isArray(event.organizerTeam) ? event.organizerTeam : [],
    organizerContact: event.organizerContact || { name: "", whatsapp: "" },
    customFields: Array.isArray(event.customFields) ? event.customFields : [],
    state: event.state || "",
    district: event.district || "",
    city: event.city || "",
    pinCode: event.pinCode || "",
  };
};

export const useCreateEventForm = (eventId = null) => {
  const navigate = useNavigate();
  const originalEventSnapshotRef = useRef(null);
  const methods = useForm({
    defaultValues: {
      isEditing: Boolean(eventId),
      // Basic Details
      title: "",
      category: "",
      tagline: "",
      eventMode: "Offline",
      status: "upcoming",
      statusReason: "",
      location: "",
      state: "",
      district: "",
      city: "",
      venueAddress: "",
      onlineLink: "",
      description: "",
      bannerUrl: "",
      cardImageUrl: "",

      // Schedule & Registration
      eventDate: "",
      eventEndDate: "",
      eventStartTime: "",
      eventEndTime: "",
      eventTime: "",
      registrationStart: "",
      registrationEnd: "",
      eventStart: "",
      eventEnd: "",
      schedules: [],
      seatAvailability: "",
      totalSeats: "",
      customSeatDetails: "",

      // Entry Options
      entries: [],

      // Participation Format
      hasParticipationType: "No",
      participationMode: "Solo",
      minTeamSize: "",
      maxTeamSize: "",

      // Prizes
      selectedPrizeCategory: "General",
      customPrizeCategory: "",
      totalPrizePool: "",
      prizes: [],

      // Rules
      eventRules: [],
      securityRequirements: [],
      participationSteps: [],
      organizerTeam: [],
      organizerContact: {
        name: "",
        whatsapp: "",
      },

      // Custom Fields
      hasCustomFields: "No",
      customFields: [],
    },
    mode: "onTouched",
  });

  const { control, handleSubmit, formState, reset } = methods;

  const entryArray = useFieldArray({ control, name: "entries" });
  const prizeArray = useFieldArray({ control, name: "prizes" });
  const customFieldArray = useFieldArray({ control, name: "customFields" });

  useEffect(() => {
    if (!eventId) return;

    let active = true;

    const loadEvent = async () => {
      try {
        const event = await getEventById(eventId);
        if (!active || !event) return;

        const populatedForm = populateFormFromEvent(event);
        originalEventSnapshotRef.current = JSON.stringify(stringifyComparableValue(populatedForm));

        reset({
          ...populatedForm,
          isEditing: true,
        });
      } catch (error) {
        console.error("Failed to load event for edit:", error);
      }
    };

    loadEvent();

    return () => {
      active = false;
    };
  }, [eventId, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = sanitizeEventPayload(formData, eventId);

      if (eventId) {
        const nextSnapshot = JSON.stringify(stringifyComparableValue(formData));
        const currentSnapshot = originalEventSnapshotRef.current;

        if (currentSnapshot && nextSnapshot === currentSnapshot) {
          toast.info("No changes detected. Keeping the original event details.");
          navigate(`/organizer/events/${eventId}`);
          return;
        }

        await updateEvent(eventId, payload);
        toast.success("Event updated successfully.");
        navigate("/organizer/events");
        return;
      }

      await createEvent(payload);
      toast.success("Event created successfully.");
      methods.reset();
      navigate("/organizer/events");
    } catch (error) {
      toast.error(error.message || "Unable to create event.");
    }
  };

  const onError = (errors) => {
    if (import.meta.env.DEV && Object.keys(errors || {}).length > 0) {
      console.warn("Form validation warnings:", errors);
    }
  };

  return {
    methods,
    handleSubmit: handleSubmit(onSubmit, onError),
    isSubmitting: formState.isSubmitting,
    entryArray,
    prizeArray,
    customFieldArray,
    isEditing: Boolean(eventId),
  };
};
