import { loadOhdSetup } from "../data/ohdSetup.actions";
import OhdSetupView from "./OhdSetupView";

export const dynamic = "force-dynamic";

export default async function OhdSetupPage() {
  const setup = await loadOhdSetup();
  return <OhdSetupView setup={setup} />;
}