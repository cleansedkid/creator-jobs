import Link from "next/link";
import Image from "next/image";
import ExperienceGuard from "./ExperienceGuard";


export default async function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  return (
	<ExperienceGuard>
	  <>
		 {/* Header */}
		 <div className="px-6 pt-4">
			<Link
			  href={`/experience/${experienceId}/onboarding`}
			  className="inline-flex items-center gap-2 group transition-all"
			>
			  <Image
				 src="/logo.png"
				 alt="Creator Jobs"
				 width={48}
				 height={48}
				 priority
				 className="
					transition-all
					group-hover:scale-105
					group-hover:drop-shadow-[0_0_10px_rgba(45,212,191,0.6)]
				 "
			  />
			  <span
				 className="
					text-sm font-semibold text-foreground
					transition-all
					group-hover:text-teal-400
					group-hover:drop-shadow-[0_0_6px_rgba(45,212,191,0.6)]
				 "
			  >
				 Creator Jobs
			  </span>
			</Link>
		 </div>

		 {/* Page content */}
		 <main className="pt-6">{children}</main>
	  </>
	</ExperienceGuard>
 );
