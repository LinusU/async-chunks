import { Readable } from 'stream'

const kState = Symbol('state')

type ActiveState = { kind: 'active', stream: Readable }
type ErroredState = { kind: 'errored', error: Error }
type EndedState = { kind: 'ended' }

type Chunk = string | Buffer
type State = ActiveState | ErroredState | EndedState

function waitForChunk (stream: Readable) {
  return new Promise((resolve, reject) => {
    let cleanup: () => void

    const onError = (err) => { cleanup(); reject(err) }
    const onReadable = () => { cleanup(); resolve() }
    const onEnd = () => { cleanup(); resolve() }

    cleanup = () => {
      stream.removeListener('error', onError)
      stream.removeListener('readable', onReadable)
      stream.removeListener('end', onEnd)
    }

    stream.addListener('error', onError)
    stream.addListener('readable', onReadable)
    stream.addListener('end', onEnd)
  })
}

class ChunkIterator implements AsyncIterableIterator<Chunk> {
  [kState]: State

  constructor (stream: Readable) {
    this[kState] = { kind: 'active', stream }

    stream.once('error', (error) => {
      this[kState] = { kind: 'errored', error }
    })

    stream.once('end', () => {
      this[kState] = { kind: 'ended' }
    })
  }

  next (value?: any): Promise<IteratorResult<Chunk>> {
    const state = this[kState]

    if (state.kind === 'ended') {
      return Promise.resolve({ done: true, value: null })
    }

    if (state.kind === 'errored') {
      return Promise.reject(state.error)
    }

    const data = state.stream.read()

    if (data === null) {
      return waitForChunk(state.stream).then(() => this.next())
    }

    return Promise.resolve({ done: false, value: data })
  }

  [Symbol.asyncIterator] (): this {
    return this
  }
}

export = function asyncChunks (stream: Readable) {
  return new ChunkIterator(stream) as AsyncIterableIterator<Chunk>
}
