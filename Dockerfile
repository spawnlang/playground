FROM spawnlang/vlang:1.0.0 AS playground-build

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y clang npm libpcre2-dev libsqlite3-dev libatomic1 && apt-get purge -y --auto-remove \
    && apt-get clean && rm -rf /var/cache/apt/archives/* && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man /usr/share/locale /usr/share/zoneinfo

ADD ./ /playground

WORKDIR /playground

RUN npm run build-ts && npm run mkdir-bin

WORKDIR /playground/server

RUN v install

RUN v -cc clang -prod -d no_segfault_handler -cflags '-flto' -skip-unused -o ./bin/server .

WORKDIR /playground

RUN rm -rf ./www/node_modules

FROM spawnlang/spawn:latest

ENV DEBIAN_FRONTEND=noninteractive

# NOTE: `curl` package is needed for healthcheck, for example, from Docker Compose.
RUN apt-get update && apt-get install -y --no-install-recommends curl gcc libpcre2-dev libsqlite3-dev libatomic1 firejail \
    && apt-get purge -y --auto-remove && apt-get clean && rm -rf /var/cache/apt/archives/* \
    && rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man /usr/share/locale /usr/share/zoneinfo

COPY --from=playground-build /playground/server/bin/server /playground/server
COPY --from=playground-build /playground/www /playground/www

WORKDIR /playground

RUN mkdir storage
RUN firecfg

EXPOSE 5555
STOPSIGNAL SIGTERM

ENTRYPOINT [ "./server" ]
