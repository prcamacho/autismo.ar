export type PhotoFunctions = {
  exchange_photo_track: {
    Args: { p_path: string; p_user: string };
    Returns: undefined;
  };
  exchange_photo_forget: { Args: { p_path: string }; Returns: undefined };
  exchange_photo_garbage: {
    Args: Record<string, never>;
    Returns: { path: string }[];
  };
};
