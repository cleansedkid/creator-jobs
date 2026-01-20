export function debugExperience(req: Request | null, label: string) {
	try {
	  if (!req) {
		 console.log(`[EXP DEBUG][${label}] no request object`);
		 return;
	  }
 
	  const headers = req.headers;
	  const headerExp =
		 headers.get("x-whop-experience-id") ||
		 headers.get("X-Whop-Experience-Id");
 
	  const url = new URL(req.url);
	  const pathMatch = url.pathname.match(/exp_[a-zA-Z0-9]+/);
 
	  console.log(`[EXP DEBUG][${label}]`, {
		 headerExp,
		 pathExp: pathMatch?.[0] ?? null,
		 pathname: url.pathname,
	  });
	} catch (err) {
	  console.error(`[EXP DEBUG][${label}] error`, err);
	}
 }
 