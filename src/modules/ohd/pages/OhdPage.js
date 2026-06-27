import { loadOhdProjects } from "../data/ohdProjects.actions";
import OhdView from "./OhdView";

export const dynamic = "force-dynamic";

export default async function OhdPage() {
  const { projects, statuses } = await loadOhdProjects();
  return <OhdView projects={projects} statuses={statuses} />;
}