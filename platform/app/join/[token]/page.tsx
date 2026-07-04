import Link from "next/link";
import { JoinForm } from "@/components/JoinForm";
import { RaidweaveMark } from "@/components/brand/RaidweaveMark";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="public-shell join-page theme-gigalodon">
      <Link href="/" aria-label="Retour à l’accueil"><RaidweaveMark /></Link>
      <section className="join-stage">
        <div className="join-route" aria-hidden="true"><span>INVITATION</span><i /><span>IDENTITÉ</span><i /><span>MISSION</span></div>
        <JoinForm token={token} />
      </section>
    </main>
  );
}
