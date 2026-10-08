const DEFAULT_LOCALE = "en-US";

export function formatInTimeZone(
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone, ...options }).format(date);
}

export function formatBookingDate(value: string | Date, timeZone: string) {
  return formatInTimeZone(value, timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatBookingTime(value: string | Date, timeZone: string) {
  return formatInTimeZone(value, timeZone, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeZoneLabel(value: string | Date, timeZone: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const part = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone,
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

export function formatBookingRange(
  start: string | Date,
  end: string | Date,
  timeZone: string
) {
  return `${formatBookingTime(start, timeZone)} – ${formatBookingTime(end, timeZone)} ${formatTimeZoneLabel(start, timeZone)}`;
}

export function formatBookingDateTime(value: string | Date, timeZone: string) {
  return `${formatBookingDate(value, timeZone)} at ${formatBookingTime(value, timeZone)} ${formatTimeZoneLabel(value, timeZone)}`;
}

export function formatPrice(cents: number, currency = "USD") {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
