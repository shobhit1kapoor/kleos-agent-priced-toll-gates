import { KleosApp } from "@/components/kleos-app";
import { getLedgerSnapshot } from "@/lib/kleos/ledger";

export const dynamic = "force-dynamic";

export default function Home() {
  return <KleosApp initialLedger={getLedgerSnapshot()} />;
}
