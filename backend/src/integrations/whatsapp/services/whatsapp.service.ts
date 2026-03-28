import axios from 'axios';
import env from '../../../config/env';
import { WhatsAppButtonParams, WhatsAppListParams } from '../../../interfaces/whatsapp_types';

const BASE_URL = `https://graph.facebook.com/v22.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export async function sendTextMessage(to: string, message: string) {    
    try {
        const res = await axios.post(
          BASE_URL,
          {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          },
          {
            headers: {
              Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
    } catch (error: any) {      
        console.log(error.response?.data);
        
    }
}

export async function sendTemplateMessage(to: string, message: string) {    
    try {
        const res = await axios.post(
          BASE_URL,
          {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: { name: "hello_world", language: { code: "en_US" } },
          },
          {
            headers: {
              Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        
    } catch (error: any) {
        console.log(error.response?.data);   
    }
}

export const sendWhatsAppButtons = async ({
  to,
  text,
  buttons
}: WhatsAppButtonParams) => {
  await axios.post(
    `https://graph.facebook.com/v22.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
};


export async function sendTypingIndicator(to: string, messageId: string) {
  try {
    await axios.post(
      `https://graph.facebook.com/v22.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: {
          type: "text",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 10000,
      }
    );
    
  } catch (error: any) {
    if (error.code === "ETIMEDOUT") {
      console.warn("Typing indicator timeout — skipping...");
      return;
    }

    console.log(error.response?.data || error.message);
  }
}

export const sendWhatsAppList = async ({
  to,
  header,
  body,
  buttonText,
  sections,
}: WhatsAppListParams) => {
  await axios.post(
    `https://graph.facebook.com/v22.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: header,
        },
        body: {
          text: body,
        },
        action: {
          button: buttonText,
          sections,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
};

export async function sendRegistrationFlow(to: string) {
  await axios.post(
    BASE_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "flow",
        header: {
          type: "text",
          text: "📝 Complete Registration",
        },
        body: {
          text: "Please complete your registration to continue.",
        },
        footer: {
          text: "Dexfiat",
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_cta: "Start",
            flow_id:  1// env.WHATSAPP_REGISTRATION_FLOW_ID,
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}
