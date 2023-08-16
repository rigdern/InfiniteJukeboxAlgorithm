# Player & Visualizer Example

This example illustrates how to connect the Infinite Jukebox algorithm to audio and a visualizer.

Given a spotify audio analysis file and an audio file, plays the audio for the song while visually showing you which beat of the song is playing. Also visually shows when the algorithm chooses to seek the song to another beat rather than allowing it to continue sequentially. A seek is represented by a green line in the visualizer.

## Setup
- Run `npm install` to install the example's dependencies.

## Usage
`node server.js <spotify-analysis.json> <song.wav>`

- `spotify-analysis.json`: Path to a file from [Spotify's audio analysis web API](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis) for your song of interest. Can be a local file path or an HTTP URL. For sample code for interacting with the Spotify web API, see [`/tools/spotifyAudioAnalysisClient/`](../../../tools/spotifyAudioAnalysisClient/).
- `song.wav`: Path to the audio file for your song of interest. Can be a local file path or an HTTP URL.

Here's an example invocation for using this tool with the song Gangnam Style:

`node server.js ../../../data/gangnamStyleAnalysis.json "https://www.eternalboxmirror.xyz/api/audio/jukebox/03UrZgTINDqvnUMbbIMhql"`

## Code layout
- [`./server.js`](./server.js): Launches a local HTTP server that serves this web app at http://localhost:2012/.
- [`./web/`](./web): Contains the HTML, JavaScript, and CSS for this web app.
  - [`main.js`](./web/main.js): Entry-point for the code that runs in the browser. This is likely the file you're most interested in as it illustrates how to connect the Infinite Jukebox algorithm to the browser's audio API and to the visualizer. The result is you hear an infinitely long variation of the song while seeing a visualization of the song's current beat.
  - [`lib/`](./web/lib/): This app's custom JavaScript utility code.
  - [`styles/`](./web/styles/): This app's custom CSS styles.
  - [`third-party/`](./web/third-party/): JavaScript and CSS styles from third-party libraries.

## Third-party licenses
All code in the [`./web/third-party/`](./web/third-party/) folder uses the MIT license:

- [`jquery-ui.css`](./web/third-party/jquery-ui.css)
- [`raphael-min.js`](./web/third-party/raphael-min.js)
- [`three-dots.css`](./web/third-party/three-dots.css)
