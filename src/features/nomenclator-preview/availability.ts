export function isNomenclatorPreviewEnabled(
  env: { NODE_ENV?: string; RAILWAY_ENVIRONMENT_NAME?: string } = process.env,
) {
  // Un entorno alojado siempre debe ser test, incluso si NODE_ENV está mal definido.
  if (env.RAILWAY_ENVIRONMENT_NAME)
    return env.RAILWAY_ENVIRONMENT_NAME === "test";
  return env.NODE_ENV === "development";
}
