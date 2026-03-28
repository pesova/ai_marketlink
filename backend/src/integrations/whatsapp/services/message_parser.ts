import { ParsedMessage } from "../../../interfaces/whatsapp_types";

export const parseIncomingMessage = (body: any): ParsedMessage | null => {
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return null;

  const from = message.from;
  const messageId = message.id;

  if (message.type === "text") {
    return {
      type: "text",
      from,
      text: message.text.body.trim(),
      messageId,
    };
  }

  if (message.type === "interactive") {
    const interactive = message.interactive;

    // Button reply
    if (interactive.type === "button_reply") {
      return {
        type: "interaction",
        from,
        interactionType: "button",
        interactionId: interactive.button_reply.id,
        messageId,
      };
    }

    // List reply
    if (interactive.type === "list_reply") {
      return {
        type: "interaction",
        from,
        interactionType: "list",
        interactionId: interactive.list_reply.id,
        messageId,
      };
    }
  }

  return null;
};
