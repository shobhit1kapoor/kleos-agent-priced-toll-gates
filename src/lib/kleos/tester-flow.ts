import { verifyCitationReceipt } from "./receipt-verifier";
import { runSponsoredTrial } from "./sponsored-trial";
import { createTesterAttestation } from "./traction";
import type { TesterAttestation } from "./types";

const DEFAULT_QUOTE =
  "I ran the Kleos settlement flow and could inspect the proof trail.";

export function runOneClickTesterFlow(input: {
  testerName?: string;
  testerRole?: TesterAttestation["testerRole"];
  quote?: string;
  walletOrContact?: string;
  liveUrl: string;
}) {
  const trial = runSponsoredTrial();
  const verification = verifyCitationReceipt();
  const citationReceipts = trial.citations.citationReceipts;
  const attestation = createTesterAttestation({
    testerName: input.testerName,
    testerRole: input.testerRole ?? "builder",
    scenarioRun: true,
    useful: true,
    quote: input.quote ?? DEFAULT_QUOTE,
    walletOrContact: input.walletOrContact,
    liveUrl: input.liveUrl,
  });

  return {
    name: "Kleos one-click tester flow",
    status: "issue-ready",
    summary:
      "The no-wallet settlement scenario ran, a receipt verification was produced, and a public GitHub issue URL is ready for the tester to submit.",
    trial: {
      mode: trial.trial.mode,
      buyerWallet: trial.trial.buyerWallet,
      budgetUsdc: trial.trial.budgetUsdc,
      citationBudgetUsdc: trial.trial.citationBudgetUsdc,
      sponsorPoolUsdc: trial.trial.sponsorPoolUsdc,
      sessionId: trial.research.session.id,
      answerHash: trial.citations.settlement.answerHash,
      citationReceipts: citationReceipts.map((receipt) => ({
        id: receipt.id,
        itemId: receipt.itemId,
        receiptHash: receipt.receiptHash,
        citationTollUsdc: receipt.citationTollUsdc,
        confidence: receipt.confidence,
      })),
      impactGrants: trial.impact.impactGrants.length,
    },
    verification: {
      status: verification.verification.status,
      proofHash: verification.verification.proofHash,
      warnings: verification.verification.checks
        .filter((check) => check.status !== "pass")
        .map((check) => check.label),
    },
    attestation: attestation.attestation,
    githubIssueUrl: attestation.attestation.githubIssueUrl,
    nextSteps: [
      "Open the GitHub issue URL.",
      "Review the prefilled tester attestation.",
      "Submit the issue publicly so /api/traction/github can count durable traction.",
    ],
  };
}
