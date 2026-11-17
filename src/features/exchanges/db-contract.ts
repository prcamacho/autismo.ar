/** Contract of 202611170002_exchanges.sql. Public DTOs exclude account identifiers. */
import type { ProfileData, ListingData, ListingKind } from "./model";
export type { ProfileData, ListingData, ListingKind } from "./model";
export type PublicProfileData = Omit<ProfileData, "photoPath"> & {
  hasPhoto: boolean;
};
export type ProfileStatus = "pending" | "approved" | "rejected";
export type ListingStatus =
  "pending" | "published" | "rejected" | "paused" | "closed";
export type ProfileRow = {
  id: string;
  user_id: string;
  data: ProfileData;
  status: ProfileStatus;
  is_public: boolean;
  version: number;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};
export type ListingRow = {
  id: string;
  user_id: string;
  profile_id: string | null;
  kind: ListingKind;
  data: ListingData;
  status: ListingStatus;
  expires_at: string | null;
  version: number;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  creation_nonce: string;
};
export type ProfileView = {
  id: string;
  data: PublicProfileData;
  status: ProfileStatus;
  is_public: boolean;
  version: number;
  owner: boolean;
  review_note: string | null;
  updated_at: string;
};
export type ListingView = {
  id: string;
  kind: ListingKind;
  data: ListingData;
  status: ListingStatus;
  expires_at: string | null;
  version: number;
  profile: { id: string; data: PublicProfileData } | null;
  owner: boolean;
  review_note: string | null;
  created_at: string;
};
export type ConversationRow = {
  id: string;
  listing_id: string | null;
  sender_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected";
  nonce: string;
  created_at: string;
  updated_at: string;
  deletion_warning_at: string | null;
};
export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  nonce: string;
  created_at: string;
};
export type ExchangeReport = {
  id: string;
  reporter_id: string | null;
  target_kind: "profile" | "listing" | "conversation";
  target_id: string;
  reason: string;
  status: "open" | "resolved";
  evidence: unknown;
  review_note: string | null;
  created_at: string;
  resolved_at: string | null;
};
type Table<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };
type Fn<Args, Returns = undefined> = { Args: Args; Returns: Returns };
export type ExchangeTables = {
  exchange_accounts: Table<{
    user_id: string;
    adult_confirmed_at: string;
    notifications: boolean;
  }>;
  exchange_profiles: Table<ProfileRow>;
  exchange_listings: Table<ListingRow>;
  exchange_listing_places: Table<{ listing_id: string; place_id: string }>;
  exchange_conversations: Table<ConversationRow>;
  exchange_messages: Table<MessageRow>;
  exchange_blocks: Table<{
    blocker_id: string;
    blocked_id: string;
    created_at: string;
  }>;
  exchange_reports: Table<ExchangeReport>;
  exchange_deletion_requests: Table<{
    user_id: string;
    requested_at: string;
    completed_at: string | null;
  }>;
};
export type ExchangeFunctions = {
  exchange_enroll: Fn<{ p_adult: boolean; p_notifications: boolean }>;
  exchange_save_profile: Fn<
    { p_data: ProfileData; p_public: boolean; p_version: number },
    string
  >;
  exchange_reserve_photo: Fn<Record<string, never>>;
  exchange_save_listing: Fn<
    {
      p_id: string | null;
      p_kind: ListingKind;
      p_data: ListingData;
      p_version: number;
      p_nonce: string;
    },
    string
  >;
  exchange_listing_state: Fn<{
    p_id: string;
    p_state: "renew" | "paused" | "closed" | "delete";
  }>;
  exchange_moderate: Fn<{
    p_kind: "profile" | "listing";
    p_id: string;
    p_decision: "approved" | "rejected";
    p_note: string;
    p_version: number;
  }>;
  exchange_search: Fn<
    {
      p_kind: string;
      p_service: string;
      p_province: string;
      p_place: string;
      p_page: number;
      p_modality?: string;
      p_availability?: string;
    },
    ListingView[]
  >;
  exchange_listing: Fn<{ p_id: string }, ListingView[]>;
  exchange_profile: Fn<{ p_id: string }, ProfileView[]>;
  exchange_photo_access: Fn<
    { p_profile: string; p_viewer: string | null },
    { path: string }[]
  >;
  exchange_request: Fn<
    { p_listing: string; p_body: string; p_nonce: string },
    string
  >;
  exchange_respond: Fn<{ p_id: string; p_decision: "accepted" | "rejected" }>;
  exchange_send: Fn<
    { p_conversation: string; p_body: string; p_nonce: string },
    string
  >;
  exchange_block: Fn<{ p_conversation: string }>;
  exchange_report: Fn<
    {
      p_kind: "profile" | "listing" | "conversation";
      p_id: string;
      p_reason: string;
    },
    string
  >;
  exchange_resolve_report: Fn<{
    p_id: string;
    p_note: string;
    p_hide: boolean;
  }>;
  exchange_delete_account: Fn<Record<string, never>>;
  exchange_maintenance: Fn<
    Record<string, never>,
    {
      warned: number;
      deleted: number;
      expired: number;
      notifications_failed: number;
    }[]
  >;
  exchange_claim_notifications: Fn<
    { p_limit: number; p_daily_budget: number },
    {
      id: string;
      user_id: string;
      kind: "activity" | "retention";
      token: string;
      attempts: number;
    }[]
  >;
  exchange_finish_notification: Fn<{
    p_id: string;
    p_token: string;
    p_success: boolean;
  }>;
};
