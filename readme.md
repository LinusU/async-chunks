# Async Chunks

Get an async iterator over chunks in a stream.

## Installation

```sh
npm install --save async-chunks
```

## Usage

```js
const fs = require('fs')
const asyncChunks = require('async-chunks')

// Print current file to stdout
const stream = fs.createReadStream(__filename)

for await (const chunk of asyncChunks(stream)) {
  process.stdout.write(chunk)
}
```

## API

### `asyncChunks(stream: Readable) => AsyncIterableIterator<string | Buffer>`

Returns a new async iterator that iterates over all the chunks in the stream.
