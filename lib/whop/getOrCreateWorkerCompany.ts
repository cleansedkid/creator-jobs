import { supabaseServer } from "@/lib/supabase/server";
import { whopsdk } from "@/lib/whop-sdk";

type GetOrCreateWorkerCompanyArgs = {
  whopUserId: string;
};

type WorkerPayoutAccountRow = {
  id: string;
  whop_user_id: string;
  worker_company_id: string;
  worker_email: string | null;
  worker_display_name: string | null;
  onboarding_status: string;
  payouts_enabled: boolean;
};

export async function getOrCreateWorkerCompany({
  whopUserId,
}: GetOrCreateWorkerCompanyArgs): Promise<WorkerPayoutAccountRow> {
  const { data: existing, error: existingError } = await supabaseServer
    .from("worker_payout_accounts")
    .select(
      `
      id,
      whop_user_id,
      worker_company_id,
      worker_email,
      worker_display_name,
      onboarding_status,
      payouts_enabled
      `
    )
    .eq("whop_user_id", whopUserId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Failed to load worker payout account: ${existingError.message}`
    );
  }

  if (existing) {
    return existing as WorkerPayoutAccountRow;
  }

  // TEMP DEV FALLBACKS
  // This gets the architecture working first.
  // We will replace these with real worker email/name before shipping.
  const workerEmail = `${whopUserId}@creatorjobs.local`;
  const workerDisplayName = whopUserId;

  const workerCompany = await whopsdk.companies.create({
    email: workerEmail,
    parent_company_id: process.env.WHOP_COMPANY_ID!,
    title: workerDisplayName,
    metadata: {
      internal_user_id: whopUserId,
      worker_type: "approved_worker",
    },
  } as any);

  if (!workerCompany?.id) {
    throw new Error("Whop company creation failed: missing company id");
  }

  const { data: inserted, error: insertError } = await supabaseServer
    .from("worker_payout_accounts")
    .insert({
      whop_user_id: whopUserId,
      worker_company_id: workerCompany.id,
      worker_email: workerEmail,
      worker_display_name: workerDisplayName,
      onboarding_status: "created",
      payouts_enabled: false,
    })
    .select(
      `
      id,
      whop_user_id,
      worker_company_id,
      worker_email,
      worker_display_name,
      onboarding_status,
      payouts_enabled
      `
    )
    .single();

  if (insertError) {
    throw new Error(
      `Failed to save worker payout account: ${insertError.message}`
    );
  }

  return inserted as WorkerPayoutAccountRow;
}