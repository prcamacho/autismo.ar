import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  exchangeStatus,
  notificationBudget,
} from "../src/features/exchanges/settings";
import {
  isWorkerAuthorized,
  notificationContent,
  notificationSettings,
  deliverNotification,
} from "../src/features/exchanges/notification";
import { normalizeProfilePhoto } from "../src/features/exchanges/photo-processing";
import { EXCHANGE_LIMITS } from "../src/features/exchanges/model";

test("exchange activation is bound to one exact backend and permits HTTP only on loopback", () => {
  const configured = {
    EXCHANGES_ENABLED: "true",
    EXCHANGES_EXPECTED_SUPABASE_HOST: "isolated-test.supabase.co",
    NEXT_PUBLIC_SUPABASE_URL: "https://isolated-test.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-public-key",
  };
  assert.equal(
    exchangeStatus({ ...configured, EXCHANGES_ENABLED: "false" }),
    "unconfigured",
  );
  assert.equal(exchangeStatus(configured), "ready");
  for (const env of [
    { EXCHANGES_EXPECTED_SUPABASE_HOST: "" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://production.supabase.co" },
    {
      NEXT_PUBLIC_SUPABASE_URL:
        "https://isolated-test.supabase.co.evil.example",
    },
    { NEXT_PUBLIC_SUPABASE_URL: "http://isolated-test.supabase.co" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://isolated-test.supabase.co/other-api" },
    {
      NEXT_PUBLIC_SUPABASE_URL:
        "https://user:password@isolated-test.supabase.co",
    },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" },
  ])
    assert.equal(exchangeStatus({ ...configured, ...env }), "unavailable");
  assert.equal(
    exchangeStatus({
      ...configured,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      EXCHANGES_EXPECTED_SUPABASE_HOST: "127.0.0.1:54321",
    }),
    "ready",
  );
  assert.equal(
    notificationBudget(undefined),
    0,
    "notifications require an explicit budget",
  );
  for (const budget of ["-1", "0.5", "NaN", "Infinity", "10001"])
    assert.throws(() => notificationBudget(budget));
});

test("notification availability requires both explicit budget and valid delivery settings", () => {
  const configured = {
    EXCHANGES_EMAIL_DAILY_BUDGET: "10",
    EXCHANGES_RESEND_API_KEY: "synthetic-provider-key",
    EXCHANGES_EMAIL_FROM: "autismo.ar <prueba@example.org>",
    EXCHANGES_SITE_URL: "https://test.autismo.ar",
  };
  assert.equal(notificationSettings({}), null);
  assert.equal(
    notificationSettings({ ...configured, EXCHANGES_EMAIL_DAILY_BUDGET: "0" }),
    null,
  );
  assert.equal(notificationSettings(configured)?.budget, 10);
  for (const setting of [
    { EXCHANGES_EMAIL_DAILY_BUDGET: "NaN" },
    { EXCHANGES_RESEND_API_KEY: "" },
    { EXCHANGES_EMAIL_FROM: "invalid\r\nsender" },
    { EXCHANGES_SITE_URL: "" },
    { EXCHANGES_SITE_URL: "http://test.autismo.ar" },
    { EXCHANGES_SITE_URL: "https://test.autismo.ar/messages" },
  ])
    assert.throws(() => notificationSettings({ ...configured, ...setting }));
});

test("maintenance authorization rejects absent, weak and altered credentials without throwing", () => {
  const token = "synthetic-worker-token-with-sufficient-length";
  assert.equal(isWorkerAuthorized(`Bearer ${token}`, token), true);
  assert.equal(isWorkerAuthorized(null, token), false);
  assert.equal(isWorkerAuthorized(`Bearer ${token}`, undefined), false);
  assert.equal(isWorkerAuthorized("Bearer short", "short"), false);
  assert.equal(isWorkerAuthorized(`Basic ${token}`, token), false);
  assert.equal(isWorkerAuthorized(`Bearer ${token.slice(1)}`, token), false);
  assert.equal(
    isWorkerAuthorized(`Bearer ${token.slice(0, -1)}x`, token),
    false,
  );
  assert.equal(
    isWorkerAuthorized(`Bearer ${"é".repeat(token.length)}`, token),
    false,
  );
});

test("transactional mail uses generic content and refuses unsafe or incomplete delivery results", async () => {
  const input = {
    key: "synthetic-provider-key",
    from: "autismo.ar <prueba@example.org>",
    email: "destino@example.org",
    token: "synthetic-stable-delivery-key",
    kind: "activity" as const,
    origin: "https://test.autismo.ar",
  };
  const sent: { url: string; init?: RequestInit }[] = [];
  const success: typeof fetch = async (url, init) => {
    sent.push({ url: String(url), init });
    return new Response(JSON.stringify({ id: "synthetic-provider-receipt" }), {
      status: 200,
    });
  };
  assert.equal(await deliverNotification(input, success), true);
  assert.equal(await deliverNotification(input, success), true);
  const first = sent[0];
  assert.equal(first.url, "https://api.resend.com/emails");
  assert.equal(first.init?.method, "POST");
  assert.deepEqual(
    sent[0].init?.headers,
    sent[1].init?.headers,
    "retry preserves the provider idempotency key",
  );
  const headers = new Headers(first.init?.headers);
  assert.equal(headers.get("Idempotency-Key"), `exchange/${input.token}`);
  assert.ok(first.init?.signal, "delivery has a bounded timeout");
  const body = JSON.parse(String(first.init?.body));
  assert.deepEqual(body.to, [input.email]);
  assert.ok(body.text.includes("https://test.autismo.ar/mensajes"));
  assert.equal(body.html.includes(input.email), false);
  assert.equal(body.html.includes(input.key), false);
  assert.equal(body.html.includes(input.token), false);
  for (const response of [
    new Response(JSON.stringify({ message: "rate limit" }), { status: 429 }),
    new Response(JSON.stringify({ error: "unavailable" }), { status: 503 }),
    new Response("", { status: 200 }),
    new Response("<html>gateway page</html>", { status: 200 }),
    new Response(JSON.stringify({ id: "" }), { status: 200 }),
    new Response(JSON.stringify({ id: "synthetic", error: "incomplete" }), {
      status: 200,
    }),
  ])
    assert.equal(await deliverNotification(input, async () => response), false);
  await assert.rejects(
    deliverNotification(input, async () => {
      throw new Error("synthetic network loss");
    }),
  );
  for (const origin of [
    "http://test.autismo.ar",
    "https://user:pass@test.autismo.ar",
    "https://test.autismo.ar/path",
    "https://test.autismo.ar/?redirect=elsewhere",
    "https://test.autismo.ar/#fragment",
  ]) {
    await assert.rejects(
      deliverNotification({ ...input, origin }, async () => {
        assert.fail("invalid origin must never reach transport");
      }),
    );
  }
  assert.equal(
    notificationContent("retention", input.origin).text.includes("eliminarán"),
    true,
  );
});

test("photo normalization removes metadata and keeps a bounded static WebP", async () => {
  const input = await sharp({
    create: { width: 640, height: 480, channels: 3, background: "#5488aa" },
  })
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD0: {
        Artist: "Synthetic private author",
        Copyright: "Synthetic private metadata",
      },
    })
    .jpeg()
    .toBuffer();
  assert.ok((await sharp(input).metadata()).exif);
  const result = await normalizeProfilePhoto(input);
  const meta = await sharp(result).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 384);
  assert.equal(meta.height, 384);
  assert.equal(meta.exif, undefined);
  assert.equal(meta.icc, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(meta.orientation, undefined);
  assert.ok(result.byteLength <= EXCHANGE_LIMITS.photoOutputBytes);
});

