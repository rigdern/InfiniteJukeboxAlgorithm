// This file contains code derived from EternalJukebox (https://github.com/UnderMybrella/EternalJukebox/).
// Copyright 2021 UnderMybrella
// See the LICENSE file for the full MIT license terms.

function assert(pred, msg) {
  if (!pred) {
    throw new Error('Assert failed: ' + msg);
  }
}

function pp(x) {
  return JSON.stringify(x, undefined, 2);
}

async function fetchArrayBuffer(url) {
  const resp = await fetch(url);
  assert(resp.ok, 'fetchArrayBuffer failed: ' + pp({
    url,
    httpStatus: resp.status + ' ' + resp.statusText
  }));
  return await resp.arrayBuffer();
}

async function fetchAudioContext(url, onProgress) {
  const arrayBuffer = await fetchArrayBuffer(url);
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return {
    audioContext,
    audioBuffer,
  };
}

export default class AudioQueue {
  static async fromUrl(url) {
    const result = await fetchAudioContext(url);
    return new AudioQueue(result.audioContext, result.audioBuffer);
  }

  constructor(audioContext, audioBuffer) {
    this._audioContext = audioContext;
    this._audioBuffer = audioBuffer;
    this._endOfLastQueuedBeat = 0;

    this._lastQueuedBeat = undefined;
    this._lastQueuedAudioSource = undefined;
  }

  get endOfLastQueuedBeat() {
    return this._endOfLastQueuedBeat;
  }

  get currentTime() {
    return this._audioContext.currentTime;
  }

  queue(beat) {
    const beatsAreAdjacent = this._lastQueuedBeat && this._lastQueuedBeat.which + 1 === beat.which;
    if (!beatsAreAdjacent) {
      if (!this._lastQueuedBeat) {
        console.log('Play: ' + beat.start);
        this._endOfLastQueuedBeat = this._audioContext.currentTime;
      } else {
        const prevBeatEnd = this._lastQueuedBeat.start + this._lastQueuedBeat.duration;
        console.log('Seek: ' + prevBeatEnd + ' -> ' + beat.start);
      }

      const audioSource = this._audioContext.createBufferSource();
      audioSource.buffer = this._audioBuffer;
      audioSource.connect(this._audioContext.destination);
      audioSource.start(this._endOfLastQueuedBeat, beat.start);

      this._lastQueuedAudioSource?.stop(this._endOfLastQueuedBeat);

      this._lastQueuedAudioSource = audioSource;
    }

    this._endOfLastQueuedBeat += beat.duration;
    this._lastQueuedBeat = beat;
  }

  stop() {
    this._lastQueuedAudioSource?.stop();
  }
}
