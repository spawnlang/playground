# Spawn Playground: Run, Edit, Share V Code Online

The [Spawn Playground](https://play.spawnlang.dev) is a place where you can 
run, edit and share Spawn code online.

![](./docs/images/cover.png)

## Features

- Nice and clean UI
- Powerful editor with syntax highlighting and auto-completion
- Ability to [run code as tests](https://docs.spawnlang.dev/tools/playground.html#test)
- Ability to [see generated C code](https://docs.spawnlang.dev/tools/playground.html#show-generated-c-code)
  for passed V code
- Pass [flags](https://docs.spawnlang.dev/tools/playground.html#pass-arguments-to-compiler) to V
  compiler and binary
- [Shareable](https://docs.spawnlang.dev/tools/playground.html#share-code) code and editor state
  via URL or local storage

## Developing

First, clone the repository:

```bash
git clone https://github.com/spawnlang/playground
cd playground
```

Install Spawn dependencies:

```bash
npm run install-server-deps
```

### Quick, containerized local development (recommended)

#### Using Docker Compose

```bash
npm run run-docker
```

then access the playground at <http://localhost:5555>

### Run the playground locally

```bash
npm run local-serve
```

then access the playground at <http://localhost:5555>

### Run the playground locally inside isolate (as on play.spawnlang.dev)

> NOTE: Only works on Linux, since it uses `isolate`.

#### Install Dependencies

> We use isolate to sandbox the playground, so you need to install it first.

```bash
git clone https://github.com/ioi/isolate /tmp/isolate
cd /tmp/isolate
make isolate isolate-check-environment
make install
```

#### Run the server

```bash
npm run serve
```

then access the playground at <http://localhost:5555>

## Server API

See [server/README.md](./server/README.md) for more information about the server API.

## License

This project is under the **MIT License**.
See the
[LICENSE](https://github.com/spawnlang/playground/blob/main/LICENSE)
file for the full license text.
