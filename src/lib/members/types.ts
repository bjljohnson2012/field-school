export type MemberProvider = "google" | "twitter" | "credentials";

export type StoredMember = {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  provider: MemberProvider;
  createdAt: string;
};

export type AccessRequestStatus = "pending" | "noted";

export type AccessRequest = {
  id: string;
  name: string;
  email: string;
  provider: string;
  note: string;
  createdAt: string;
  status: AccessRequestStatus;
};

export const FORM_KINDS = [
  "saturday_note",
  "topic_request",
  "shop_waitlist",
] as const;

export type FormKind = (typeof FORM_KINDS)[number];

export type FormSubmission = {
  id: string;
  kind: FormKind;
  name: string;
  email: string;
  message: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type CampusStoreFile = {
  members: StoredMember[];
  accessRequests: AccessRequest[];
  formSubmissions: FormSubmission[];
};
