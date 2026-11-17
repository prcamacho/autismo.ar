import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const endpoint = "https://autismo.ar/api/exchanges/maintenance";
const cleanSummary = {
  warned: 0,
  deleted: 0,
  expired: 0,
  notifications_failed: 0,
  notificationsAccepted: 0,
  notificationsSkipped: 0,
  notificationFailures: 0,
  notificationAckFailures: 0,
  accountsDeleted: 0,
  accountFailures: 0,
  photosCleaned: 0,
  photoFailures: 0,
};

test("maintenance operations distinguish queued work from HTTP results and retain only bounded diagnostics", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema vault;
      create table vault.decrypted_secrets(name text primary key,decrypted_secret text);
      create schema net;
      create table net.sent_requests(id bigserial primary key,url text,headers jsonb,body jsonb,timeout integer);
      create table net._http_response(id bigint,status_code integer,timed_out boolean,error_msg text,content text);
      create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint
      language sql as $$
        insert into net.sent_requests(url,headers,body,timeout) values(url,headers,body,timeout_milliseconds) returning id
      $$;
    `);
    await db.exec(
      await readFile("supabase/ops/exchange-maintenance.sql", "utf8"),
    );
    const dispatch = async () =>
      (
        await db.query<{ request: number | null }>(
          "select exchange_ops.dispatch_maintenance($1) as request",
          [endpoint],
        )
      ).rows[0].request;
    const collect = async () => {
      await db.exec("select exchange_ops.collect_maintenance_results()");
    };
    const last = async () =>
      (
        await db.query<{
          status: string;
          failure_code: string | null;
          summary: unknown;
          http_status: number | null;
        }>(
          "select status,failure_code,summary,http_status from exchange_ops.maintenance_runs order by id desc limit 1",
        )
      ).rows[0];

    assert.equal(await dispatch(), null);
    assert.equal((await last()).failure_code, "configuration_missing");
    await db.query("insert into vault.decrypted_secrets values($1,$2)", [
      "autismo_exchange_worker_token",
      "synthetic-token-for-offline-maintenance-tests",
    ]);
    await assert.rejects(
      db.query("select exchange_ops.dispatch_maintenance($1)", [
        "https://example.invalid/collect",
      ]),
      /INVALID_MAINTENANCE_DESTINATION/,
    );

    const first = await dispatch();
    assert.ok(first);
    assert.equal((await last()).status, "pending");
    assert.equal(
      await dispatch(),
      null,
      "pending work is not dispatched twice",
    );
    const request = (
      await db.query<{ url: string; timeout: number }>(
        "select url,timeout from net.sent_requests",
      )
    ).rows[0];
    assert.equal(request.url, endpoint);
    assert.equal(request.timeout, 60000);
    await db.query(
      "insert into net._http_response values($1,200,false,null,$2)",
      [
        first,
        JSON.stringify({ ...cleanSummary, privateText: "never keep this" }),
      ],
    );
    await collect();
    assert.deepEqual(await last(), {
      status: "succeeded",
      failure_code: null,
      summary: cleanSummary,
      http_status: 200,
    });

    for (const scenario of [
      { status: 503, body: JSON.stringify(cleanSummary), code: "http_error" },
      { status: 200, body: "<html>challenge</html>", code: "invalid_response" },
      { status: 200, body: "{}", code: "invalid_response" },
      {
        status: 200,
        body: JSON.stringify({ ...cleanSummary, accountFailures: 1 }),
        code: "incomplete_response",
      },
    ]) {
      const id = await dispatch();
      await db.query(
        "insert into net._http_response values($1,$2,false,null,$3)",
        [id, scenario.status, scenario.body],
      );
      await collect();
      assert.equal((await last()).status, "failed");
      assert.equal((await last()).failure_code, scenario.code);
    }

    const timeout = await dispatch();
    await db.query(
      "insert into net._http_response values($1,null,true,'sensitive provider detail',null)",
      [timeout],
    );
    await collect();
    assert.equal((await last()).failure_code, "timeout");
    assert.equal((await last()).summary, null);

    const missing = await dispatch();
    await db.query(
      "update exchange_ops.maintenance_runs set requested_at=now()-interval '6 minutes' where request_id=$1",
      [missing],
    );
    await collect();
    assert.equal((await last()).failure_code, "missing_response");
    assert.equal((await last()).http_status, null);
    await db.query(
      `insert into exchange_ops.maintenance_runs(destination,requested_at,completed_at,status)
      values($1,now()-interval '31 days',now()-interval '31 days','succeeded')`,
      [endpoint],
    );
    await collect();
    assert.equal(
      (
        await db.query<{ count: number }>(
          "select count(*)::integer as count from exchange_ops.maintenance_runs where requested_at<now()-interval '30 days'",
        )
      ).rows[0].count,
      0,
    );

    await db.exec(`create or replace function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds integer) returns bigint
      language plpgsql as $$begin raise exception 'sensitive provider detail'; end;$$`);
    assert.equal(await dispatch(), null);
    assert.equal((await last()).failure_code, "dispatch_error");
    const history = JSON.stringify(
      (await db.query("select * from exchange_ops.maintenance_runs")).rows,
    );
    assert.equal(history.includes("sensitive provider detail"), false);
    assert.equal(history.includes("never keep this"), false);
    assert.equal(history.includes("synthetic-token"), false);

    for (const role of ["anon", "authenticated", "service_role"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(
        db.exec("select * from exchange_ops.maintenance_runs"),
        /permission denied/,
      );
      await assert.rejects(
        db.query("select exchange_ops.dispatch_maintenance($1)", [endpoint]),
        /permission denied/,
      );
      await db.exec("reset role");
    }
  } finally {
    await db.close();
  }
});
