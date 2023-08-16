import InfiniteBeats from '/algorithm/InfiniteBeats.js';
import makeVisualizer from './lib/makeVisualizer.js';
import AudioQueue from './lib/AudioQueue.js';
import { fetchJson, timeout } from './lib/util.js';

let isPlaying = false;
async function onPlay(track, audioQueue) {
  if (isPlaying) return;
  isPlaying = true;

  const infiniteBeats = new InfiniteBeats(track);

  let userRequestedBeat = undefined;
  const visualizer = makeVisualizer(track, {
    isRunning: () => {
      return isPlaying;
    },
    setNextTile: (tile) => {
      // The user clicked a beat to play in the visualization.
      userRequestedBeat = tile.q;
    },
    start: () => {
      // The user clicked a beat to play in the visualization and we're not
      // currently playing. Not providing an implementation since we're always
      // playing.
    },
  });

  let prevBeat = undefined;
  while (true) {
    const curBeat = (
      userRequestedBeat ? userRequestedBeat :
      infiniteBeats.getNextBeat(prevBeat)
    );
    userRequestedBeat = undefined;

    audioQueue.queue(curBeat);
    visualizer.setBeatIndex(curBeat.which);

    // Sleep until just before the last queued beat finishes playing.
    const delaySeconds = audioQueue.endOfLastQueuedBeat - audioQueue.currentTime;
    const delayMs = delaySeconds * 1000;
    await timeout(delayMs - 10);

    prevBeat = curBeat;
  }

  isPlaying = false;
  audioQueue.stop();
}

function setHeaderState(state) {
  const headerEl = document.getElementById('header');
  headerEl.classList.remove('loading', 'ready', 'error');
  headerEl.classList.add(state);
}

async function main() {
  try {
    const track = await fetchJson('data/analysis.json');
    const audioQueue = await AudioQueue.fromUrl('data/song.wav');

    setHeaderState('ready');

    document.getElementById('play-button').addEventListener('click', event => {
      onPlay(track, audioQueue);
    });
  } catch (error) {
    console.log('Error:', error);
    setHeaderState('error');
    document.getElementById('error-message').textContent = error;
  }
}

main();
