Bun.write(
  "test-config.json",
  JSON.stringify({
    accessTokens: {
      test: {
        channelAccessToken: "dummy",
        to: crypto.randomUUID(),
        messagePrefix: "TEST APP: ",
      },
    },
  })
);
console.log("Created test-config.json");
