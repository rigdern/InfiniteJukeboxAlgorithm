// This file contains code derived from EternalJukebox (https://github.com/UnderMybrella/EternalJukebox/).
// Copyright 2021 UnderMybrella
// See the LICENSE file for the full MIT license terms.

import remixTrack from '/algorithm/remixTrack.js';
import calculateNearestNeighbors from '/algorithm/calculateNearestNeighbors.js';

export default function makeVisualizer(spotifyAnalysis, driver) {
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

  remixTrack(track);
  calculateNearestNeighbors(track);

  const cmin = [100, 100, 100];
  const cmax = [-100, -100, -100];

  const W = 900;
  const H = 680;
  const paper = Raphael("tiles", W, H);

  const highlightColor = "#0000ff";
  const jumpHighlightColor = "#00ff22";
  const selectColor = "#ff0000";
  const debugMode = true;

  const shifted = false;

  const minTileWidth = 10;
  const maxTileWidth = 90;
  const growthPerPlay = 10;
  const curGrowFactor = 1;

  const maxBranches = 4;        // max branches allowed per beat

  const jukeboxData = {
    tiles: [],
  };

  function info(msg) {
  }

  function readyToPlay(t) {
    setDisplayMode(true);
    normalizeColor();
    trackReady(t);
    drawVisualization();
  }

  function setDisplayMode(playMode) {
    if (playMode) {
      $("#song-div").hide();
      $("#select-track").hide();
      $("#running").show();
      $(".rotate").hide();
    } else {
      $("#song-div").show();
      $("#select-track").show();
      $("#running").hide();
      $(".rotate").show();
    }
    info("");
  }

  function normalizeColor() {
    var qlist = track.analysis.segments;
    for (var i = 0; i < qlist.length; i++) {
      for (var j = 0; j < 3; j++) {
        var t = qlist[i].timbre[j + 1];
  
        if (t < cmin[j]) {
          cmin[j] = t;
        }
        if (t > cmax[j]) {
          cmax[j] = t;
        }
      }
    }
  }

  function trackReady(t) {
    // t.fixedTitle = getTitle(t.info.title, t.info.artist, t.info.url);
    // document.title = 'Eternal Jukebox for ' + t.fixedTitle;
    // $("#song-title").text(t.fixedTitle);
    // $("#song-url").attr("href", "https://open.spotify.com/track/" + t.info.id);
  }

  function drawVisualization() {
    createTilePanel('beats');
  }

  function createTilePanel(which) {
    removeAllTiles();
    jukeboxData.tiles = createTiles(which);
  }

  function removeAllTiles() {
    for (var i = 0; i < jukeboxData.tiles.length; i++) {
      jukeboxData.tiles[i].rect.remove();
    }
    jukeboxData.tiles = [];
  }

  function createTiles(qtype) {
    return createTileCircle(qtype, 250);
  }
  
  function createTileCircle(qtype, radius) {
    // var start = now();
    var y_padding = 90;
    var x_padding = 200;
    var maxWidth = 90;
    var tiles = [];
    var qlist = track.analysis[qtype];
    var n = qlist.length;
    var R = radius;
    var alpha = Math.PI * 2 / n;
    var perimeter = 2 * n * R * Math.sin(alpha / 2);
    var a = perimeter / n;
    var width = a * 20;
    var angleOffset = -Math.PI / 2;
    // var angleOffset = 0;
  
    if (width > maxWidth) {
      width = maxWidth;
    }
  
    width = minTileWidth;
  
    paper.clear();
  
    var angle = angleOffset;
    for (var i = 0; i < qlist.length; i++) {
      var tile = createNewTile(i, qlist[i], a, width);
      var y = y_padding + R + R * Math.sin(angle);
      var x = x_padding + R + R * Math.cos(angle);
      tile.move(x, y);
      tile.rotate(angle);
      tiles.push(tile);
      angle += alpha;
    }
  
    // now connect every tile to its neighbors
  
    // a horrible hack until I figure out
    // geometry
    var roffset = width / 2;
    var yoffset = width * .52;
    var xoffset = width * 1;
    var center = ' S 450 350 ';
    var branchCount = 0;
    R -= roffset;
    for (var i = 0; i < tiles.length; i++) {
      var startAngle = alpha * i + angleOffset;
      var tile = tiles[i];
      var y1 = y_padding + R + R * Math.sin(startAngle) + yoffset;
      var x1 = x_padding + R + R * Math.cos(startAngle) + xoffset;
  
      for (var j = 0; j < tile.q.neighbors.length; j++) {
        var destAngle = alpha * tile.q.neighbors[j].dest.which + angleOffset;
        var y2 = y_padding + R + R * Math.sin(destAngle) + yoffset;
        var x2 = x_padding + R + R * Math.cos(destAngle) + xoffset;
  
        var path = 'M' + x1 + ' ' + y1 + center + x2 + ' ' + y2;
        var curve = paper.path(path);
        curve.edge = tile.q.neighbors[j];
        addCurveClickHandler(curve);
        highlightCurve(curve, false, false);
        tile.q.neighbors[j].curve = curve;
        branchCount++;
      }
    }
    jukeboxData.branchCount = branchCount;
    return tiles;
  }

  function createNewTile(which, q, height, width) {
    var padding = 0;
    var tile = Object.create(tilePrototype);
    tile.which = which;
    tile.width = width;
    tile.height = height;
    tile.branchColor = getBranchColor(q);
    tile.quantumColor = getQuantumColor(q);
    tile.normalColor = tile.quantumColor;
    tile.isPlaying = false;
    tile.isScaled = false;
    tile.playCount = 0;
  
    tile.rect = paper.rect(0, 0, tile.width, tile.height);
    tile.rect.attr("stroke", tile.normalColor);
    tile.rect.attr('stroke-width', 0);
    tile.q = q;
    tile.init();
    q.tile = tile;
    tile.normal();
    return tile;
  }

  var tilePrototype = {
    normalColor: "#5f9",
  
    move: function (x, y) {
      this.rect.attr({ x: x, y: y });
      if (this.label) {
        this.label.attr({ x: x + 2, y: y + 8 });
      }
    },
  
    rotate: function (angle) {
      var dangle = 360 * (angle / (Math.PI * 2));
      this.rect.transform('r' + dangle);
    },
  
    play: function (force) {
      if (force || shifted) {
        this.playStyle(true);
        player.play(0, this.q);
      } else {
        this.selectStyle();
      }
      if (force) {
        info("Selected tile " + this.q.which);
        jukeboxData.selectedTile = this;
      }
    },
  
  
    selectStyle: function () {
      this.rect.attr("fill", "#C9a");
    },
  
    queueStyle: function () {
      this.rect.attr("fill", "#aFF");
    },
  
    pauseStyle: function () {
      this.rect.attr("fill", "#F8F");
    },
  
    playStyle: function (didJump) {
      if (!this.isPlaying) {
        this.isPlaying = true;
        if (!this.isScaled) {
          this.isScaled = true;
          this.rect.attr('width', maxTileWidth);
        }
        this.rect.toFront();
        this.rect.attr("fill", highlightColor);
        highlightCurves(this, true, didJump);
      }
    },
  
  
    normal: function () {
      this.rect.attr("fill", this.normalColor);
      if (this.isScaled) {
        this.isScaled = false;
        //this.rect.scale(1/1.5, 1/1.5);
        var newWidth = Math.round((minTileWidth + this.playCount * growthPerPlay) * curGrowFactor);
        if (newWidth < 1) {
          newWidth = 1;
        }
        if (newWidth > 90) {
          curGrowFactor /= 2;
          redrawTiles();
        } else {
          this.rect.attr('width', newWidth);
        }
      }
      highlightCurves(this, false, false);
      this.isPlaying = false;
    },
  
    init: function () {
      var that = this;
  
      this.rect.mouseover(function (event) {
        that.playStyle(false);
        if (debugMode) {
          if (that.q.which > jukeboxData.lastBranchPoint) {
            $("#beats").text(that.q.which + ' ' + that.q.reach + '*');
          } else {
            var qlength = track.analysis.beats.length;
            var distanceToEnd = qlength - that.q.which;
            $("#beats").text(that.q.which + ' ' + that.q.reach
              + ' ' + Math.floor((that.q.reach - distanceToEnd) * 100 / qlength));
          }
        }
        event.preventDefault();
      });
  
      this.rect.mouseout(function (event) {
        that.normal();
        event.preventDefault();
      });
  
      this.rect.mousedown(function (event) {
        event.preventDefault();
        driver.setNextTile(that);
        if (!driver.isRunning()) {
          driver.start();
        }
      });
    }
  };

  function highlightCurves(tile, enable, didJump) {
    for (var i = 0; i < tile.q.neighbors.length; i++) {
      var curve = tile.q.neighbors[i].curve;
      highlightCurve(curve, enable, didJump);
      if (driver.isRunning()) {
        break; // just highlight the first one
      }
    }
  }

  function redrawTiles() {
    jukeboxData.tiles.forEach(function (tile) {
      var newWidth = Math.round((minTileWidth + tile.playCount * growthPerPlay) * curGrowFactor);
      if (newWidth < 1) {
        newWidth = 1;
      }
      tile.rect.attr('width', newWidth);
    });
  }

  function getBranchColor(q) {
    if (q.neighbors.length === 0) {
      return to_rgb(0, 0, 0);
    } else {
      var red = q.neighbors.length / maxBranches;
      return to_rgb(red, 0, (1. - red));
    }
  }

  function getQuantumColor(q) {
    if (isSegment(q)) {
      return getSegmentColor(q);
    } else {
      q = getQuantumSegment(q);
      if (q != null) {
        return getSegmentColor(q);
      } else {
        return "#000";
      }
    }
  }

  function getSegmentColor(seg) {
    var results = [];
    for (var i = 0; i < 3; i++) {
      var t = seg.timbre[i + 1];
      var norm = (t - cmin[i]) / (cmax[i] - cmin[i]);
      results[i] = norm * 255;
      results[i] = norm;
    }
    return to_rgb(results[1], results[2], results[0]);
    //return to_rgb(results[0], results[1], results[2]);
  }

  function to_rgb(r, g, b) {
    return "#" + convert(r * 255) + convert(g * 255) + convert(b * 255);
  }

  function convert(value) {
    var integer = Math.round(value);
    var str = Number(integer).toString(16);
    return str.length === 1 ? "0" + str : str;
  };

  function isSegment(q) {
    return 'timbre' in q;
  }

  function getQuantumSegment(q) {
    return q.oseg;
  }

  function addCurveClickHandler(curve) {
    curve.click(
      function () {
        if (jukeboxData.selectedCurve) {
          highlightCurve(jukeboxData.selectedCurve, false, false);
        }
        selectCurve(curve, true);
        jukeboxData.selectedCurve = curve;
      });
  
    curve.mouseover(
      function () {
        highlightCurve(curve, true, false);
      }
    );
  
    curve.mouseout(
      function () {
        if (curve != jukeboxData.selectedCurve) {
          highlightCurve(curve, false, false);
        }
      }
    );
  }
  
  function highlightCurve(curve, enable, jump) {
    if (curve) {
      if (enable) {
        var color = jump ? jumpHighlightColor : highlightColor;
        curve.attr('stroke-width', 4);
        curve.attr('stroke', color);
        curve.attr('stroke-opacity', 1.0);
        curve.toFront();
      } else {
        if (curve.edge) {
          curve.attr('stroke-width', 3);
          curve.attr('stroke', curve.edge.src.tile.quantumColor);
          curve.attr('stroke-opacity', .7);
        }
      }
    }
  }

  function selectCurve(curve) {
    curve.attr('stroke-width', 6);
    curve.attr('stroke', selectColor);
    curve.attr('stroke-opacity', 1.0);
    curve.toFront();
  }

  let curBeat = undefined;
  function setBeatIndex(beatIndex) {
    const didJump = curBeat && curBeat.which + 1 !== beatIndex;

    const prevBeat = curBeat;
    curBeat = jukeboxData.tiles[beatIndex];
    
    prevBeat?.normal();
    curBeat.playStyle(didJump);
  }

  readyToPlay(track);

  return {
    setBeatIndex,
  }
}
