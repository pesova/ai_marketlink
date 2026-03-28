export interface WhatsAppListParams {
  to: string;
  header: string;
  body: string;
  buttonText: string;
  sections: {
    title: string;
    rows: {
      id: string;
      title: string;
      description?: string;
    }[];
  }[];
}

export interface WhatsAppButtonParams {
  to: string;
  text: string;
  buttons: { id: string; title: string }[];
}

export type ParsedMessage =
  | {
      type: "text";
      from: string;
      text: string;
      messageId: string;
    }
  | {
      type: "interaction";
      from: string;
      interactionId: string;
      interactionType: "button" | "list";
      messageId: string;
    };
