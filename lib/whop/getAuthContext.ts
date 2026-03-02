import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function getAuthContext(experienceId: string) {
  try {
    // ✅ Next gives ReadonlyHeaders (sometimes wrapped in a Promise)
    const rh = await headers();

    // ✅ Convert ReadonlyHeaders -> real Headers (what Whop expects)
    const h = new Headers();
    rh.forEach((value, key) => h.set(key, value));

    // 1) Logged in user
    const { userId } = await whopsdk.verifyUserToken(h);


    // 2️⃣ Get experience
    const exp = await whopsdk.experiences.retrieve(experienceId);
    const bizId = (exp as any)?.company?.id ?? null;

    if (!bizId) {
      return { userId, bizId: null, role: null, isAdmin: false };
    }

    // 3️⃣ Get authorized users (team members)
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

    return {
      userId,
      bizId,
      role,
      isAdmin,
    };
  } catch (err) {
    console.log("getAuthContext error:", err);
    return null;
  }
}