// This file contains code derived from EternalJukebox (https://github.com/UnderMybrella/EternalJukebox/).
// Copyright 2021 UnderMybrella
// See the LICENSE file for the full MIT license terms.

import remixTrack from './remixTrack.js';
import calculateNearestNeighbors from './calculateNearestNeighbors.js';

// configs for chances to branch
const randomBranchChanceDelta = .018;
const maxRandomBranchChance = .5
const minRandomBranchChance = .18

function defaultRandom() {
  return Math.random();
}

export default class InfiniteBeats {
  constructor(spotifyAnalysis, random=defaultRandom) {
    let track = {
      analysis: {
        sections: spotifyAnalysis.sections,
        bars: spotifyAnalysis.bars,
        beats: spotifyAnalysis.beats,
        tatums: spotifyAnalysis.tatums,
        segments: spotifyAnalysis.segments,
      },
    };

    // Deep clone track since we're going to modify it.
    track = JSON.parse(JSON.stringify(track));

    this._curRandomBranchChance = minRandomBranchChance

    this._random = random;

    this._beats = track.analysis.beats;
    
    remixTrack(track);
    const { lastBranchPoint } = calculateNearestNeighbors(track);
    this._lastBranchPoint = lastBranchPoint;
  }

  getNextBeat(curBeat) {
    // console.log('next');
    if (!curBeat) {
      return this._beats[0];
    } else {
      const nextIndex = curBeat.which + 1;

      if (nextIndex < 0) {
        return this._beats[0];
      } else if (nextIndex >= this._beats.length) {
        return undefined;
      } else {
        return this._selectRandomNextBeat(this._beats[nextIndex]);
      }
    }
  }

  _selectRandomNextBeat(seed) {
    if (seed.neighbors.length === 0) {
      return seed;
    } else if (this._shouldRandomBranch(seed)) {
      var next = seed.neighbors.shift();
      seed.neighbors.push(next);
      var beat = next.dest;
      return beat;
    } else {
      return seed;
    }
  }

  _shouldRandomBranch(q) {
    if (q.which == this._lastBranchPoint) {
      return true;
    }

    // return true; // TEST, remove

    this._curRandomBranchChance += randomBranchChanceDelta;
    if (this._curRandomBranchChance > maxRandomBranchChance) {
      this._curRandomBranchChance = maxRandomBranchChance;
    }
    var shouldBranch = this._random() < this._curRandomBranchChance;
    if (shouldBranch) {
      this._curRandomBranchChance = minRandomBranchChance;
    }
    return shouldBranch;
  }
}
