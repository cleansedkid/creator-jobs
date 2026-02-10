import ExperienceGuard from "./ExperienceGuard";
import ExperienceSidebar from "./ExperienceSidebar";


export default async function ExperienceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  const isValidExperience =
    typeof experienceId === "string" &&
    experienceId.startsWith("exp_");

  return (
    <ExperienceGuard>
      <>
        

        {/* Shell */}
		  <div className="flex min-h-screen w-full overflow-x-hidden">
  {/* Sidebar (full height) */}
  <ExperienceSidebar experienceId={experienceId} isValidExperience={isValidExperience} />

  {/* Main content */}
  <main className="flex-1 min-w-0 px-6 py-6">
    <div className="mx-auto max-w-6xl">{children}</div>
  </main>
</div>



      </>
    </ExperienceGuard>
  );
}
