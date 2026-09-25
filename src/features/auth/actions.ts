"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/features/community/model";

export async function requestCode(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const email = z.email().max(254).safeParse(form.get("email"));
  if (!email.success || form.get("website"))
    return { message: "Revisá el correo ingresado." };
  const client = await createSupabaseClient();
  if (!client) return { message: "Las cuentas todavía no están habilitadas." };
  const { error } = await client.auth.signInWithOtp({ email: email.data });
  if (error)
    return {
      message:
        "No pudimos solicitar el código. Esperá unos minutos y volvé a intentar.",
    };
  return {
    ok: true,
    message:
      "Revisá tu correo e ingresá el código. También puede estar en spam.",
  };
}

export async function verifyCode(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const email = z.email().safeParse(form.get("email"));
  const token = z
    .string()
    .regex(/^\d{6,10}$/)
    .safeParse(form.get("token"));
  if (!email.success || !token.success)
    return { message: "Revisá el correo y el código." };
  const client = await createSupabaseClient();
  if (!client) return { message: "Las cuentas todavía no están habilitadas." };
  const { error } = await client.auth.verifyOtp({
    email: email.data,
    token: token.data,
    type: "email",
  });
  if (error)
    return {
      message: "El código no es válido o venció. Podés solicitar otro.",
    };
  redirect("/cuenta");
}

export async function signOut() {
  const client = await createSupabaseClient();
  if (client) await client.auth.signOut();
  redirect("/");
}
