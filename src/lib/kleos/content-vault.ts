import { createCipheriv, createHash, randomUUID } from "crypto";
import { createPaymentProof, isValidPaymentProof, makeHash } from "./charon";
import { KLEOS_AGENT_WALLET } from "./config";
import { findSourceRegistryRecord } from "./source-registry";
import { getContentItem } from "./store";

function keyFor(itemId: string) {
  return createHash("sha256").update(`kleos-vault:${itemId}`).digest();
}

function ivFor(itemId: string) {
  return createHash("sha256").update(`kleos-vault-iv:${itemId}`).digest().subarray(0, 12);
}

function encryptContent(itemId: string, plaintext: string) {
  const cipher = createCipheriv("aes-256-gcm", keyFor(itemId), ivFor(itemId));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: "AES-256-GCM",
    ciphertext: ciphertext.toString("base64"),
    iv: ivFor(itemId).toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function getEncryptedVaultItem(itemId: string, origin = "") {
  const item = getContentItem(itemId);
  if (!item) {
    return null;
  }

  const registryRecord = findSourceRegistryRecord(itemId);
  const encrypted = encryptContent(item.id, item.fullContent);
  const ciphertextHash = makeHash(`${encrypted.ciphertext}:${encrypted.authTag}`);

  return {
    vaultId: `vault_${item.id}`,
    itemId: item.id,
    title: item.title,
    preview: item.preview,
    sourceUrl: item.sourceUrl,
    registryRecord,
    encrypted,
    ciphertextHash,
    contentCid: registryRecord?.encryptedContentCid,
    keyRelease: {
      method: "x402-after-settlement",
      endpoint: `${origin}/api/vault/${item.id}/key`,
      paymentHeader: "PAYMENT-SIGNATURE",
      localDevelopmentFallback: createPaymentProof(item.id, KLEOS_AGENT_WALLET),
    },
  };
}

export function releaseVaultKey(input: {
  itemId: string;
  paymentSignature: string | null;
}) {
  const item = getContentItem(input.itemId);
  if (!item) {
    throw new Error("Unknown vault item.");
  }

  if (!isValidPaymentProof(input.paymentSignature, input.itemId)) {
    throw new Error("A valid x402 payment proof is required before plaintext key release.");
  }

  const key = keyFor(item.id).toString("base64");
  const releaseId = `keyrel_${randomUUID()}`;
  const releaseProof = makeHash(`${releaseId}:${item.id}:${input.paymentSignature}:${key}`);

  return {
    releaseId,
    itemId: item.id,
    title: item.title,
    algorithm: "AES-256-GCM",
    key,
    plaintextPreview: item.fullContent.slice(0, 360),
    releaseProof,
    policy:
      "Ciphertext can be public; the AES-GCM content key is released only after an x402 payment proof verifies.",
    createdAt: new Date().toISOString(),
  };
}
