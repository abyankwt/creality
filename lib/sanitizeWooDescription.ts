export function sanitizeWooDescription(html: string | null | undefined) {
  if (!html) return "";

  return html
    .replace(/style="[^"]*"/g, "")
    .replace(/width="[^"]*"/g, "")
    .replace(/height="[^"]*"/g, "")
    .replace(/class="[^"]*"/g, "");
}