test("photo validation rejects active formats, animation, corrupt images and excessive resource use", async () => {
  await assert.rejects(normalizeProfilePhoto(new Uint8Array()), /PHOTO_SIZE/);
  await assert.rejects(
    normalizeProfilePhoto(new Uint8Array(EXCHANGE_LIMITS.photoInputBytes + 1)),
    /PHOTO_SIZE/,
  );
  await assert.rejects(
    normalizeProfilePhoto(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><script>synthetic()</script></svg>',
      ),
    ),
    /PHOTO_FORMAT/,
  );
  await assert.rejects(
    normalizeProfilePhoto(Buffer.from([0xff, 0xd8, 0xff, 0, 0])),
  );
  const pixels = Buffer.alloc(10 * 20 * 3);
  pixels.fill(255, 0, 10 * 10 * 3);
  const animated = await sharp(pixels, {
    raw: { width: 10, height: 20, channels: 3, pageHeight: 10 },
  })
    .webp({ loop: 0, delay: [100, 100] })
    .toBuffer();
  assert.equal(
    (await sharp(animated).metadata()).pages,
    2,
    "fixture must actually contain animation",
  );
  await assert.rejects(normalizeProfilePhoto(animated), /PHOTO_FORMAT/);
  const large = await sharp({
    create: { width: 4001, height: 4000, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  assert.ok(
    large.byteLength < EXCHANGE_LIMITS.photoInputBytes,
    "compressed size alone cannot establish decoding safety",
  );
  await assert.rejects(normalizeProfilePhoto(large), /pixel limit/i);
});
