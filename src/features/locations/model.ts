/** Safe to import as types from client components; contains no catalog data. */
export type Place = Readonly<{
  id: string;
  province: string;
  departmentId: string;
  department: string;
  name: string;
  kind: "locality" | "neighborhood";
}>;

export type Department = Readonly<{
  id: string;
  province: string;
  name: string;
}>;

export type PlaceSearch = {
  province: string;
  departmentId?: string;
  query?: string;
  limit?: number;
};
