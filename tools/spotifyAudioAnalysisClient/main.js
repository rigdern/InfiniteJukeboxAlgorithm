// Illustrates how to use Spotify's audio analysis web API to fetch the audio
// analysis for a Spotify track. See ./README.md for details.
//

import fsPromises from 'fs/promises';
import fetch from 'node-fetch';
import { pp, readFileIfExists } from './util.js';

// For help in getting these, see https://developer.spotify.com/documentation/web-api/tutorials/getting-started
import { clientId, clientSecret } from './creds/spotify.js';

class SpotifyError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

const spotifyAccessTokenPath = './creds/spotifyAccessToken.json';

async function getSpotifyAccessToken() {
  const content = await readFileIfExists(spotifyAccessTokenPath, { encoding: 'utf8' });
  if (content) {
    return JSON.parse(content).access_token;
  }

  const tokenObj = await fetchAccessToken();
  await fsPromises.writeFile(spotifyAccessTokenPath, pp(tokenObj), { encoding: 'utf8' });
  return tokenObj.access_token;
}

async function clearSpotifyAccessToken() {
  await fsPromises.rm(spotifyAccessTokenPath, { force: true });
}

async function fetchSpotifyJson(url, init=undefined) {
  const response = await fetch(url, init);
  const json = await response.json();

  if (json.error) {
    throw new SpotifyError('fetchSpotifyJson error: ' + pp(json), json.error);
  } else {
    return json;
  }
}

function fetchAccessToken() {
  return fetchSpotifyJson('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: [
      'grant_type=client_credentials',
      'client_id=' + clientId,
      'client_secret=' + clientSecret,
    ].join('&'),
  });
}

function fetchAudioAnalysis(spotifyAccessToken, spotifyTrackId) {
  return fetchSpotifyJson('https://api.spotify.com/v1/audio-analysis/' + encodeURIComponent(spotifyTrackId), {
    headers: {
      'Authorization': 'Bearer ' + spotifyAccessToken,
    }
  });
}

async function main(args) {
  if (args.length !== 2) {
    console.log('Usage: node main.js <spotify-track-id> <spotify-analysis-output.json>');
    return;
  }

  const [spotifyTrackId, spotifyAnalysisPath] = args;

  const spotifyAccessToken = await getSpotifyAccessToken();

  try {
    const audioAnalysis = await fetchAudioAnalysis(spotifyAccessToken, spotifyTrackId);
    await fsPromises.writeFile(spotifyAnalysisPath, pp(audioAnalysis), { encoding: 'utf8' });
  } catch (error) {
    if (error instanceof SpotifyError && error.details?.status === 401) {
      // 401 Unauthorized error. Likely access token expired. Clear the old one.
      await clearSpotifyAccessToken();
      console.error('It looks like the Spotify access token expired. Try running the program again. A new one will be fetched.');
    } else {
      throw error;
    }
  }
}

main(process.argv.slice(2));
