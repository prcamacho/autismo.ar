export type ActionResult = {
  ok?: boolean;
  message?: string;
  id?: string;
  href?: string;
};

export type ConnectionStatus = "ready" | "unconfigured" | "unavailable";
export type QueryResult<T> = { data: T; status: ConnectionStatus };
