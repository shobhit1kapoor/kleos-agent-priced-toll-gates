import { createHash } from "crypto";
import { getStore } from "./store";

type VerificationInput = {
  creatorName: string;
  wallet: string;
  publisherUrl: string;
  feedUrl?: string;
  proofUrl?: string;
  proofText?: string;
  method?: "well-known" | "feed-proof" | "manual-proof";
};

function digest(seed: string) {
  return `0x${createHash("sha256").update(seed).digest("hex")}`;
}

function normalizeUrl(value: string) {
  return new URL(value).toString();
}

function challengeFor(input: Pick<VerificationInput, "creatorName" | "wallet" | "publisherUrl">) {
  const host = new URL(input.publisherUrl).hostname.toLowerCase();
  return `kleos-verify:${host}:${input.wallet.toLowerCase()}:${digest(input.creatorName).slice(2, 14)}`;
}

async function fetchProof(proofUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(proofUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        Accept: "text/plain, application/json, application/xml, text/xml, */*;q=0.1",
        "User-Agent": "Kleos-Publisher-Verifier/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`Proof URL returned ${response.status}.`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export function getPublisherVerificationSnapshot() {
  const store = getStore();

  return {
    name: "Kleos Publisher Ownership Verifier",
    protocol: "kleos.publisher.verify.v1",
    instructions:
      "Publish the challenge in /.well-known/kleos.json, a feed item, or a signed proof note. Kleos verifies the exact challenge before marking a publisher wallet as source owner.",
    records: store.publisherVerifications,
    totals: {
      issued: store.publisherVerifications.length,
      verified: store.publisherVerifications.filter((entry) => entry.status === "verified").length,
      failed: store.publisherVerifications.filter((entry) => entry.status === "failed").length,
    },
  };
}

export async function verifyPublisherOwnership(input: VerificationInput) {
  const publisherUrl = normalizeUrl(input.publisherUrl);
  const proofUrl =
    input.proofUrl?.trim() ||
    new URL("/.well-known/kleos.json", publisherUrl).toString();
  const feedUrl = input.feedUrl ? normalizeUrl(input.feedUrl) : undefined;
  const challenge = challengeFor({ ...input, publisherUrl });
  const method = input.method ?? "well-known";
  let proofText = input.proofText?.trim() ?? "";

  if (!proofText && input.proofUrl) {
    proofText = await fetchProof(proofUrl);
  }

  const verified = proofText.includes(challenge);
  const store = getStore();
  const creator =
    store.creators.find(
      (entry) =>
        entry.wallet.toLowerCase() === input.wallet.toLowerCase() ||
        entry.displayName.toLowerCase() === input.creatorName.toLowerCase(),
    ) ??
    store.creators[0];

  const record = {
    id: `pv_${Date.now().toString(36)}_${digest(`${publisherUrl}:${input.wallet}:${proofText}`).slice(2, 8)}`,
    creatorId: creator.id,
    creatorName: input.creatorName.trim(),
    wallet: input.wallet.trim(),
    publisherUrl,
    feedUrl,
    method,
    challenge,
    proofUrl,
    proofDigest: digest(`${challenge}:${proofText || "missing"}`),
    status: verified ? ("verified" as const) : ("challenge_issued" as const),
    checkedAt: proofText ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  store.publisherVerifications.unshift(record);

  return {
    record,
    verified,
    nextStep: verified
      ? "Publisher ownership verified. New sources from this publisher can be marked owner-verified."
      : `Publish this challenge at ${proofUrl}: ${challenge}`,
  };
}
