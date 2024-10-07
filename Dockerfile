FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb /app/
COPY index.ts /app/
ENTRYPOINT [ "bun", "start" ]