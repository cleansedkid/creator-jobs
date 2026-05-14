import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function getAuthContext(experienceId: string) {
  const rh = await headers();

  const h = new Headers();
  rh.forEach((value, key) => h.set(key, value));

  let userId: string | null = null;

  // 1) Verify logged-in user
  try {
    const verified = await whopsdk.verifyUserToken(h);
    userId = verified.userId ?? null;

    console.log("✅ getAuthContext user verified", {
      experienceId,
      userId,
    });
  } catch (err) {
    console.log("❌ getAuthContext verifyUserToken failed", {
      experienceId,
      error: err,
    });

    return null;
  }

  // If we got the user, never lose them after this point.
  if (!userId) {
    return {
      userId: null,
      bizId: null,
      role: null,
      isAdmin: false,
      authSource: "missing_user",
    };
  }

  let bizId: string | null = null;

  // 2) Get experience/company
  try {
    const exp = await whopsdk.experiences.retrieve(experienceId);
    bizId = (exp as any)?.company?.id ?? null;

    console.log("✅ getAuthContext experience retrieved", {
      experienceId,
      userId,
      bizId,
    });
  } catch (err) {
    console.log("❌ getAuthContext experience retrieve failed", {
      experienceId,
      userId,
      error: err,
    });

    return {
      userId,
      bizId: null,
      role: null,
      isAdmin: false,
      authSource: "experience_retrieve_failed",
    };
  }

  if (!bizId) {
    return {
      userId,
      bizId: null,
      role: null,
      isAdmin: false,
      authSource: "missing_biz_id",
    };
  }

  // 3) Get authorized users / admin role
  try {
    const team = await (whopsdk as any).authorizedUsers.list({
      company_id: bizId,
    });

    const items = (team as any)?.data ?? [];

    const match = items.find((au: any) => {
      const id =
        au?.user?.id ??
        au?.user_id ??
        au?.authorized_user?.id ??
        au?.authorized_user_id ??
        null;

      return id === userId;
    });

    const role = match?.role?.toLowerCase?.() ?? null;
    const isAdmin = role === "owner" || role === "admin";

    console.log("✅ getAuthContext role resolved", {
      experienceId,
      userId,
      bizId,
      role,
      isAdmin,
      teamCount: items.length,
    });

    return {
      userId,
      bizId,
      role,
      isAdmin,
      authSource: "authorized_users",
    };
  } catch (err) {
    console.log("❌ getAuthContext authorizedUsers failed", {
      experienceId,
      userId,
      bizId,
      error: err,
    });

    return {
      userId,
      bizId,
      role: null,
      isAdmin: false,
      authSource: "authorized_users_failed",
    };
  }
}