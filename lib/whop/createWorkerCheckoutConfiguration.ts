type CreateWorkerCheckoutConfigurationArgs = {
	workerCompanyId: string;
	returnUrl: string;
	jobId: string;
	submissionId: string;
	workerWhopUserId: string;
	payoutCents: number;
	platformFeeBps: number;
	platformFeeCents: number;
	totalChargeCents: number;
	experienceId: string;
 };
 
 type CreatedCheckoutConfiguration = {
	id: string;
	purchase_url: string;
	plan?: {
	  id?: string;
	};
 };
 
 export async function createWorkerCheckoutConfiguration({
	workerCompanyId,
	returnUrl,
	jobId,
	submissionId,
	workerWhopUserId,
	payoutCents,
	platformFeeBps,
	platformFeeCents,
	totalChargeCents,
	experienceId,
 }: CreateWorkerCheckoutConfigurationArgs): Promise<CreatedCheckoutConfiguration> {
	const companyApiKey = process.env.WHOP_COMPANY_API_KEY;
 
	if (!companyApiKey) {
	  throw new Error("Missing WHOP_COMPANY_API_KEY");
	}
 
	const totalChargeUsd = Number((totalChargeCents / 100).toFixed(2));
	const applicationFeeUsd = Number((platformFeeCents / 100).toFixed(2));
 
	const response = await fetch(
	  "https://api.whop.com/api/v1/checkout_configurations",
	  {
		 method: "POST",
		 headers: {
			Authorization: `Bearer ${companyApiKey}`,
			"Content-Type": "application/json",
		 },
		 body: JSON.stringify({
			redirect_url: returnUrl,
			metadata: {
			  jobId,
			  submissionId,
			  workerWhopUserId,
			  workerCompanyId,
			  payoutCents,
			  platformFeeBps,
			  platformFeeCents,
			  totalChargeCents,
			  experienceId,
			},
			plan: {
			  company_id: workerCompanyId,
			  currency: "usd",
			  plan_type: "one_time",
			  initial_price: totalChargeUsd,
			  application_fee_amount: applicationFeeUsd,
			},
		 }),
		 cache: "no-store",
	  }
	);
 
	const responseText = await response.text();
 
	if (!response.ok) {
	  throw new Error(
		 `Whop create checkout configuration failed (${response.status}): ${responseText}`
	  );
	}
 
	let checkout: CreatedCheckoutConfiguration;
	try {
	  checkout = JSON.parse(responseText) as CreatedCheckoutConfiguration;
	} catch {
	  throw new Error(
		 `Whop create checkout configuration returned invalid JSON: ${responseText}`
	  );
	}
 
	if (!checkout?.id || !checkout?.purchase_url) {
	  throw new Error(
		 "Whop create checkout configuration failed: missing id or purchase_url"
	  );
	}
 
	return checkout;
 }