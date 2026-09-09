import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import {
  getOrganizerProfileService,
  updateOrganizerProfileService,
} from "./profile.service.js";

export const getOrganizerProfileController = async (req, res) => {
  const profile = await getOrganizerProfileService(req.user.sub);

  return buildSuccessResponse(
    res,
    "Organizer profile retrieved successfully",
    { profile },
    200,
  );
};

export const updateOrganizerProfileController = async (req, res) => {
  const profile = await updateOrganizerProfileService(req.user.sub, req.body);

  return buildSuccessResponse(
    res,
    "Organizer profile updated successfully",
    { profile },
    200,
  );
};
