// Uses the InfiniteBeats class to generate the first 200 beats to be played
// of an infinite variation of the song Gangnam Style.
//

import InfiniteBeats from '../../algorithm/InfiniteBeats.js';
import fs from 'fs/promises';

async function main() {
  // gangnamStyleAnalysis.json came from Spotify's audio analysis API:
  // https://api.spotify.com/v1/audio-analysis/03UrZgTINDqvnUMbbIMhql
  // Docs: https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis
  const track = JSON.parse(await fs.readFile('../../../data/gangnamStyleAnalysis.json', { encoding: 'utf8' }));

  const infiniteBeats = new InfiniteBeats(track);
  
  // Process the first 200 beats.
  let prevBeat = undefined;
  for (let i = 0; i < 200; ++i) {
    const curBeat = infiniteBeats.getNextBeat(prevBeat);

    if (!prevBeat) {
      console.log('Start playing at ' + curBeat.start + ' seconds');
    } else if (!curBeat) {
      console.log('Stop');
      return;
    } else if (prevBeat.which + 1 === curBeat.which) {
      // The beats are adjacent so there's nothing to do. If we were playing
      // audio, we'd allow it to continue playing as it is.
    } else {
      // The beats are not adjacent so we need to seek.
      const prevBeatEnd = prevBeat.start + prevBeat.duration;
      console.log('Seek: ' + prevBeatEnd + ' seconds -> ' + curBeat.start + ' seconds');
    }

    prevBeat = curBeat;
  }
}

main();
