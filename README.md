# bunline

bunline is a reimplementation of LINE Notify API (which has been [deprecated](https://notify-bot.line.me/closing-announce) and set to sunset on March 31, 2025) on top of LINE’s Messaging API using the Bun JavaScript runtime. This project aims to be a drop-in replacement for the LINE Notify API and provide a seamless transition for users from LINE Notify to the LINE Messaging API.

## Features

- Mimics the LINE Notify API endpoint for easy migration
- Supports sending text messages, images, and stickers
- Configurable through a JSON file
- Uses the LINE Messaging API as the backend

## Prerequisites

- [Bun](https://bun.sh) runtime
- LINE Messaging API channel
- Channel Access Token
- User ID or Group ID for message recipients

For detailed instructions on obtaining the Channel Access Token and User/Group ID, refer to this [LINE Notify Migration Tips article](https://medium.com/linedevth/line-notify-migration-tips-0432e5f7af6e) (Thai language).

## Setup

Create a `config.json` file in the project root with the following structure:

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

## Usage with prebuilt Docker image

To run the server using Docker:

```sh
docker run -ti --rm -v $PWD/config.json:/app/config.json --init -p 3717:3717 ghcr.io/dtinth/bunline:main
```

Instead of using the `config.json` file, you can also encode `config.json` as a base64 string and pass it as the `CONFIG_BASE64` environment variable.

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
