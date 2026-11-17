import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";

test("account lifecycle locks participation before writes and keeps deletion final", async (t) => {
  const db = new PGlite();
  const departing = randomUUID();
  const other = randomUUID();
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    for (const id of [departing, other])
      await db.query("insert into auth.users values($1)", [id]);
    await applyMigrations(db);

    async function as(user: string | null, role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
        user ?? "",
      ]);
      await db.exec(`set role ${role}`);
    }
    async function count(sql: string, values: unknown[] = []) {
      return (await db.query<{ count: number }>(sql, values)).rows[0].count;
    }

    await t.test(
      "replacement preserves RPC privileges and the private helper",
      async () => {
        const privileges = await db.query<{
          role: string;
          member: boolean;
          enroll: boolean;
          remove: boolean;
        }>(`select role,
        has_function_privilege(role,'public.exchange_member()','execute') member,
        has_function_privilege(role,'public.exchange_enroll(boolean,boolean)','execute') enroll,
        has_function_privilege(role,'public.exchange_delete_account()','execute') remove
        from (values ('anon'),('authenticated'),('service_role')) roles(role)`);
        assert.deepEqual(privileges.rows, [
          { role: "anon", member: false, enroll: false, remove: false },
          { role: "authenticated", member: false, enroll: true, remove: true },
          { role: "service_role", member: true, enroll: true, remove: true },
        ]);
        await as(null, "service_role");
        await assert.rejects(
          db.query("select public.exchange_member()"),
          /AUTH_REQUIRED/,
        );
      },
    );

    await t.test(
      "enrollment, writes and deletion hold the same transaction lock",
      async () => {
        await as(departing);
        await db.exec("begin");
        try {
          await db.query("select public.exchange_enroll(true,false)");
          // PGlite has one connection: inspect the real PostgreSQL lock retained
          // by the transaction instead of pretending this proves concurrency.
          const held = await db.query<{ classid: number; objid: number }>(
            "select classid::bigint, objid::bigint from pg_locks where locktype='advisory' and mode='ExclusiveLock' and granted",
          );
          assert.equal(held.rows.length, 1);
          await db.exec("reset role");
          assert.equal(
            (
              await db.query<{ member: string }>(
                "select public.exchange_member() member",
              )
            ).rows[0].member,
            departing,
          );
          await db.query("select public.exchange_delete_account()");
          const retained = await db.query<{ classid: number; objid: number }>(
            "select classid::bigint, objid::bigint from pg_locks where locktype='advisory' and mode='ExclusiveLock' and granted",
          );
          assert.deepEqual(retained.rows, held.rows);
          await db.exec("commit");
        } catch (error) {
          await db.exec("rollback");
          throw error;
        }
        assert.equal(
          await count(
            "select count(*)::int count from pg_locks where locktype='advisory' and granted",
          ),
          0,
        );
        assert.equal(
          await count(
            "select count(*)::int count from public.exchange_deletion_requests where user_id=$1",
            [departing],
          ),
          1,
        );
      },
    );

    await t.test(
      "a deleted participant cannot re-enroll or submit late mutations",
      async () => {
        await as(departing);
        const lateCalls = [
          "public.exchange_enroll(true,true)",
          "public.exchange_save_profile('{}'::jsonb,true,0)",
          "public.exchange_reserve_photo()",
          "public.exchange_save_listing(null,'request','{}'::jsonb,0,gen_random_uuid())",
          "public.exchange_listing_state(gen_random_uuid(),'renew')",
          "public.exchange_request(gen_random_uuid(),'Presentación sintética',gen_random_uuid())",
          "public.exchange_respond(gen_random_uuid(),'accepted')",
          "public.exchange_send(gen_random_uuid(),'Mensaje sintético',gen_random_uuid())",
          "public.exchange_block(gen_random_uuid())",
          "public.exchange_report('profile',gen_random_uuid(),'Reporte sintético de prueba')",
        ];
        for (const call of lateCalls)
          await assert.rejects(db.query(`select ${call}`), /ACCOUNT_DELETING/);
        await db.query("select public.exchange_delete_account()");
        await db.exec("reset role");
        assert.equal(
          await count(
            "select count(*)::int count from public.exchange_accounts where user_id=$1",
            [departing],
          ),
          0,
        );
        assert.equal(
          await count(
            "select count(*)::int count from public.exchange_events where user_id=$1",
            [departing],
          ),
          0,
        );
        assert.equal(
          await count(
            "select count(*)::int count from public.exchange_deletion_requests where user_id=$1",
            [departing],
          ),
          1,
        );
        // The other account still participates, and Auth deletion can finish.
        await as(other);
        await db.query("select public.exchange_enroll(true,false)");
        await db.exec("reset role");
        await db.query("delete from auth.users where id=$1", [departing]);
        assert.equal(
          await count(
            "select count(*)::int count from public.exchange_accounts where user_id=$1",
            [other],
          ),
          1,
        );
        assert.equal(
          await count(
            "select count(*)::int count from public.exchange_deletion_requests where user_id=$1",
            [departing],
          ),
          0,
        );
      },
    );
  } finally {
    await db.close();
  }
});
