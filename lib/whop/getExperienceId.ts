/**
 * Returns the Whop experience ID from the route params.
 *
 * Expected route structure:
 * /experience/[experienceId]/...
 *
 * This is the SINGLE source of truth for tenant isolation.
 */
export async function getExperienceId(
	params: { experienceId?: string }
 ): Promise<string> {
	const experienceId = params?.experienceId;
 
	if (!experienceId || typeof experienceId !== "string") {
	  throw new Error("Missing experienceId in route params");
	}
 
	return experienceId;
 }
 