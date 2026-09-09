import { CalendarDays, MapPin, Users } from "lucide-react";

const CompetitionMeta = ({
  date,
  location,
  participants,
}) => {
  return (
    <div className="flex flex-col gap-2 text-xs text-slate-500">
      {date && (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-green-600" />
          <span>{date}</span>
        </div>
      )}

      {location && (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="truncate">{location}</span>
        </div>
      )}

      {participants !== undefined && (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-green-600" />
          <span>{participants} participants</span>
        </div>
      )}
    </div>
  );
};

export default CompetitionMeta;