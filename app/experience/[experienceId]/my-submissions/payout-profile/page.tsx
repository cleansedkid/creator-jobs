import PayoutProfileForm from "./PayoutProfileForm";

export default async function PayoutProfilePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Set up payouts
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Before opening your Whop payout account, we need your full name and
          email so your connected payout account can be created correctly.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <PayoutProfileForm experienceId={experienceId} />
      </div>
    </div>
  );
}