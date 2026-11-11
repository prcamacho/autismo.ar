import { type Proposal, type Corroboration } from "@/features/community/model";
import type {
  ResourceRecord,
  ResourceRevision,
  FieldConfirmation,
} from "@/features/resources/model";
import type { ResourceInput } from "@/features/resources/validation";

export type Report = {
  id: string;
  resource_id: string;
  author_id: string;
  reason: string;
  status: "open" | "resolved";
  created_at: string;
  decision_note: string | null;
  moderated_by: string | null;
};

// Contract of the checked-in migrations. Writes are only available through RPCs.
type Table<Row> = {
  Row: Row;
  Insert: never;
  Update: never;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      community_members: Table<{
        user_id: string;
        role: "member" | "moderator";
      }>;
      resources: Table<ResourceRecord & { visible: boolean }>;
      resource_revisions: Table<ResourceRevision>;
      resource_confirmations: Table<FieldConfirmation>;
      community_proposals: Table<
        Proposal & {
          moderated_by: string | null;
          decided_at: string | null;
        }
      >;
      community_checks: Table<Corroboration>;
      community_check_events: Table<{
        reviewer_id: string;
        created_at: string;
      }>;
      community_reports: Table<Report>;
    };
    Views: Record<string, never>;
    Functions: {
      community_submit: {
        Args: {
          p_data: ResourceInput;
          p_source: string;
          p_note: string;
          p_resource: string | null;
          p_version: number;
        };
        Returns: string;
      };
      community_check: {
        Args: {
          p_proposal: string;
          p_field: Corroboration["field"];
          p_verdict: Corroboration["verdict"];
          p_source: string;
        };
        Returns: undefined;
      };
      community_moderate: {
        Args: {
          p_proposal: string;
          p_decision: "reviewing" | "approved" | "rejected";
          p_note: string;
        };
        Returns: string | null;
      };
      community_report: {
        Args: { p_resource: string; p_reason: string };
        Returns: undefined;
      };
      community_resolve_report: {
        Args: { p_report: string; p_note: string; p_hide: boolean };
        Returns: undefined;
      };
      community_search: {
        Args: {
          p_query: string;
          p_category: string;
          p_province: string;
          p_locality: string;
          p_age: string;
          p_page: number;
        };
        Returns: (ResourceRecord & { visible: boolean })[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
