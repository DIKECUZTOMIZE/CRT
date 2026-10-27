import React from "react";
import { FormProvider } from "react-hook-form";
import { useParams } from "react-router";

import CreateEventHeader from "../Components/form/CreateEventHeader";
import EventBasicInfo from "../Components/form/EventBasicInfo";
import EventSchedule from "../Components/form/EventSchedule";
import EventEntryOptions from "../Components/form/EventEntryOptions";
import EventParticipation from "../Components/form/EventParticipation";
import EventPrizes from "../Components/form/EventPrizes";
import EventHowToParticipate from "../Components/form/EventHowToParticipate";
import EventRules from "../Components/form/EventRules";
import EventSecurityRequirements from "../Components/form/EventSecurityRequirements";

import EventCustomFields from "../Components/form/EventCustomFields";
import EventFormActions from "../Components/form/EventFormActions";

import { useCreateEventPage } from "../../hook/useCreateEventPage.js";
import EventOrganizers from "../Components/form/EventOrganizers.jsx";
import OrganizerContact from "../Components/form/OrganizerContact.jsx";

export default function CreateEvent() {
  const { id } = useParams();
  const { methods, handleSubmit, isSubmitting, isEditing, isLightMode, toggleLightMode } = useCreateEventPage(id);

  return (
    <FormProvider {...methods}>
      <form
        data-mode={isLightMode ? "light" : "dark"}
        onSubmit={handleSubmit}
        className="event-create-mobile-root create-event-form mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-800/80 bg-[#020617] p-3 text-[#CBD5E1] shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-md sm:p-5"
      >
        <style>{`
          .create-event-form input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),
          .create-event-form select,
          .create-event-form textarea,
          .create-event-form[data-mode="light"] input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]),
          .create-event-form[data-mode="light"] select,
          .create-event-form[data-mode="light"] textarea {
            background-color: rgba(15, 23, 42, 0.7) !important;
            border-color: #334155 !important;
            color: #CBD5E1 !important;
            -webkit-text-fill-color: #CBD5E1 !important;
            box-shadow: none !important;
          }

          .create-event-form input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])::placeholder,
          .create-event-form textarea::placeholder,
          .create-event-form[data-mode="light"] input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])::placeholder,
          .create-event-form[data-mode="light"] textarea::placeholder,
          .create-event-form input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"])::-webkit-input-placeholder,
          .create-event-form textarea::-webkit-input-placeholder {
            color: #333333 !important;
            -webkit-text-fill-color: #333333 !important;
            opacity: 1 !important;
          }

          .create-event-form select:has(option[value=""]:checked) {
            color: #333333 !important;
            -webkit-text-fill-color: #333333 !important;
          }

          .create-event-form select option[value=""] {
            color: #333333 !important;
          }

          .create-event-form input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):-webkit-autofill,
          .create-event-form textarea:-webkit-autofill,
          .create-event-form select:-webkit-autofill,
          .create-event-form[data-mode="light"] input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):-webkit-autofill,
          .create-event-form[data-mode="light"] textarea:-webkit-autofill,
          .create-event-form[data-mode="light"] select:-webkit-autofill {
            -webkit-text-fill-color: #CBD5E1 !important;
            box-shadow: 0 0 0 1000px rgba(15, 23, 42, 0.7) inset !important;
          }

          .create-event-form select {
            background-image: none !important;
          }

          .create-event-form .form-section-shell,
          .create-event-form .event-create-basic-info-shell,
          .create-event-form .event-form-actions-panel,
          .create-event-form [class*="bg-white"],
          .create-event-form [class*="bg-slate-50"],
          .create-event-form [class*="bg-slate-100"],
          .create-event-form [class*="bg-slate-200"],
          .create-event-form [class*="bg-slate-300"] {
            background: rgba(15, 23, 42, 0.75) !important;
            border-color: #1E293B !important;
          }

          .create-event-form [class*="border-slate-200"],
          .create-event-form [class*="border-slate-300"],
          .create-event-form [class*="border-slate-400"],
          .create-event-form [class*="border-slate-500"] {
            border-color: #334155 !important;
          }

          .create-event-form .form-section-title,
          .create-event-form .form-field-label,
          .create-event-form .form-field-hint,
          .create-event-form .event-form-help,
          .create-event-form .text-slate-300,
          .create-event-form .text-slate-400,
          .create-event-form .text-slate-500,
          .create-event-form [class*="text-slate-700"],
          .create-event-form [class*="text-slate-800"],
          .create-event-form [class*="text-slate-900"],
          .create-event-form [class*="text-white"] {
            color: #CBD5E1 !important;
          }

          .create-event-form .form-section-description,
          .create-event-form [class*="text-slate-400"],
          .create-event-form [class*="text-slate-500"] {
            color: #94A3B8 !important;
          }

          .create-event-form .form-section-title,
          .create-event-form .form-section-description {
            line-height: 1.4 !important;
            white-space: normal !important;
          }

          .create-event-form h1,
          .create-event-form h2,
          .create-event-form h3,
          .create-event-form .form-section-title,
          .create-event-form [class*="text-white"] {
            color: #E2E8F0 !important;
          }

          .create-event-form input:focus,
          .create-event-form select:focus,
          .create-event-form textarea:focus,
          .create-event-form input:focus-visible,
          .create-event-form select:focus-visible,
          .create-event-form textarea:focus-visible {
            border-color: #10B981 !important;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
          }

          @media (max-width: 639.98px) {
            .event-create-mobile-root {
              background: linear-gradient(135deg, #020617 0%, #0f172a 30%, #111827 100%) !important;
              background-image: linear-gradient(135deg, #020617 0%, #0f172a 30%, #111827 100%) !important;
              color: #E2E8F0 !important;
            }

            .event-create-mobile-root .form-section-shell,
            .event-create-mobile-root .event-create-basic-info-shell {
              background: rgba(15, 23, 42, 0.75) !important;
            }

            .event-create-mobile-root .form-section-header,
            .event-create-mobile-root .event-create-basic-info-shell .form-section-header {
              background: transparent !important;
            }
          }
        `}</style>
        <CreateEventHeader isEditing={isEditing} isLightMode={isLightMode} onToggleMode={toggleLightMode} />

        <EventBasicInfo />
        <EventSchedule />

        <EventEntryOptions />

        <EventParticipation />
        <EventPrizes />
        <EventHowToParticipate />
        <EventRules />
        <EventSecurityRequirements />
        <EventOrganizers />
        <EventCustomFields />
        <OrganizerContact />
        <EventFormActions isSubmitting={isSubmitting} />
      </form>
    </FormProvider>
  );
}
