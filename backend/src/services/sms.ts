import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn(
      "SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in .env"
    );
    return null;
  }

  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

export async function sendSMS(to: string, message: string): Promise<void> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromNumber) {
    console.log(`[SMS] To: ${to}, Message: ${message}`);
    return;
  }

  try {
    await client.messages.create({
      from: fromNumber,
      to,
      body: message,
    });
    console.log(`SMS sent to ${to}`);
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}
