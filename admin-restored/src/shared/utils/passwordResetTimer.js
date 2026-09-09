export const getOtpCountdown = (expiresAt) => {
  const expiresAtNumber = Number(expiresAt);
  const remainingMs = Number.isFinite(expiresAtNumber) ? expiresAtNumber - Date.now() : 0;

  if (!Number.isFinite(remainingMs) || remainingMs <= 0) {
    return {
      isExpired: true,
      text: 'OTP expired',
      remainingMs: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    isExpired: false,
    text: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    remainingMs,
    minutes,
    seconds,
  };
};
