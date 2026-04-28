import PayoutProfileForm from "./PayoutProfileForm";

export default async function PayoutProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ experienceId: string }>;
  searchParams: Promise<{ returnTo?: string; token?: string }>;
}) {
  const { experienceId } = await params;
  const { returnTo, token } = await searchParams;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Set up payouts
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Before you can submit work for paid jobs, save your payout details so
          payment can be sent correctly if your submission is approved.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <PayoutProfileForm
          experienceId={experienceId}
          returnTo={returnTo || `/experience/${experienceId}/jobs`}
          token={token || ""}
        />
      </div>
    </div>
  );
}