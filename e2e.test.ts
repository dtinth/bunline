import { expect, test } from "bun:test";
import { accessTokens } from "./test-config.json";

test("smoke", async () => {
  const formData = new FormData();
  const message = "test-" + crypto.randomUUID();
  formData.set("message", message);
  formData.set("stickerPackageId", "446");
  formData.set("stickerId", "1992");
  const response = await fetch("http://localhost:3717/api/notify", {
    method: "POST",
    headers: {
      Authorization: "Bearer test",
    },
    body: formData,
  });
  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.status).toBe(200);
  expect(json.message).toBe("ok");

  const uid = accessTokens.test.to;
  const history = await (
    await fetch("https://mockapis.onrender.com/line/_test/messages?uid=" + uid)
  ).json();
  expect(history).toEqual(
    expect.arrayContaining([
      expect.arrayContaining([
        expect.objectContaining({
          message: { type: "text", text: `TEST APP: ${message}` },
        }),
        expect.objectContaining({
          message: { type: "sticker", packageId: "446", stickerId: "1992" },
        }),
      ]),
    ])
  );
});
