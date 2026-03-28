import env from "../../config/env";
import InterswitchAuth from "./InterswitchAuth";
import axios from "axios";

/**
 * Interswitch Provider — Path C: API-First Integration (Pay Bill)
 *
 * Docs: https://docs.interswitchgroup.com/docs/quickstart-accept-your-first-payment-in-5-minutes
 *
 * Flow:
 *   1. POST /collections/api/v1/pay-bill  → get a paymentUrl
 *   2. Redirect buyer to paymentUrl
 *   3. Interswitch redirects buyer to our redirectUrl after payment
 *   4. We re-query transaction status to verify before locking escrow
 */

export interface PayBillResponse {
  id: number;
  merchantCode: string;
  payableCode: string;
  amount: number; // in kobo
  code: string; // '200' = link created successfully
  reference: string; // Interswitch's own reference
  paymentUrl: string;
  transactionReference: string;
  redirectUrl: string; // where Interswitch sends buyer after payment
  customerId: string;
  customerEmail: string;
  currencyCode: string;
}

export interface TransactionStatusResponse {
  responseCode: string; // '00' = payment successful
  responseDescription: string;
  transactionRef: string;
  transactionDate: string;
  paymentId: number;
  amount: number; // in kobo
  paymentReference?: string;
}

class InterswitchProvider {
  private readonly baseUrl: string;
  private readonly merchantCode: string;
  private readonly payableCode: string;
  private readonly redirectUrl: string;

  constructor() {
    this.baseUrl = env.INTERSWITCH_API_URL; // https://qa.interswitchng.com
    this.merchantCode = env.INTERSWITCH_MERCHANT_CODE;
    this.payableCode = env.INTERSWITCH_PAYABLE_CODE; // e.g. 9405967
    this.redirectUrl = env.INTERSWITCH_CALLBACK_URL;
  }

  public async createPaymentLink(
    amountKobo: number,
    customerEmail: string,
  ): Promise<PayBillResponse> {
    try {
      let transactionRef = `REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const token = await InterswitchAuth.getToken();
      const payload = {
        merchantCode: this.merchantCode,
        payableCode: this.payableCode,
        amount: String(amountKobo),
        redirectUrl: this.redirectUrl,
        customerId: customerEmail,
        transactionReference: transactionRef,
        currencyCode: "566",
        customerEmail,
      };

      const response = await axios.post(
        `${this.baseUrl}/paymentgateway/api/v1/paybill`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "accept": "application/json",
          },
        },
      );      

      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          `Interswitch pay-bill failed: ${response.status} — ${JSON.stringify(response.data)}`,
        );
      }

      const data: PayBillResponse = response.data;

      if (data.code !== "200") {
        throw new Error(
          `Interswitch pay-bill returned unexpected code: ${data.code}`,
        );
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // ─── Verify transaction status ───────────────────────────────────

  /**
   * Re-queries Interswitch to confirm a payment is genuine.
   * Always call this inside your webhook/redirect handler — never trust
   * the callback body alone.
   *
   * TODO: verify exact query endpoint and params against Interswitch transaction
   * search docs at https://docs.interswitchgroup.com/docs/transaction-search
   *
   * @param transactionRef  The `reference` returned by createPaymentLink
   * @param amountKobo      Expected amount — must match to guard against under-payment
   */
  public async verifyTransaction(
    transactionRef: string,
    amountKobo: number,
  ): Promise<TransactionStatusResponse> {
    const url = `${this.baseUrl}/collections/api/v1/gettransaction.json?merchantcode=${this.merchantCode}&transactionreference=${transactionRef}&amount=${amountKobo}`;

    const token = await InterswitchAuth.getToken();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Interswitch transaction verify failed: ${response.status} — ${text}`,
      );
    }

    const data = await response.json();    
    return {
      responseCode: data.ResponseCode ?? data.responseCode,
      responseDescription: data.ResponseDescription ?? data.responseDescription,
      transactionRef: data.TransactionReference ?? transactionRef,
      amount: data.Amount ?? amountKobo,
      transactionDate: data.TransactionDate,
      paymentId: data.PaymentId,
      paymentReference: data.PaymentReference,
    };
  }
}

export default new InterswitchProvider();
