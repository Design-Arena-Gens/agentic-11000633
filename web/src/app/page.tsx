import AgentDashboard from "@/components/agent-dashboard";
import { fetchLatestInsights } from "@/lib/data";

export default async function Home() {
  const history = await fetchLatestInsights(12);
  return <AgentDashboard initialHistory={history} />;
}
