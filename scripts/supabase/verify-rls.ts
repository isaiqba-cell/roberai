import { randomUUID } from "node:crypto";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { loadSupabaseCredentials } from "./environment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function createTestUser(
  admin: SupabaseClient,
  anonKey: string,
  url: string,
  label: string,
) {
  const suffix = randomUUID();
  const email = `rls-${label}-${suffix}@example.invalid`;
  const password = `Rober-${randomUUID()}-Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Could not create RLS test user ${label}.`);
  }

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    throw new Error(`Could not sign in RLS test user ${label}.`);
  }

  return { client, user: data.user };
}

async function deleteUser(admin: SupabaseClient, user: User | undefined) {
  if (user) {
    await admin.auth.admin.deleteUser(user.id);
  }
}

async function main() {
  const credentials = loadSupabaseCredentials();
  const admin = createClient(credentials.url, credentials.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const anonymous = createClient(credentials.url, credentials.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const schemaCheck = await admin
    .from("user_anchor_items")
    .select("id")
    .limit(1);
  if (schemaCheck.error) {
    throw new Error(
      "RLS verification requires the Stage 2 migrations to be applied first.",
    );
  }

  let userA: User | undefined;
  let userB: User | undefined;
  const catalogSlugs: string[] = [];

  try {
    const accountA = await createTestUser(
      admin,
      credentials.anonKey,
      credentials.url,
      "a",
    );
    const accountB = await createTestUser(
      admin,
      credentials.anonKey,
      credentials.url,
      "b",
    );
    userA = accountA.user;
    userB = accountB.user;

    const ownProfile = await accountA.client
      .from("profiles")
      .select("id, email")
      .eq("id", userA.id)
      .single();
    assert(
      !ownProfile.error && ownProfile.data?.email === userA.email,
      "Auth did not create the owner's profile row.",
    );

    const ownRole = await accountA.client
      .from("user_roles")
      .select("role")
      .eq("user_id", userA.id);
    assert(
      !ownRole.error && ownRole.data.some(({ role }) => role === "member"),
      "Auth did not create the owner's member role.",
    );

    const anonymousMerge = await anonymous.rpc("merge_guest_anchors", {
      p_anchors: [],
    });
    assert(
      Boolean(anonymousMerge.error),
      "Anonymous users can invoke the anchor merge RPC.",
    );

    const clientAnchorId = randomUUID();
    const secondaryAnchorId = randomUUID();
    const guestAnchors = [
      {
        clientAnchorId,
        brandName: "RLS Test Denim",
        styleName: "Reference Straight",
        taggedSize: "32x32",
        category: "jeans",
        active: true,
        resolutionSource: "self_reported",
        notes: { source: "rls-test" },
      },
      {
        clientAnchorId: secondaryAnchorId,
        brandName: "RLS Test Denim",
        styleName: "Reference Relaxed",
        taggedSize: "33x32",
        category: "jeans",
        active: false,
        resolutionSource: "self_reported",
        notes: { source: "rls-test" },
      },
    ];
    const firstMerge = await accountA.client.rpc("merge_guest_anchors", {
      p_anchors: guestAnchors,
    });
    assert(
      !firstMerge.error && firstMerge.data?.length === 2,
      "Authenticated guest-anchor merge failed.",
    );

    const repeatedMerge = await accountA.client.rpc("merge_guest_anchors", {
      p_anchors: guestAnchors.map((anchor) =>
        anchor.clientAnchorId === clientAnchorId
          ? { ...anchor, taggedSize: "32x34" }
          : anchor,
      ),
    });
    assert(
      !repeatedMerge.error && repeatedMerge.data?.length === 2,
      "Repeated guest-anchor merge failed.",
    );

    const ownAnchors = await accountA.client
      .from("user_anchor_items")
      .select("id, client_anchor_id, tagged_size, active")
      .order("created_at");
    assert(!ownAnchors.error, "Owner could not read merged anchors.");
    assert(
      ownAnchors.data.length === 2,
      "Guest-anchor merge was not idempotent.",
    );
    assert(
      ownAnchors.data.filter(({ active }) => active).length === 1,
      "Guest-anchor merge did not preserve exactly one active anchor.",
    );
    const mergedAnchor = ownAnchors.data.find(
      ({ client_anchor_id }) => client_anchor_id === clientAnchorId,
    );
    const secondaryAnchor = ownAnchors.data.find(
      ({ client_anchor_id }) => client_anchor_id === secondaryAnchorId,
    );
    assert(mergedAnchor, "Merged anchor could not be found by its client ID.");
    assert(
      secondaryAnchor,
      "Secondary anchor could not be found by its client ID.",
    );
    assert(
      mergedAnchor.tagged_size === "32x34",
      "Repeated guest-anchor merge did not update the existing row.",
    );

    const switchOwnAnchor = await accountA.client.rpc("set_active_anchor", {
      p_anchor_id: secondaryAnchor.id,
    });
    assert(
      !switchOwnAnchor.error && switchOwnAnchor.data === true,
      "Owner could not switch the active anchor.",
    );
    const anchorsAfterSwitch = await accountA.client
      .from("user_anchor_items")
      .select("id, active")
      .in("id", [mergedAnchor.id, secondaryAnchor.id]);
    assert(
      !anchorsAfterSwitch.error &&
        anchorsAfterSwitch.data.filter(({ active }) => active).length === 1 &&
        anchorsAfterSwitch.data.find(({ id }) => id === secondaryAnchor.id)
          ?.active === true,
      "Active-anchor switch did not leave exactly the requested pair active.",
    );

    const anonymousSwitch = await anonymous.rpc("set_active_anchor", {
      p_anchor_id: secondaryAnchor.id,
    });
    assert(
      Boolean(anonymousSwitch.error),
      "Anonymous users can invoke the active-anchor RPC.",
    );

    const crossAnchorSwitch = await accountB.client.rpc("set_active_anchor", {
      p_anchor_id: secondaryAnchor.id,
    });
    assert(
      Boolean(crossAnchorSwitch.error),
      "RLS allowed another user to activate an anchor.",
    );

    const crossProfileRead = await accountB.client
      .from("profiles")
      .select("id")
      .eq("id", userA.id);
    assert(
      !crossProfileRead.error,
      "Cross-user profile probe failed unexpectedly.",
    );
    assert(
      crossProfileRead.data.length === 0,
      "RLS exposed another user's profile.",
    );

    const crossAnchorRead = await accountB.client
      .from("user_anchor_items")
      .select("id")
      .eq("id", mergedAnchor.id);
    assert(
      !crossAnchorRead.error,
      "Cross-user anchor probe failed unexpectedly.",
    );
    assert(
      crossAnchorRead.data.length === 0,
      "RLS exposed another user's anchor.",
    );

    const crossAnchorUpdate = await accountB.client
      .from("user_anchor_items")
      .update({ tagged_size: "99x99" })
      .eq("id", mergedAnchor.id)
      .select("id");
    assert(
      !crossAnchorUpdate.error,
      "Blocked update returned an unexpected API error.",
    );
    assert(
      crossAnchorUpdate.data.length === 0,
      "RLS allowed another user to update an anchor.",
    );

    const forgedInsert = await accountB.client
      .from("user_anchor_items")
      .insert({
        user_id: userA.id,
        client_anchor_id: randomUUID(),
        brand_name: "Forged Denim",
        style_name: "Cross-user write",
        tagged_size: "32x32",
        category: "jeans",
        active: false,
      });
    assert(
      Boolean(forgedInsert.error),
      "RLS allowed a forged cross-user insert.",
    );

    const unpublishedSlug = `rls-hidden-${randomUUID()}`;
    const publishedSlug = `rls-visible-${randomUUID()}`;
    catalogSlugs.push(unpublishedSlug, publishedSlug);
    const catalogInsert = await admin.from("brands").insert([
      {
        name: "Hidden RLS Brand",
        slug: unpublishedSlug,
        status: "needs_review",
        origin: "manual",
      },
      {
        name: "Visible RLS Brand",
        slug: publishedSlug,
        status: "published",
        origin: "manual",
      },
    ]);
    assert(
      !catalogInsert.error,
      "Could not create catalog visibility fixtures.",
    );

    const hiddenRead = await anonymous
      .from("brands")
      .select("slug")
      .eq("slug", unpublishedSlug);
    assert(
      !hiddenRead.error,
      "Anonymous hidden-catalog probe failed unexpectedly.",
    );
    assert(
      hiddenRead.data.length === 0,
      "Anonymous users can read review-state catalog rows.",
    );

    const visibleRead = await anonymous
      .from("brands")
      .select("slug")
      .eq("slug", publishedSlug);
    assert(
      !visibleRead.error,
      "Anonymous published-catalog probe failed unexpectedly.",
    );
    assert(
      visibleRead.data.length === 1,
      "Anonymous users cannot read published catalog rows.",
    );

    process.stdout.write(
      "Auth verified: profiles and member roles are created.\n",
    );
    process.stdout.write(
      "Guest merge verified: anonymous use is rejected and retries are idempotent.\n",
    );
    process.stdout.write(
      "Anchor switching verified: owners can switch and cross-user calls are rejected.\n",
    );
    process.stdout.write("RLS verified: cross-user profiles are private.\n");
    process.stdout.write(
      "RLS verified: cross-user anchor reads and writes are blocked.\n",
    );
    process.stdout.write(
      "RLS verified: only published catalog rows are public.\n",
    );
  } finally {
    if (catalogSlugs.length > 0) {
      await admin.from("brands").delete().in("slug", catalogSlugs);
    }
    await deleteUser(admin, userA);
    await deleteUser(admin, userB);
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown RLS verification failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
