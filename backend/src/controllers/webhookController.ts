import { Request, Response } from 'express';
import { TransactionWebhookPayload, WebhookTransactionEvent } from '../interfaces/IWebhook';
import { EscrowService } from '../services';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    let requestBody: TransactionWebhookPayload = req.body
    res.sendStatus(200);
    if (requestBody.event ==  WebhookTransactionEvent.COMPLETED) {
      await EscrowService.finalizeEscrow(requestBody.uuid, requestBody.data.paymentReference);
    }

  } catch (error) {
    console.error('Error processing raw webhook:', error);
    // Still respond 200 to avoid retries per Interswitch spec.
    res.sendStatus(200);
  }
};
