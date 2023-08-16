// Generates a WAV audio file that consists solely of a tick at each beat where
// the timestamp of each beat is given by a Spotify audio analysis file. See
// ./README.md for details.
//

import fsPromises from 'fs/promises';

function assert(pred, msg) {
  if (!pred) {
    throw new Error('Assert failed: ' + msg);
  }
}

// WAV file parser & serializer
//

function ensureString(buffer, value, index) {
  const actual = buffer.toString('utf8', index, index + value.length);
  assert(value === actual, 'Unexpected value: ' + JSON.stringify({
    expected: value,
    actual,
  }));
  return actual;
}

function ensureUInt16LE(buffer, value, index) {
  const actual = buffer.readUInt16LE(index);
  assert(value === actual, 'Unexpected value: ' + JSON.stringify({
    expected: value,
    actual,
  }));
  return actual;
}

function ensureUInt32LE(buffer, value, index) {
  const actual = buffer.readUInt32LE(index);
  assert(value === actual, 'Unexpected value: ' + JSON.stringify({
    expected: value,
    actual,
  }));
  return actual;
}

function parseWav(buffer) {
  const chunkId = ensureString(buffer, 'RIFF', 0);
  const chunkSize = buffer.readUInt32LE(4);
  const format = ensureString(buffer, 'WAVE', 8);
  const subchunk1Id = ensureString(buffer, 'fmt ', 12);
  const subchunk1Size = ensureUInt32LE(buffer, 16, 16); // 16 for PCM
  const audioFormat = ensureUInt16LE(buffer, 1, 20); // 1 for PCM
  const numChannels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const byteRate = buffer.readUInt32LE(28);
  const blockAlign = buffer.readUInt16LE(32);
  const bitsPerSample = buffer.readUInt16LE(34);
  const subchunk2Id = ensureString(buffer, 'data', 36);
  const subchunk2Size = buffer.readUInt32LE(40);
  const data = buffer.slice(44);

  return {
    chunkId,
    chunkSize,
    format,
    subchunk1Id,
    subchunk1Size,
    audioFormat,
    numChannels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    subchunk2Id,
    subchunk2Size,
    data,
  };
}

function serializeWav({
  numChannels,
  sampleRate,
  byteRate,
  blockAlign,
  bitsPerSample,
  data,
}) {
  const fileSize = 44 + data.length;  

  const buffer = new Buffer.alloc(fileSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // 16 for PCM
  buffer.writeUInt16LE(1, 20); // 1 for PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(data.length, 40);
  data.copy(buffer, 44, 0);

  return buffer;
}

// Utility for generating a WAV file that plays a sound at specific timestamps.
//

class WavTickBuilder {
  constructor(wav, tick) {
    this._wav = wav;
    this._tick = tick;
    this._pieces = [];
    this._lengthBytes = 0;
    
    this._bytesPerSample = this._wav.blockAlign;
    this._samplesPerSecond = this._wav.sampleRate;
  }

  get _lengthSamples() {
    return this._lengthBytes / this._bytesPerSample;
  }

  _makeSilence(lengthSamples) {
    return Buffer.alloc(lengthSamples * this._bytesPerSample);
  }

  addTickAt(seconds) {
    const sampleOffset = (seconds * this._samplesPerSecond) | 0;
    const gapSamples = sampleOffset - this._lengthSamples;
    assert(gapSamples >= 0, 'Cannot add a tick in the past');

    const silence = this._makeSilence(gapSamples);
    this._pieces.push(silence);
    this._pieces.push(this._tick);
    this._lengthBytes += silence.length + this._tick.length;
  }

  getWav() {
    return serializeWav({
      ...this._wav,
      data: Buffer.concat(this._pieces),
    });
  }
}

// main
//

async function main(args) {
  if (args.length !== 2) {
    console.log('Usage: node main.js <spotify-analysis.json> <beat-output.wav>');
    return;
  }

  const [spotifyAnalysisPath, beatOutputPath] = args;

  const content = await fsPromises.readFile(spotifyAnalysisPath, { encoding: 'utf8' });
  const spotifyAnalysis = JSON.parse(content);
  const beats = spotifyAnalysis.beats;

  const tickBuffer = await fsPromises.readFile('./metronome-tick.wav');
  const tickWav = parseWav(tickBuffer);

  const builder = new WavTickBuilder(tickWav, tickWav.data);
  for (const beat of beats) {
    builder.addTickAt(beat.start);
  }

  await fsPromises.writeFile(beatOutputPath, builder.getWav());

  console.log('Wrote ' + beats.length + ' beats to ' + beatOutputPath);
}

main(process.argv.slice(2));
