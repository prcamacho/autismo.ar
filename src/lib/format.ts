const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function currentDateInArgentina(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
