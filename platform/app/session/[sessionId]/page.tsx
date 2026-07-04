import { SessionApp } from "@/components/SessionApp";

export default async function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <SessionApp sessionId={sessionId} />;
}
