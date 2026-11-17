import type { getExchangeContext } from "../repository";
import { ExchangeNotice, SignInNotice } from "./shared";
import { EnrollmentForm } from "./profile-form";
import styles from "../exchanges.module.css";

export function ParticipationNotice({
  context,
}: {
  context: Awaited<ReturnType<typeof getExchangeContext>>;
}) {
  if (context.status !== "ready")
    return <ExchangeNotice status={context.status} />;
  if (!context.viewer) return <SignInNotice />;
  if (!context.account)
    return (
      <div className={styles.card}>
        <EnrollmentForm />
      </div>
    );
  return null;
}
