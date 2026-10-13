export type LoginSide = { id: string; email: string; name: string };

export function loginIdentity(input: {
  jsonMember: LoginSide | null;
  postgresMember: LoginSide | null;
}): "json" | "postgres" | "none" {
  if (input.jsonMember) return "json";
  if (input.postgresMember) return "postgres";
  return "none";
}

export function mergeFormSubmissions<T extends { id: string }>(
  postgres: readonly T[],
  json: readonly T[],
): T[] {
  const seen = new Set(postgres.map((row) => row.id));
  return [...postgres, ...json.filter((row) => !seen.has(row.id))];
}

export function jwtRevoked(jti: string, revoked: readonly string[]): boolean {
  const id = jti.trim();
  return id.length > 0 && revoked.includes(id);
}

export function recapNoteInsert(input: {
  brainId: string;
  body: string;
} | null): { title: "Coaching recap"; body: string } | null {
  if (!input) return null;
  const brainId = input.brainId.trim();
  const body = input.body.trim();
  if (!brainId || !body) return null;
  return { title: "Coaching recap", body };
}
