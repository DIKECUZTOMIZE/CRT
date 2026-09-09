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
        className="create-event-form mx-auto max-w-5xl space-y-6 rounded-[28px] border border-white/10 bg-gradient-to-b from-[#0b0b0b] to-[#050505] p-4 text-white shadow-[0_25px_80px_rgba(0,0,0,0.7)] sm:p-6"
      >
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
