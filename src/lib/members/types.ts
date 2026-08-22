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

export type CampusStoreFile = {
  members: StoredMember[];
  accessRequests: AccessRequest[];
};
