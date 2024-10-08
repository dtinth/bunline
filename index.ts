const LINE_API_BASE = Bun.env["LINE_API_BASE"] || "https://api.line.me";

interface Config {
  accessTokens: Record<
    string,
    {
      channelAccessToken: string;
      to: string;
      messagePrefix?: string;
    }
  >;
}

interface CredentialsMapper {
  mapCredentials(accessToken: string): Config["accessTokens"][string] | null;
}

class JSONCredentialsMapper implements CredentialsMapper {
  accessMap: Map<string, Config["accessTokens"][string]>;
  constructor(config: Config) {
    this.accessMap = new Map(Object.entries(config.accessTokens));
  }
  mapCredentials(accessToken: string) {
    return this.accessMap.get(accessToken) || null;
  }
}

class ZeroConfigurationCredentialsMapper implements CredentialsMapper {
  mapCredentials(accessToken: string) {
    const [channelAccessToken, to] = accessToken.split("|");
    if (!channelAccessToken || !to) {
      return null;
    }
    return {
      channelAccessToken,
      to,
    };
  }
}

const { credentialsMapper } = await(
  async (): Promise<{
    credentialsMapper: CredentialsMapper;
  }> => {
    const configPath = Bun.env["CONFIG_PATH"] || "config.json";
    if (await Bun.file(configPath).exists()) {
      console.log(`Using configuration from "${configPath}"`);
      return {
        credentialsMapper: new JSONCredentialsMapper(
          await Bun.file(configPath).json()
        ),
      };
    }
    if (Bun.env["CONFIG_BASE64"]) {
      console.log(
        'Using configuration from "CONFIG_BASE64" environment variable'
      );
      const config = JSON.parse(
        Buffer.from(Bun.env["CONFIG_BASE64"], "base64").toString("utf-8")
      );
      return {
        credentialsMapper: new JSONCredentialsMapper(config),
      };
    }
    console.log(
      `Using zero-configuration mode as no configuration was found either at "${configPath}" or in the "CONFIG_BASE64" environment variable.`
    );
    return {
      credentialsMapper: new ZeroConfigurationCredentialsMapper(),
    };
  }
)();

const server = Bun.serve({
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
      const tokenConfig = credentialsMapper.mapCredentials(accessToken);

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

      const imageThumbnail = formData.get("imageThumbnail");
      const imageFullsize = formData.get("imageFullsize");
      const imageFile = formData.get("imageFile") as File | null;
      const stickerPackageId = formData.get("stickerPackageId");
      const stickerId = formData.get("stickerId");
      const notificationDisabled =
        formData.get("notificationDisabled") === "true";
      const prefix = tokenConfig.messagePrefix || "";

      const messages: any[] = [
        { type: "text", text: prefix + message.toString() },
      ];

      if (imageFile) {
        return new Response(
          JSON.stringify({
            status: 500,
            message: "Image upload has not been implemeted yet",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (imageThumbnail && imageFullsize) {
        messages.push({
          type: "image",
          originalContentUrl: imageFullsize.toString(),
          previewImageUrl: imageThumbnail.toString(),
        });
      }

      if (stickerPackageId && stickerId) {
        messages.push({
          type: "sticker",
          packageId: stickerPackageId.toString(),
          stickerId: stickerId.toString(),
        });
      }

      const messagingApiBody: any = {
        to: tokenConfig.to,
        messages: messages,
      };

      if (notificationDisabled) {
        messagingApiBody.notificationDisabled = true;
      }

      // Send message to Messaging API
      const messagingApiResponse = await fetch(
        `${LINE_API_BASE}/v2/bot/message/push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenConfig.channelAccessToken}`,
          },
          body: JSON.stringify(messagingApiBody),
        }
      );

      if (messagingApiResponse.ok) {
        const rateLimitHeaders = {
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": "1000",
          "X-RateLimit-Reset": `${Math.floor(Date.now() / 1000) + 60}`,
        };

        return new Response(JSON.stringify({ status: 200, message: "ok" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...rateLimitHeaders,
          },
        });
      } else {
        console.error(`Unable to send message: ${messagingApiResponse.status}`);
        console.error(await messagingApiResponse.text());
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

console.log(`Server started on port ${server.port}.`);
