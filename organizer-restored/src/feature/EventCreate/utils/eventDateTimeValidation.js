const parseTimeToSeconds = (value) => {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const meridiemMatch = trimmed.match(
    /^([0-9]{1,2}):([0-5][0-9])(?::([0-5][0-9]))?\s*([AaPp][Mm])$/,
  );

  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const seconds = Number(meridiemMatch[3] ?? 0);
    const meridiem = meridiemMatch[4].toUpperCase();

    if (hours < 1 || hours > 12) return null;
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;

    return hours * 3600 + minutes * 60 + seconds;
  }

  const twentyFourHourMatch = trimmed.match(
    /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/,
  );
  if (!twentyFourHourMatch) return null;

  return (
    Number(twentyFourHourMatch[1]) * 3600 +
    Number(twentyFourHourMatch[2]) * 60 +
    Number(twentyFourHourMatch[3] ?? 0)
  );
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Event dates/times are entered in IST, so compare in IST regardless of browser timezone.
export const isStartNotInPastIst = ({ startDate, startTime, now = Date.now() }) => {
  const dateMatch = typeof startDate === "string" ? startDate.match(/^(\d{4})-(\d{2})-(\d{2})$/) : null;
  if (!dateMatch) return true;

  const dayStart =
    Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])) - IST_OFFSET_MS;
  const startSeconds = parseTimeToSeconds(startTime);

  if (startSeconds === null) return dayStart + DAY_MS > now;
  return dayStart + startSeconds * 1000 >= now;
};

export const isEndTimeOnOrAfterStartTime = ({
  startDate,
  endDate,
  startTime,
  endTime,
}) => {
  if (!startDate || !endDate || startDate !== endDate) return true;

  const startSeconds = parseTimeToSeconds(startTime);
  const endSeconds = parseTimeToSeconds(endTime);
  if (startSeconds === null || endSeconds === null) return true;

  return endSeconds >= startSeconds;
};
