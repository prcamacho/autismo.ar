import type { ResourceInput } from "./validation";
import type { CheckField } from "@/features/community/model";

export type ResourceRecord = {
  id: string;
  slug: string;
  version: number;
  data: ResourceInput;
  source_url: string;
  published_at: string;
};
export type ResourceRevision = {
  resource_id: string;
  version: number;
  data: ResourceInput;
  source_url: string;
  published_at: string;
};
export type FieldConfirmation = {
  resource_id: string;
  field: CheckField;
  source_url: string;
  confirmed_at: string;
  version: number;
};
