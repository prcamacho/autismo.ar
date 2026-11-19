import type { Service, CatalogRequest } from "./model";
import type { ResourceRecord } from "@/features/resources/model";
type Table<Row> = { Row: Row; Insert: never; Update: never; Relationships: [] };
export type CatalogTables = {
  service_catalog: Table<Service>;
  catalog_requests: Table<CatalogRequest>;
};
export type CatalogFunctions = {
  catalog_request: {
    Args: {
      p_name: string;
      p_reason: string;
      p_source: string;
      p_nonce: string;
      p_draft: Record<string, unknown> | null;
    };
    Returns: string;
  };
  catalog_review: {
    Args: {
      p_request: string;
      p_decision: string;
      p_service: string;
      p_name: string;
      p_group: string;
      p_source: string;
      p_note: string;
    };
    Returns: undefined;
  };
  catalog_search_resources: {
    Args: {
      p_service: string;
      p_category: string;
      p_province: string;
      p_place: string;
      p_age: string;
      p_page: number;
    };
    Returns: ResourceRecord[];
  };
};
