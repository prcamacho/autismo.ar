import { checkFields, type CheckField } from "./model";
import type { ResourceInput } from "@/features/resources/validation";
import { getProvinceName } from "@/lib/geography";
import { categories } from "@/lib/catalog";

export function fieldValue(data: ResourceInput, field: CheckField): string {
  switch (field) {
    case "name":
      return data.name;
    case "location":
      return data.scope === "national"
        ? "Todo el país"
        : [data.locality, getProvinceName(data.province)]
            .filter(Boolean)
            .join(", ");
    case "contact":
      return (
        [data.website, data.phone, data.hours].filter(Boolean).join(" · ") ||
        "No informado"
      );
    case "coverage":
      return data.coverage || "No informada";
    case "ages":
      return data.ageGroups.join(", ") || "No informadas";
    case "description":
      return `${data.description}\n${categories
        .filter((c) => data.categoryIds.includes(c.id))
        .map((c) => c.name)
        .join(", ")}`;
  }
}

/** Same field groups as community_field_value in the migration. */
export function fieldSnapshot(data: ResourceInput, field: CheckField): unknown {
  switch (field) {
    case "name":
      return data.name;
    case "location":
      return [data.scope, data.province, data.locality];
    case "contact":
      return [data.website, data.phone, data.hours];
    case "coverage":
      return data.coverage;
    case "ages":
      return data.ageGroups;
    case "description":
      return [data.description, data.categoryIds];
  }
}
export function requiredFields(
  data: ResourceInput,
  before?: ResourceInput,
): CheckField[] {
  const fields = (Object.keys(checkFields) as CheckField[]).filter((field) => {
    if (before)
      return (
        JSON.stringify(fieldSnapshot(data, field)) !==
        JSON.stringify(fieldSnapshot(before, field))
      );
    if (field === "contact")
      return Boolean(data.website || data.phone || data.hours);
    if (field === "coverage") return Boolean(data.coverage);
    if (field === "ages") return data.ageGroups.length > 0;
    return true;
  });
  return fields.length ? fields : ["description"];
}
