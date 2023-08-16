# Infinite Jukebox Algorithm

The algorithm for the Infinite Jukebox which generates a never-ending and ever changing version of any song. Extracted from https://github.com/UnderMybrella/EternalJukebox/.

## Rationale
The code for the algorithm of the original Infinite Jukebox implementation was coupled with the code that did audio, rendering, etc. The intention of this repo is to provide the code for the algorithm on its own so that it's easier to use in other applications.

## Dependency: Spotify's audio analysis web API
The Infinite Jukebox relies on [Spotify's audio analysis web API](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis). For a song in Spotify's catalog, the API provides information about its structure and musical content including rhythm, pitch, and timbre. The Infinite Jukebox algorithm uses this information to figure out which sections of the song are so similar that it can jump the song from one section to the other without the listener noticing a seam in the music.

This repo includes [`/data/gangnamStyleAnalysis.json`](./data/gangnamStyleAnalysis.json), a file with Spotify's audio analysis for Gangnam Style, so that you can play with the code in the repo without having to use Spotify's web API.

This repo also includes [`/tools/spotifyAudioAnalysisClient/`](./tools/spotifyAudioAnalysisClient/), a tool that illustrates how to use Spotify's audio analysis web API.

## Repo layout
- [`/js/`](./js/): Files related to the JavaScript implementation of the Infinite Jukebox algorithm.
  - [`algorithm/`](./js/algorithm/): The JavaScript implementation of the algorithm.
  - [`examples/`](./js/examples/): Example usage of the algorithm's API.
    - [`basic/`](./js/examples/basic/): A bare-bones example.
    - [`playerAndVisualizer/`](./js/examples/playerAndVisualizer/): A more substantial example that shows how to use the algorithm to play audio and visualize the beat of the song that's currently playing.
- [`/tools/`](./tools/): Tools that come in handy when making use of the algorithm.
  - [`spotifyAudioAnalysisClient/`](./tools/spotifyAudioAnalysisClient/): Illustrates how to use Spotify's audio analysis web API.
  - [`spotifyBeatMetronome/`](./tools/spotifyBeatMetronome/): Generates a WAV audio file which plays a tick at each beat identified by Spotify's audio analysis. Useful when trying to figure out how to get your copy of the song in sync with Spotify's audio analysis.
- [`/data/gangnamStyleAnalysis.json`](./data/gangnamStyleAnalysis.json): The result of calling Spotify's audio analysis web API on the song Gangnam Style. You can give this file as input to the examples and tools in this repo to see how they operate.

## Credits
The original implementation of The Infinite Jukebox is by [Paul Lamere](https://musicmachinery.com/2012/11/12/the-infinite-jukebox/).

The code in this repo is derived from [The Eternal Jukebox by UnderMybrella](https://github.com/UnderMybrella/EternalJukebox/), a rework of the original project.

## License
[MIT](./LICENSE)
