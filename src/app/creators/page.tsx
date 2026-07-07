import Link from "next/link";
import {
  BadgeDollarSign,
  ExternalLink,
  Landmark,
  ReceiptText,
  ShieldCheck,
  Split,
  Wallet,
} from "lucide-react";
import { getLedgerSnapshot } from "@/lib/kleos/ledger";

export const dynamic = "force-dynamic";

function shortHash(value?: string) {
  if (!value) {
    return "pending";
  }

  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

function formatUsdc(value: number) {
  return `$${value.toFixed(value < 0.01 ? 4 : 3)}`;
}

function percent(splitBps: number) {
  return `${(splitBps / 100).toFixed(splitBps % 100 === 0 ? 0 : 2)}%`;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4">
      <p className="text-xs font-semibold uppercase text-[#6f686a]">{label}</p>
      <p className="mt-2 break-words font-mono text-lg font-semibold text-[#181818]">{value}</p>
      {detail ? <p className="mt-2 text-sm leading-5 text-[#6f686a]">{detail}</p> : null}
    </div>
  );
}

function HeaderLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
    >
      {label}
      <ExternalLink size={15} aria-hidden />
    </a>
  );
}

export default function CreatorEarningsPage() {
  const ledger = getLedgerSnapshot();
  const paymentById = new Map(ledger.payments.map((payment) => [payment.id, payment]));
  const creatorRows = ledger.creators
    .map((creator) => {
      const splits = ledger.payoutSplits.filter((split) => split.creatorId === creator.id);
      const readSplits = splits.filter((split) => paymentById.get(split.paymentId)?.kind === "read");
      const citationSplits = splits.filter((split) => paymentById.get(split.paymentId)?.kind === "citation");
      const impactGrants = ledger.impactGrants.filter((grant) => grant.creatorId === creator.id);
      const cashouts = ledger.creatorCashouts.filter((cashout) => cashout.creatorId === creator.id);
      const sources = ledger.catalog.filter((item) =>
        item.collaborators.some((collaborator) => collaborator.id === creator.id),
      );
      const citationReceipts = ledger.citationReceipts.filter((receipt) =>
        sources.some((source) => source.id === receipt.itemId),
      );
      const readUsdc = readSplits.reduce((sum, split) => sum + split.amountUsdc, 0);
      const citationUsdc = citationSplits.reduce((sum, split) => sum + split.amountUsdc, 0);
      const impactUsdc = impactGrants.reduce((sum, grant) => sum + grant.amountUsdc, 0);
      const cashoutUsdc = cashouts.reduce((sum, cashout) => sum + cashout.amountUsdc, 0);
      const totalEarnedUsdc = Number((readUsdc + citationUsdc + impactUsdc).toFixed(6));
      const availableUsdc = Number(Math.max(0, totalEarnedUsdc - cashoutUsdc).toFixed(6));

      return {
        creator,
        sources,
        splits,
        impactGrants,
        cashouts,
        citationReceipts,
        readUsdc: Number(readUsdc.toFixed(6)),
        citationUsdc: Number(citationUsdc.toFixed(6)),
        impactUsdc: Number(impactUsdc.toFixed(6)),
        cashoutUsdc: Number(cashoutUsdc.toFixed(6)),
        totalEarnedUsdc,
        availableUsdc,
      };
    })
    .sort((a, b) => b.totalEarnedUsdc - a.totalEarnedUsdc);

  const totalReadUsdc = creatorRows.reduce((sum, row) => sum + row.readUsdc, 0);
  const totalCitationUsdc = creatorRows.reduce((sum, row) => sum + row.citationUsdc, 0);
  const totalImpactUsdc = creatorRows.reduce((sum, row) => sum + row.impactUsdc, 0);
  const totalCashoutUsdc = creatorRows.reduce((sum, row) => sum + row.cashoutUsdc, 0);
  const paidCreators = creatorRows.filter((row) => row.totalEarnedUsdc > 0).length;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#181818]">
      <header className="border-b border-[#e0e0dc] bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[#19c37d] text-[#181818]">
              <BadgeDollarSign size={22} aria-hidden />
            </span>
            <span>
              <span className="block text-base font-semibold">Kleos</span>
              <span className="block text-sm text-[#6f686a]">Creator earnings</span>
            </span>
          </Link>
          <div className="flex flex-wrap gap-2">
            <HeaderLink href="/proof" label="Proof explorer" />
            <HeaderLink href="/api/creators/cashout" label="Cash-out API" />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div>
            <p className="text-sm font-semibold uppercase text-[#6f686a]">Creator operations</p>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold tracking-tight text-[#181818] md:text-5xl">
              Creator Earnings Ledger
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#6f686a]">
              A creator-readable view of how every read toll, citation toll, impact grant, and
              Arc-ready cash-out flows to the people behind grounded AI answers.
            </p>
          </div>

          <div className="rounded-xl border border-[#e0e0dc] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl border border-[#deded9] bg-[#f7f7f3] text-[#6f686a]">
                <Landmark size={20} aria-hidden />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-[#6f686a]">Arc-ready payout queue</p>
                <p className="mt-1 text-2xl font-semibold text-[#181818]">{formatUsdc(totalCashoutUsdc)}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6f686a]">
              Cash-out records aggregate existing split and impact balances only. They do not invent payout
              volume, which keeps the ledger clear for reviewers and creators.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-4">
          <Metric label="Paid creators" value={String(paidCreators)} detail={`${ledger.creators.length} onboarded`} />
          <Metric label="Read toll splits" value={formatUsdc(totalReadUsdc)} />
          <Metric label="Citation toll splits" value={formatUsdc(totalCitationUsdc)} />
          <Metric label="Impact rewards" value={formatUsdc(totalImpactUsdc)} />
        </div>

        <div className="mt-6 grid gap-5">
          {creatorRows.map((row) => (
            <section key={row.creator.id} className="rounded-xl border border-[#e0e0dc] bg-white shadow-sm">
              <div className="grid gap-5 border-b border-[#e8e8e3] p-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,0.85fr)]">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#deded9] bg-[#f7f7f3] text-[#6f686a]">
                    <Wallet size={21} aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-[#6f686a]">{row.creator.role}</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#181818]">
                      {row.creator.displayName}
                    </h2>
                    <p className="mt-2 break-words font-mono text-sm text-[#6f686a]">{row.creator.wallet}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Earned" value={formatUsdc(row.totalEarnedUsdc)} />
                  <Metric label="Queued cash-out" value={formatUsdc(row.cashoutUsdc)} />
                  <Metric label="Available" value={formatUsdc(row.availableUsdc)} />
                </div>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
                <div className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Metric label="Read splits" value={formatUsdc(row.readUsdc)} detail={`${row.splits.length} split record(s)`} />
                    <Metric label="Citation splits" value={formatUsdc(row.citationUsdc)} detail={`${row.citationReceipts.length} receipt(s)`} />
                    <Metric label="Impact grants" value={formatUsdc(row.impactUsdc)} detail={`${row.impactGrants.length} grant(s)`} />
                  </div>

                  <div className="rounded-xl border border-[#e6e6e1] bg-[#fbfbf8]">
                    <div className="flex items-center gap-3 border-b border-[#e8e8e3] px-4 py-3">
                      <Split size={17} className="text-[#6f686a]" aria-hidden />
                      <p className="text-sm font-semibold text-[#181818]">Sources and split policy</p>
                    </div>
                    <div className="grid gap-2 p-4">
                      {row.sources.map((source) => {
                        const collaborator = source.collaborators.find((entry) => entry.id === row.creator.id);

                        return (
                          <div
                            key={source.id}
                            className="grid gap-2 rounded-lg border border-[#e6e6e1] bg-white px-4 py-3 md:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <p className="font-semibold text-[#181818]">{source.title}</p>
                              <p className="mt-1 text-sm text-[#6f686a]">
                                Read toll {formatUsdc(source.currentPriceUsdc)} - citation toll{" "}
                                {formatUsdc(source.citationPriceUsdc ?? source.currentPriceUsdc * 0.35)}
                              </p>
                            </div>
                            <p className="font-mono text-sm font-semibold text-[#2f2f2f]">
                              {percent(collaborator?.splitBps ?? 0)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-xl border border-[#e6e6e1] bg-[#fbfbf8] p-4">
                    <div className="flex items-center gap-3">
                      <ReceiptText size={17} className="text-[#6f686a]" aria-hidden />
                      <p className="text-sm font-semibold text-[#181818]">Latest creator proof</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {row.cashouts[0] ? (
                        <a
                          href={row.cashouts[0].explorerUrl}
                          className="rounded-lg border border-[#deded9] bg-white px-4 py-3 text-sm transition hover:border-[#b8b8b1]"
                        >
                          <span className="block font-semibold text-[#181818]">Cash-out {row.cashouts[0].status}</span>
                          <span className="mt-1 block font-mono text-[#6f686a]">
                            {shortHash(row.cashouts[0].txHash)} - {formatUsdc(row.cashouts[0].amountUsdc)}
                          </span>
                        </a>
                      ) : (
                        <p className="rounded-lg border border-[#e6e6e1] bg-white px-4 py-3 text-sm text-[#6f686a]">
                          No cash-out record yet.
                        </p>
                      )}

                      {row.impactGrants[0] ? (
                        <a
                          href={row.impactGrants[0].explorerUrl}
                          className="rounded-lg border border-[#deded9] bg-white px-4 py-3 text-sm transition hover:border-[#b8b8b1]"
                        >
                          <span className="block font-semibold text-[#181818]">Impact grant</span>
                          <span className="mt-1 block font-mono text-[#6f686a]">
                            {shortHash(row.impactGrants[0].txHash)} - {formatUsdc(row.impactGrants[0].amountUsdc)}
                          </span>
                        </a>
                      ) : (
                        <p className="rounded-lg border border-[#e6e6e1] bg-white px-4 py-3 text-sm text-[#6f686a]">
                          No impact grant yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={17} className="text-emerald-700" aria-hidden />
                      <p className="text-sm font-semibold text-emerald-900">Creator claim</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                      Earnings are derived from auditable split records, citation receipts, and impact
                      grants. Public cash-out records are Arc-ready settlement intents.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#deded9] bg-white px-4 text-sm font-semibold text-[#6f686a] transition hover:border-[#b8b8b1] hover:text-[#181818]"
          >
            Return to dashboard
          </Link>
          <HeaderLink href="/api/proof-pack" label="Proof pack" />
        </div>
      </section>
    </main>
  );
}
