// This file contains code derived from EternalJukebox (https://github.com/UnderMybrella/EternalJukebox/).
// Copyright 2021 UnderMybrella
// See the LICENSE file for the full MIT license terms.

export default function remixTrack(track) {
  preprocessTrack(track);
}

function preprocessTrack(track) {
  const trackAnalysis = track.analysis;

  // trace('preprocessTrack');
  var types = ['sections', 'bars', 'beats', 'tatums', 'segments'];
  for (const type of types) {
    // trace('preprocessTrack ' + type);
    const qlist = trackAnalysis[type];
    for (let [index, q] of qlist.entries()) {
      q.track = track;
      q.which = index;
      if (index > 0) {
        q.prev = qlist[index - 1];
      } else {
        q.prev = null
      }

      if (index < qlist.length - 1) {
        q.next = qlist[index + 1];
      } else {
        q.next = null
      }
    }
  }

  connectQuanta(trackAnalysis, 'sections', 'bars');
  connectQuanta(trackAnalysis, 'bars', 'beats');
  connectQuanta(trackAnalysis, 'beats', 'tatums');
  connectQuanta(trackAnalysis, 'tatums', 'segments');

  connectFirstOverlappingSegment(trackAnalysis, 'bars');
  connectFirstOverlappingSegment(trackAnalysis, 'beats');
  connectFirstOverlappingSegment(trackAnalysis, 'tatums');

  connectAllOverlappingSegments(trackAnalysis, 'bars');
  connectAllOverlappingSegments(trackAnalysis, 'beats');
  connectAllOverlappingSegments(trackAnalysis, 'tatums');


  filterSegments(trackAnalysis);
}

function filterSegments(trackAnalysis) {
  var threshold = .3;
  var fsegs = [];
  fsegs.push(trackAnalysis.segments[0]);
  for (var i = 1; i < trackAnalysis.segments.length; i++) {
    var seg = trackAnalysis.segments[i];
    var last = fsegs[fsegs.length - 1];
    if (isSimilar(seg, last) && seg.confidence < threshold) {
      fsegs[fsegs.length - 1].duration += seg.duration;
    } else {
      fsegs.push(seg);
    }
  }
  trackAnalysis.fsegments = fsegs;
}

function isSimilar(seg1, seg2) {
  var threshold = 1;
  var distance = timbral_distance(seg1, seg2);
  return (distance < threshold);
}

function timbral_distance(s1, s2) {
  return euclidean_distance(s1.timbre, s2.timbre);
}

function euclidean_distance(v1, v2) {
  var sum = 0;
  for (var i = 0; i < 3; i++) {
    var delta = v2[i] - v1[i];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

function connectQuanta(trackAnalysis, parent, child) {
  var last = 0;
  var qparents = trackAnalysis[parent];
  var qchildren = trackAnalysis[child];

  for (const qparent of qparents) {
    qparent.children = [];

    for (var j = last; j < qchildren.length; j++) {
      var qchild = qchildren[j];
      if (qchild.start >= qparent.start
        && qchild.start < qparent.start + qparent.duration) {
        qchild.parent = qparent;
        qchild.indexInParent = qparent.children.length;
        qparent.children.push(qchild);
        last = j;
      } else if (qchild.start > qparent.start) {
        break;
      }
    }
  }
}

// connects a quanta with the first overlapping segment
function connectFirstOverlappingSegment(trackAnalysis, quanta_name) {
  var last = 0;
  var quanta = trackAnalysis[quanta_name];
  var segs = trackAnalysis.segments;

  for (const q of quanta) {
    for (var j = last; j < segs.length; j++) {
      var qseg = segs[j];
      if (qseg.start >= q.start) {
        q.oseg = qseg;
        last = j;
        break
      }
    }
  }
}

function connectAllOverlappingSegments(trackAnalysis, quanta_name) {
  var last = 0;
  var quanta = trackAnalysis[quanta_name];
  var segs = trackAnalysis.segments;

  for (const q of quanta) {
    q.overlappingSegments = [];

    for (var j = last; j < segs.length; j++) {
      var qseg = segs[j];
      // seg starts before quantum so no
      if ((qseg.start + qseg.duration) < q.start) {
        continue;
      }
      // seg starts after quantum so no
      if (qseg.start > (q.start + q.duration)) {
        break;
      }
      last = j;
      q.overlappingSegments.push(qseg);
    }
  }
}
