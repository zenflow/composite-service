import { PassThrough } from 'stream'
import { once } from 'events'
import { filterBlankLastLine } from '../../../../src/util/stream'

describe('core/util/stream', () => {
  it('filterBlankLastChunk', async () => {
    const inputStream = new PassThrough({ objectMode: true })
    const outputStream = inputStream.pipe(filterBlankLastLine(''))

    const outputChunks: string[] = []
    outputStream.on('data', chunk => outputChunks.push(chunk))

    inputStream.write('foo')
    expect(outputChunks).toStrictEqual(['foo'])
    inputStream.write('')
    expect(outputChunks).toStrictEqual(['foo'])
    inputStream.write('bar')
    expect(outputChunks).toStrictEqual(['foo', '', 'bar'])
    inputStream.write('')
    inputStream.end()
    await once(outputStream, 'end')
    expect(outputChunks).toStrictEqual(['foo', '', 'bar'])
  })
})
