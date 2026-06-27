import { loadOhdFormSetup, loadOhdProject } from "../data/ohdProjectForm.actions";
import OhdProjectFormView from "./OhdProjectFormView";

export const dynamic = "force-dynamic";

export default async function OhdProjectFormPage({ params, searchParams }) {
  const resolvedParams = await params;
  const projectId = resolvedParams?.id || null;
  const isEdit = !!projectId && projectId !== "new";

  const setup = await loadOhdFormSetup();

  let projectData = null;
  if (isEdit) {
    projectData = await loadOhdProject(projectId);
  }

  return (
    <OhdProjectFormView
      mode={isEdit ? "edit" : "create"}
      projectId={isEdit ? projectId : null}
      setup={setup}
      projectData={projectData}
    />
  );
}