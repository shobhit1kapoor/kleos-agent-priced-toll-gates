import {
  createCharonChallenge,
  isValidPaymentProof,
  recordUnpaidChallenge,
  settlePayment,
} from "@/lib/kleos/charon";
import {
  buildPaymentRequiredPayload,
  isLocalPaymentProof,
  verifyAndSettleGatewayPayment,
} from "@/lib/kleos/gateway-x402";
import { publicOriginFromRequest } from "@/lib/kleos/request-origin";
import { getCatalogItems, getContentItem } from "@/lib/kleos/store";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/content/[id]">) {
  const { id } = await ctx.params;
  const item = getContentItem(id);

  if (!item) {
    return Response.json({ error: "Unknown Kleos content item." }, { status: 404 });
  }

  const signature = request.headers.get("PAYMENT-SIGNATURE");
  const sessionId = request.headers.get("KLEOS-SESSION-ID") ?? "direct_browser";
  const localPayment = isValidPaymentProof(signature, id);
  const livePayment =
    signature && !isLocalPaymentProof(signature)
      ? await verifyAndSettleGatewayPayment({
          paymentSignature: signature,
          priceUsdc: item.currentPriceUsdc,
        })
      : null;

  if (!localPayment && (!livePayment || !livePayment.ok)) {
    recordUnpaidChallenge(id, sessionId);
    const origin = publicOriginFromRequest(request);
    const challenge = createCharonChallenge(id, origin);
    const paymentRequired = buildPaymentRequiredPayload({
      url: `${origin}/api/content/${id}`,
      title: item.title,
      priceUsdc: item.currentPriceUsdc,
    });
    const encodedChallenge = Buffer.from(JSON.stringify(paymentRequired)).toString("base64");

    return Response.json(
      {
        error: "Payment required by Charon Gateway.",
        reason: livePayment && !livePayment.ok ? livePayment.reason : undefined,
        challenge,
        x402: paymentRequired,
      },
      {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": encodedChallenge,
          "X-KLEOS-PAYMENT-REQUIRED-JSON": JSON.stringify(paymentRequired),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { payment, payoutSplits } = settlePayment({
    itemId: id,
    sessionId,
    paymentSignature: signature ?? "kleos-payment-proof:direct",
    settlementStatus: livePayment?.ok ? "settled" : "batched",
    gatewayTransferId: livePayment?.ok && livePayment.transaction ? livePayment.transaction : undefined,
    explorerUrl:
      livePayment?.ok && livePayment.transaction
        ? `https://testnet.arcscan.app/tx/${livePayment.transaction}`
        : undefined,
    payer: livePayment?.ok ? livePayment.payer : undefined,
    liveGatewayTx: livePayment?.ok ? livePayment.transaction : undefined,
  });
  const catalogItem = getCatalogItems().find((entry) => entry.id === id);

  return Response.json(
    {
      item: {
        id: item.id,
        title: item.title,
        sourceUrl: item.sourceUrl,
        fullContent: item.fullContent,
        collaborators: catalogItem?.collaborators ?? [],
      },
      payment,
      payoutSplits,
    },
    {
      headers: {
        "PAYMENT-RESPONSE": JSON.stringify({
          verified: true,
          mode: livePayment?.ok ? "circle-gateway" : "local-development-proof",
          gatewayTransferId: payment.gatewayTransferId,
          settlementStatus: payment.settlementStatus,
        }),
        "X-KLEOS-PAYMENT-RESPONSE":
          livePayment?.ok && livePayment.responseHeader ? livePayment.responseHeader : "",
        "Cache-Control": "no-store",
      },
    },
  );
}
