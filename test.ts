import assert = require('assert')
import fs = require('fs')

import asyncChunks = require('./')

async function test () {
  {
    const chunks = []
    const expected = fs.readFileSync(__filename).toString()

    for await (const chunk of asyncChunks(fs.createReadStream(__filename, { highWaterMark: 8 }))) {
      chunks.push(chunk)
    }

    assert.strictEqual(Buffer.concat(chunks).toString(), expected)
  }

  {
    let error = null

    try {
      for await (const chunk of asyncChunks(fs.createReadStream(__filename + 'nope'))) {}
    } catch (err) {
      error = err
    }

    assert.ok(error, 'An error should have been thrown')
    assert.strictEqual(error.code, 'ENOENT')
  }

  {
    let error = null
    const iterator = asyncChunks(fs.createReadStream(__filename + 'nope'))

    await new Promise((resolve) => setTimeout(resolve, 220))

    try {
      for await (const chunk of iterator) {}
    } catch (err) {
      error = err
    }

    assert.ok(error, 'An error should have been thrown')
    assert.strictEqual(error.code, 'ENOENT')
  }
}

test().catch((err) => {
  process.exitCode = 1
  console.error(err.stack)
})
