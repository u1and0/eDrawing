# Usage:
#
# ```
# $ docker run -d -v /mnt/z/data:/work/data --rm u1and0/eDrawing
# ```
#
# Access `http://localhost:3000/index` on browser

FROM denoland/deno:alpine
# Build packages, environment
# deno install
RUN apk update --no-cache && apk add --upgrade --no-cache curl npm &&\
    npm install -g typescript ts-node ts-node-dev

USER deno
WORKDIR /app

# Server side
COPY ./mod /app/mod
RUN deno cache mod/*.ts
COPY ./index.ts /app/index.ts
RUN deno cache index.ts

# Client side
COPY ./templates /app/templates
# COPY ./Makefile .
RUN npx tsc -p static || exit 0  # Ignore TypeScript build error
COPY ./static /app/static

# Run
CMD [ "run", "--allow-write", "--allow-read", "--allow-net", "index.ts"]
LABEL maintainer="u1and0 <e01.ando60@gmail.com>"\
      description="Run eDrawing web service"
