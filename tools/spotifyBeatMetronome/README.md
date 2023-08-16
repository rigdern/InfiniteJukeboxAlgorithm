# Spotify Beat Metronome
Generates a WAV audio file that consists solely of a tick at each beat where the timestamp of each beat is given by a Spotify audio analysis file.

## Rationale
A challenge with [Spotify's audio analysis web API](https://developer.spotify.com/documentation/web-api/reference/get-audio-analysis) is that the analysis is for the copy of the song that Spotify has which may not be identical to the copy of the song that you have. For example, maybe the music begins immediately in Spotify's copy of the track whereas your copy of the track begins with a couple of seconds of silence. To remedy this, you need to figure out by how many seconds you need to shift Spotify's analysis so that it aligns exactly with your copy of the song.

This tool is intended to help with this process. It helps you to understand Spotify's audio analysis file by generating a WAV audio file which plays a sound at each beat identified by Spotify's audio analysis. You can import your copy of the song along with this beat WAV file into an audio editor like [Audacity](https://www.audacityteam.org/) and then utilize your auditory and visual senses to make an assessment:
- Auditory. Listen to the song and the beat WAV play together to see whether the Spotify-identified beats play on the beat of your copy of the song. If not, the timestamps in Spotify's analysis file may need to be shifted.
- Visual. If you identify the song's tempo/BPM, you can (1) generate a metronome audio track that plays a tick at that tempo and (2) align that metronome audio track to the beat of the song. Then you can visually compare the waveforms of the metronome audio track with those of the beat WAV audio file. The distance between the beats in these waveforms is a clue about how much you need to shift the timestamps in Spotify's audio analysis file. Some helpful resources:
  - [How to find a song's tempo/BPM with ArrowVortex](https://youtu.be/Z49UKFefu5c) (video)
  - [How to add a metronome track in Audacity](https://bsmg.wiki/mapping/basic-audio.html#add-a-click-track) (the relevant section is titled "Add a Click Track")

## Usage
`node main.js <spotify-analysis.json> <beat-output.wav>`

For example, here's how to create a beat WAV audio file for the beats identified by Spotify's audio analysis of Gangnam Style:

`node main.js ../../data/gangnamStyleAnalysis.json gangnamStyleBeat.wav`

If you play `gangnamStyleBeat.wav` in an audio player, you'll hear a tick at each beat identified by Spotify's audio analysis and silence elsewhere.
