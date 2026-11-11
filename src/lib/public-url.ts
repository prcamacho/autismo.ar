/** Accepted public link syntax; mirrored by community_valid_url in SQL. */
export function isPublicHttpUrl(value: string) {
  if (Array.from(value).length > 1000) return false;
  const match =
    /^https?:\/\/([a-zA-Z0-9][a-zA-Z0-9.-]*)(?::([0-9]{1,5}))?([/?#][^\s\\]*)?$/.exec(
      value,
    );
  if (!match || /[\u0000-\u0020\u007f-\u009f]/.test(value)) return false;
  const host = match[1].replace(/\.$/, "");
  if (host.length > 253) return false;
  const labels = host.split(".");
  if (
    labels.some(
      (label) => !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label),
    )
  )
    return false;
  // Numeric hosts must be canonical IPv4, not browser-specific abbreviated forms.
  if (
    /^[0-9.]+$/.test(host) &&
    (labels.length !== 4 ||
      labels.some(
        (label) => !/^(0|[1-9][0-9]{0,2})$/.test(label) || Number(label) > 255,
      ))
  )
    return false;
  return !match[2] || Number(match[2]) <= 65535;
}
