const config = (await Bun.file("config.json").json()) as {
  accessTokens: Record<
    string,
    {
      channelAccessToken: string;
      to: string;
      messagePrefix?: string;
    }
  >;
};

const accessMap = new Map<string, (typeof config.accessTokens)[string]>(
  Object.entries(config.accessTokens)
);

Bun.serve({
  port: +Bun.env["PORT"]! || 3717,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/notify") {
      if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ status: 401, message: "Invalid access token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const accessToken = authHeader.split(" ")[1];
      const tokenConfig = accessMap.get(accessToken);

      if (!tokenConfig) {
        return new Response(
          JSON.stringify({ status: 401, message: "Invalid access token" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const formData = await request.formData();
      const message = formData.get("message");

      if (!message) {
        return new Response(
          JSON.stringify({ status: 400, message: "Message is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Send message to Messaging API
      const messagingApiResponse = await fetch(
        "https://api.line.me/v2/bot/message/push",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenConfig.channelAccessToken}`,
          },
          body: JSON.stringify({
            to: tokenConfig.to,
            messages: [{ type: "text", text: message.toString() }],
          }),
        }
      );

      if (messagingApiResponse.ok) {
        return new Response(JSON.stringify({ status: 200, message: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
        return new Response(
          JSON.stringify({ status: 500, message: "Failed to send message" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});
