import { StatusCodes } from "http-status-codes";

import { getSocketServer } from "../../socket/socket.server.js";
import {
    createEventService,
    deleteEventService,
    getOrganizerEventByIdService,
    getOrganizerEventsService,
    getPublicEventByIdService,
    getPublicEventsService,
    incrementEventViewsService,
    submitEventRatingService,
    updateEventService,
} from "./event.service.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import { NotFoundError } from "../../shared/error/notFound.error.js";

export const createEventController = async (req, res) => {
    const event = await createEventService(req.user.sub, req.body);

    return buildSuccessResponse(
        res,
        "Event created successfully",
        { event },
        StatusCodes.CREATED
    );
};

export const getPublicEventsController = async (req, res) => {
    const filters = {
        search: req.query.search,
        organizer: req.query.organizer,
        category: req.query.category,
        state: req.query.state,
        city: req.query.city,
        location: req.query.location,
        participationType: req.query.participationType,
        isFreeOnly: req.query.isFreeOnly,
        minPrize: req.query.minPrize,
        dateRange: req.query.dateRange,
    };

    const pagination = {
        page: req.query.page,
        limit: req.query.limit,
    };

    const result = await getPublicEventsService(filters, pagination);

    return buildSuccessResponse(
        res,
        "Public events retrieved successfully",
        {
            events: result.events,
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        },
        StatusCodes.OK
    );
};

export const getPublicEventByIdController = async (req, res) => {
    const event = await getPublicEventByIdService(req.params.id);

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    return buildSuccessResponse(
        res,
        "Event retrieved successfully",
        { event },
        StatusCodes.OK
    );
};

export const incrementEventViewsController = async (req, res) => {
    const event = await getPublicEventByIdService(req.params.id);

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    const updatedEvent = await incrementEventViewsService(req.params.id);
    const io = getSocketServer();

    if (io) {
        io.emit("event:updated", {
            eventId: req.params.id,
            type: "view",
            event: updatedEvent || event,
        });
    }

    return buildSuccessResponse(
        res,
        "Event view count updated successfully",
        { event: updatedEvent || event },
        StatusCodes.OK
    );
};

export const rateEventController = async (req, res) => {
    const updatedEvent = await submitEventRatingService(
        req.params.id,
        req.user?.sub,
        req.body?.rating
    );

    if (!updatedEvent) {
        throw new NotFoundError("Event not found");
    }

    const io = getSocketServer();

    if (io) {
        io.emit("event:updated", {
            eventId: req.params.id,
            type: "rating",
            event: updatedEvent,
        });
    }

    return buildSuccessResponse(
        res,
        "Event rating saved successfully",
        { event: updatedEvent },
        StatusCodes.OK
    );
};

export const getOrganizerEventsController = async (req, res) => {
    const events = await getOrganizerEventsService(req.user.sub);

    return buildSuccessResponse(
        res,
        "Events retrieved successfully",
        { events },
        StatusCodes.OK
    );
};

export const getOrganizerEventByIdController = async (req, res) => {
    const event = await getOrganizerEventByIdService(req.user.sub, req.params.id, req.user.role);

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    return buildSuccessResponse(
        res,
        "Event retrieved successfully",
        { event },
        StatusCodes.OK
    );
};

export const updateEventController = async (req, res) => {
    const event = await updateEventService(req.user.sub, req.params.id, req.body, req.user.role);

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    return buildSuccessResponse(
        res,
        "Event updated successfully",
        { event },
        StatusCodes.OK
    );
};

export const deleteEventController = async (req, res) => {
    const event = await deleteEventService(req.user.sub, req.params.id, req.user.role);

    if (!event) {
        throw new NotFoundError("Event not found");
    }

    return buildSuccessResponse(
        res,
        "Event deleted successfully",
        { event },
        StatusCodes.OK
    );
};
