import EventModel from "../../model/event.model.js";
import UserModel from "../../model/user.model.js";

export const getAboutPageStatsService = async () => {
  const [totalUsers, totalOrganizers, totalCompetitions] = await Promise.all([
    UserModel.countDocuments({}),
    UserModel.countDocuments({
      $or: [{ role: "ORGANIZER" }, { roles: "ORGANIZER" }],
    }),
    EventModel.countDocuments({}),
  ]);

  return {
    totalUsers,
    totalOrganizers,
    totalCompetitions,
  };
};
