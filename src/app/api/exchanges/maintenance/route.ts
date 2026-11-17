import { isWorkerAuthorized } from "@/features/exchanges/notification";
import { runExchangeMaintenance } from "@/features/exchanges/maintenance";
import { recordExchangeFailure } from "@/features/exchanges/server";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  if (
    !isWorkerAuthorized(
      request.headers.get("authorization"),
      process.env.EXCHANGES_WORKER_TOKEN,
    )
  )
    return Response.json({ error: "No autorizado." }, { status: 401, headers });
  try {
    const summary = await runExchangeMaintenance();
    const incomplete =
      summary.accountFailures > 0 ||
      summary.photoFailures > 0 ||
      summary.notificationFailures > 0 ||
      summary.notificationAckFailures > 0 ||
      summary.notifications_failed > 0;
    return Response.json(summary, { status: incomplete ? 503 : 200, headers });
  } catch {
    recordExchangeFailure("maintenance");
    return Response.json(
      {
        error:
          "El mantenimiento no se completó. Revisá configuración y métricas antes de reintentar.",
      },
      { status: 503, headers },
    );
  }
}
