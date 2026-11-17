import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { applyMigrations } from "./helpers/migrations";

test("only the backend administration role can assign community moderation", async () => {
  const db = new PGlite();
  const user = "74000000-0000-4000-8000-000000000001";
  try {
    await db.exec(`create schema auth; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;`);
    await db.query("insert into auth.users values($1)", [user]);
    await applyMigrations(db);
    await db.exec("set role service_role");
    await db.query(
      "insert into public.community_members(user_id,role) values($1,'member') on conflict(user_id) do update set role=excluded.role",
      [user],
    );
    await db.query(
      "update public.community_members set role='moderator' where user_id=$1",
      [user],
    );
    assert.equal(
      (
        await db.query<{ role: string }>(
          "select role from public.community_members where user_id=$1",
          [user],
        )
      ).rows[0].role,
      "moderator",
    );
    await db.query(
      "update public.community_members set role='member' where user_id=$1",
      [user],
    );
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      user,
    ]);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(
        db.query(
          "update public.community_members set role='moderator' where user_id=$1",
          [user],
        ),
        /permission denied/,
      );
      await assert.rejects(
        db.query(
          "insert into public.community_members(user_id,role) values($1,'moderator') on conflict(user_id) do update set role=excluded.role",
          [user],
        ),
        /permission denied/,
      );
      await db.exec("reset role");
    }
    assert.equal(
      (
        await db.query<{ role: string }>(
          "select role from public.community_members where user_id=$1",
          [user],
        )
      ).rows[0].role,
      "member",
    );
  } finally {
    await db.close();
  }
});
