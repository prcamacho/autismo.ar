const LABELS: Record<string, string> = {
  miercoles: "Miércoles",
  sabado: "Sábado",
  manana: "Mañana",
};
export function choiceLabel(value: string) {
  return LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

const instantFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});
export function formatInstant(value: string) {
  return instantFormatter.format(new Date(value));
}
