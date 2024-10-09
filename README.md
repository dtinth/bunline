# bunline

bunline is a reimplementation of LINE Notify API (which has been [deprecated](https://notify-bot.line.me/closing-announce) and set to sunset on March 31, 2025) on top of LINE’s Messaging API using the Bun JavaScript runtime. This project aims to be a drop-in replacement for the LINE Notify API and provide a seamless transition for users from LINE Notify to the LINE Messaging API.

## Features

- Mimics the LINE Notify API endpoint for easy migration
- Supports sending text messages, images, and stickers
- Configurable through a JSON file (also supports zero-configuration mode)
- Uses the LINE Messaging API as the backend

## Prerequisites

- [Bun](https://bun.sh) runtime
- LINE Messaging API channel
- Channel Access Token
- User ID or Group ID for message recipients

For detailed instructions on obtaining the Channel Access Token and User/Group ID, refer to this [LINE Notify Migration Tips article](https://medium.com/linedevth/line-notify-migration-tips-0432e5f7af6e) (Thai language).

## Setup

There are 3 ways to provide configuration to bunline.

<!-- prettier-ignore -->
| Method | Description |
| --- | --- |
| Configuration file | Configuration is stored in `config.json`. |
| Environment variable | Configuration is encoded as a base64 string and passed as the `CONFIG_BASE64` environment variable. |
| Zero-configuration | No configuration needed. |

- **With configuration,** bunline will only accept the configured access tokens. The configuration provides a mapping from LINE Notify access tokens to corresponding LINE Messaging API parameters (channel access token and recipient ID). If you already use LINE Notify, you can keep using the same access token and you only have to change the endpoint URL.
- **Without configuration,** bunline will expect the LINE Notify access token to be in this format: `<channel-access-token>|<user-id-or-group-id>`. You will need to update both the endpoint URL and the access token when migrating from LINE Notify.

### Configure using configuration file

Create a `config.json` file with the following structure:

```json
{
  "accessTokens": {
    "<your-access-token>": {
      "channelAccessToken": "<your-channel-access-token>",
      "to": "<user-id-or-group-id>"
    }
  }
}
```

### Configure using environment variable

1. Create a configuration file per above
2. Encode the configuration file as a base64 string: `base64 -w 0 config.json`
3. Set the `CONFIG_BASE64` environment variable with the base64 string

### Zero-configuration

If you don't want to use a configuration file, you can just start the server without any configuration. In this mode, bunline will be a simple adapter. It will expect an access token to be in the format `<channel-access-token>|<user-id-or-group-id>` and it will pass them on directly to the LINE Messaging API.

## Usage with prebuilt Docker image

To run the server using Docker (with a configuration file):

```sh
docker run -ti --rm -v $PWD/config.json:/app/config.json --init -p 3717:3717 ghcr.io/dtinth/bunline:main
```

To run the server using Docker (without a configuration file):

```sh
docker run -ti --rm --init -p 3717:3717 ghcr.io/dtinth/bunline:main
```

## Usage with local clone

Run the server:

```sh
bun start
```

The server will start on port 3717 by default. You can change the port by setting the `PORT` environment variable.

## Migration from LINE Notify

To migrate from LINE Notify to this solution:

1. Create a LINE Official Account and link it to the LINE Messaging API.
2. Generate a Channel Access Token.
3. Find the User ID or Group ID for message recipients. Refer to [LINE Notify Migration Tips article](https://medium.com/linedevth/line-notify-migration-tips-0432e5f7af6e) for more information.
4. Update your existing code to use the new endpoint.

## Environment Variables

- `PORT`: Set the server port (default: 3717)
- `CONFIG_PATH`: Set the path to the configuration file (default: config.json)
- `LINE_API_BASE`: Set the LINE API base URL (default: https://api.line.me)

## Limitations

- Image file uploads via the `imageFile` parameter are not supported
- This is a basic implementation and may not cover all LINE Notify features

## Running tests

bunline includes end-to-end tests to ensure its functionality. These tests are defined in the `e2e.test.ts` file and can be run locally or as part of the CI/CD pipeline.

To run the tests locally:

1. Ensure you have Bun installed on your system.

2. Create a test configuration file:

   ```sh
   bun scripts/create-test-config.ts
   ```

3. Run bunline, pointing to the [mock LINE API server](https://mockapis.onrender.com/swagger#tag/line):

   ```sh
   env LINE_API_BASE=https://mockapis.onrender.com/line CONFIG_PATH=test-config.json bun start
   ```

4. In a separate terminal, run the tests: `bun test`
