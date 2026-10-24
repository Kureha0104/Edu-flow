export type SmsResult = {
  status: "sent" | "sent_dummy" | "failed";
  providerId?: string;
  error?: string;
};

const twilioConfig = () => ({
  sid: process.env.TWILIO_ACCOUNT_SID,
  token: process.env.TWILIO_AUTH_TOKEN,
  from: process.env.TWILIO_FROM,
});

export const smsInfo = () => {
  const { sid, token, from } = twilioConfig();
  const configured = Boolean(sid && token && from);

  return {
    provider:
      process.env.SMS_PROVIDER === "twilio" || configured
        ? "twilio"
        : "dummy",
    configured,
  };
};

/**
 * Sends a parent SMS through Twilio when configured. Without credentials the
 * message is recorded as a dummy delivery so the rest of the workflow works.
 */
export const sendParentSms = async (
  to: string,
  message: string,
): Promise<SmsResult> => {
  const { sid, token, from } = twilioConfig();
  const provider = process.env.SMS_PROVIDER ?? (sid && token && from ? "twilio" : "dummy");

  if (provider !== "twilio") {
    return { status: "sent_dummy", providerId: "demo" };
  }

  if (!sid || !token || !from) {
    return {
      status: "failed",
      error: "Twilio is selected but TWILIO_ACCOUNT_SID/TOKEN/FROM are missing.",
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: message,
        }).toString(),
      },
    );

    const data = (await response.json()) as {
      sid?: string;
      status?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        status: "failed",
        error: data.message ?? `Twilio returned ${response.status}`,
      };
    }

    return { status: "sent", providerId: data.sid };
  } catch (cause) {
    return {
      status: "failed",
      error: cause instanceof Error ? cause.message : "SMS request failed.",
    };
  }
};
