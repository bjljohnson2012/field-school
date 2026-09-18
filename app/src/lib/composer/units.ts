/** Split teacher-supplied text into knowledge units. Never fetch a URL. */
export function unitsFromSuppliedText(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((body, index) => {
      const first = body.split(/\n/)[0]?.trim() ?? `Unit ${index + 1}`;
      const title = first.length > 80 ? `${first.slice(0, 77)}…` : first;
      return { title, body, sortOrder: index };
    });
}
