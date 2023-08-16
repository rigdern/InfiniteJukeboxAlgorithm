// This file contains code derived from EternalJukebox (https://github.com/UnderMybrella/EternalJukebox/).
// Copyright 2021 UnderMybrella
// See the LICENSE file for the full MIT license terms.

export default function calculateNearestNeighbors(track) {
  const maxBranches = 4;
  const maxBranchThreshold = 80; // max allowed distance threshold
  let nextEdgeId = 0;

  function dynamicCalculateNearestNeighbors(type) {
    var count = 0;
    var targetBranchCount = track.analysis[type].length / 6;

    precalculateNearestNeighbors(type, maxBranches, maxBranchThreshold);

    for (var threshold = 10; threshold < maxBranchThreshold; threshold += 5) {
      count = collectNearestNeighbors(type, threshold);
      if (count >= targetBranchCount) {
        break;
      }
    }
    const lastBranchPoint = postProcessNearestNeighbors(type, threshold);
    return { lastBranchPoint }
  }

  function precalculateNearestNeighbors(type, maxNeighbors, maxThreshold) {
    // skip if this is already done
    if ('all_neighbors' in track.analysis[type][0]) {
      return;
    }
    for (var qi = 0; qi < track.analysis[type].length; qi++) {
      var q1 = track.analysis[type][qi];
      calculateNearestNeighborsForQuantum(type, maxNeighbors, maxThreshold, q1);
    }
  }

  function calculateNearestNeighborsForQuantum(type, maxNeighbors, maxThreshold, q1) {
    var edges = [];
    var id = 0;
    for (var i = 0; i < track.analysis[type].length; i++) {

      if (i === q1.which) {
        continue;
      }

      var q2 = track.analysis[type][i];
      var sum = 0;
      for (var j = 0; j < q1.overlappingSegments.length; j++) {
        var seg1 = q1.overlappingSegments[j];
        var distance = 100;
        if (j < q2.overlappingSegments.length) {
          var seg2 = q2.overlappingSegments[j];
          // some segments can overlap many quantums,
          // we don't want this self segue, so give them a
          // high distance
          if (seg1.which === seg2.which) {
            distance = 100
          } else {
            distance = get_seg_distances(seg1, seg2);
          }
        }
        sum += distance;
      }
      var pdistance = q1.indexInParent == q2.indexInParent ? 0 : 100;
      var totalDistance = sum / q1.overlappingSegments.length + pdistance;
      if (totalDistance < maxThreshold) {
        var edge = {
          id: id,
          src: q1,
          dest: q2,
          distance: totalDistance,
        };
        edges.push(edge);
        id++;
      }
    }

    edges.sort(
      function (a, b) {
        if (a.distance > b.distance) {
          return 1;
        } else if (b.distance > a.distance) {
          return -1;
        } else {
          return 0;
        }
      }
    );

    q1.all_neighbors = [];
    for (i = 0; i < maxNeighbors && i < edges.length; i++) {
      var edge = edges[i];
      q1.all_neighbors.push(edge);

      edge.id = nextEdgeId;
      ++nextEdgeId;
    }
  }

  const timbreWeight = 1;
  const pitchWeight = 10;
  const loudStartWeight = 1;
  const loudMaxWeight = 1;
  const durationWeight = 100;
  const confidenceWeight = 1;

  function get_seg_distances(seg1, seg2) {
    var timbre = seg_distance(seg1, seg2, 'timbre', true);
    var pitch = seg_distance(seg1, seg2, 'pitches');
    var sloudStart = Math.abs(seg1.loudness_start - seg2.loudness_start);
    var sloudMax = Math.abs(seg1.loudness_max - seg2.loudness_max);
    var duration = Math.abs(seg1.duration - seg2.duration);
    var confidence = Math.abs(seg1.confidence - seg2.confidence);
    var distance = timbre * timbreWeight + pitch * pitchWeight +
      sloudStart * loudStartWeight + sloudMax * loudMaxWeight +
      duration * durationWeight + confidence * confidenceWeight;
    return distance;
  }

  function seg_distance(seg1, seg2, field, weighted) {
    if (weighted) {
      return weighted_euclidean_distance(seg1[field], seg2[field]);
    } else {
      return euclidean_distance(seg1[field], seg2[field]);
    }
  }

  function weighted_euclidean_distance(v1, v2) {
    var sum = 0;

    //for (var i = 0; i < 4; i++) {
    for (var i = 0; i < v1.length; i++) {
      var delta = v2[i] - v1[i];
      //var weight = 1.0 / ( i + 1.0);
      var weight = 1.0;
      sum += delta * delta * weight;
    }
    return Math.sqrt(sum);
  }

  function euclidean_distance(v1, v2) {
    var sum = 0;

    for (var i = 0; i < v1.length; i++) {
      var delta = v2[i] - v1[i];
      sum += delta * delta;
    }
    return Math.sqrt(sum);
  }

  function collectNearestNeighbors(type, maxThreshold) {
    var branchingCount = 0;
    for (var qi = 0; qi < track.analysis[type].length; qi++) {
      var q1 = track.analysis[type][qi];
      q1.neighbors = extractNearestNeighbors(q1, maxThreshold);
      if (q1.neighbors.length > 0) {
        branchingCount += 1;
      }
    }
    return branchingCount;
  }

  function extractNearestNeighbors(q, maxThreshold) {
    var neighbors = [];

    for (var i = 0; i < q.all_neighbors.length; i++) {
      var neighbor = q.all_neighbors[i];
      
      var distance = neighbor.distance;
      if (distance <= maxThreshold) {
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  function postProcessNearestNeighbors(type, threshold) {
    if (longestBackwardBranch(type) < 50) {
      insertBestBackwardBranch(type, threshold, 65);
    } else {
      insertBestBackwardBranch(type, threshold, 55);
    }
    calculateReachability(type);
    const lastBranchPoint = findBestLastBeat(type);
    filterOutBadBranches(type, lastBranchPoint);
    return lastBranchPoint;
  }

  // we want to find the best, long backwards branch
  // and ensure that it is included in the graph to
  // avoid short branching songs like:
  // http://labs.echonest.com/Uploader/index.html?trid=TRVHPII13AFF43D495

  function longestBackwardBranch(type) {
    var longest = 0
    var quanta = track.analysis[type];
    for (var i = 0; i < quanta.length; i++) {
      var q = quanta[i];
      for (var j = 0; j < q.neighbors.length; j++) {
        var neighbor = q.neighbors[j];
        var which = neighbor.dest.which;
        var delta = i - which;
        if (delta > longest) {
          longest = delta;
        }
      }
    }
    var lbb = longest * 100 / quanta.length;
    return lbb;
  }

  function insertBestBackwardBranch(type, threshold, maxThreshold) {
    var branches = [];
    var quanta = track.analysis[type];
    for (var i = 0; i < quanta.length; i++) {
      var q = quanta[i];
      for (var j = 0; j < q.all_neighbors.length; j++) {
        var neighbor = q.all_neighbors[j];

        var which = neighbor.dest.which;
        var thresh = neighbor.distance;
        var delta = i - which;
        if (delta > 0 && thresh < maxThreshold) {
          var percent = delta * 100 / quanta.length;
          var edge = [percent, i, which, q, neighbor]
          branches.push(edge);
        }
      }
    }

    if (branches.length === 0) {
      return;
    }

    branches.sort(
      function (a, b) {
        return a[0] - b[0];
      }
    )
    branches.reverse();
    var best = branches[0];
    var bestQ = best[3];
    var bestNeighbor = best[4];
    var bestThreshold = bestNeighbor.distance;
    if (bestThreshold > threshold) {
      bestQ.neighbors.push(bestNeighbor);
      // console.log('added bbb from', bestQ.which, 'to', bestNeighbor.dest.which, 'thresh', bestThreshold);
    } else {
      // console.log('bbb is already in from', bestQ.which, 'to', bestNeighbor.dest.which, 'thresh', bestThreshold);
    }
  }

  function calculateReachability(type) {
    var maxIter = 1000;
    var iter = 0;
    var quanta = track.analysis[type];

    for (var qi = 0; qi < quanta.length; qi++) {
      var q = quanta[qi];
      q.reach = quanta.length - q.which;
    }

    for (iter = 0; iter < maxIter; iter++) {
      var changeCount = 0;
      for (qi = 0; qi < quanta.length; qi++) {
        var q = quanta[qi];
        var changed = false;

        for (var i = 0; i < q.neighbors.length; i++) {
          var q2 = q.neighbors[i].dest;
          if (q2.reach > q.reach) {
            q.reach = q2.reach;
            changed = true;
          }
        }

        if (qi < quanta.length - 1) {
          var q2 = quanta[qi + 1];
          if (q2.reach > q.reach) {
            q.reach = q2.reach;
            changed = true;
          }
        }

        if (changed) {
          changeCount++;
          for (var j = 0; j < q.which; j++) {
            var q2 = quanta[j];
            if (q2.reach < q.reach) {
              q2.reach = q.reach;
            }
          }
        }
      }
      if (changeCount == 0) {
        break;
      }
    }

    if (false) {
      for (var qi = 0; qi < quanta.length; qi++) {
        var q = quanta[qi];
        console.log(q.which, q.reach, Math.round(q.reach * 100 / quanta.length));
      }
    }
    // console.log('reachability map converged after ' + iter + ' iterations. total ' + quanta.length);
  }

  function findBestLastBeat(type) {
    var reachThreshold = 50;
    var quanta = track.analysis[type];
    var longest = 0;
    var longestReach = 0;
    for (var i = quanta.length - 1; i >= 0; i--) {
      var q = quanta[i];
      //var reach = q.reach * 100 / quanta.length;
      var distanceToEnd = quanta.length - i;

      // if q is the last quanta, then we can never go past it
      // which limits our reach

      var reach = (q.reach - distanceToEnd) * 100 / quanta.length;

      if (reach > longestReach && q.neighbors.length > 0) {
        longestReach = reach;
        longest = i;
        if (reach >= reachThreshold) {
          break;
        }
      }
    }
    // console.log('NBest last beat is', longest, 'reach', longestReach, reach);

    return longest
  }

  function filterOutBadBranches(type, lastIndex) {
    var quanta = track.analysis[type];
    for (var i = 0; i < lastIndex; i++) {
      var q = quanta[i];
      var newList = [];
      for (var j = 0; j < q.neighbors.length; j++) {
        var neighbor = q.neighbors[j];
        if (neighbor.dest.which < lastIndex) {
          newList.push(neighbor);
        } else {
          // console.log('filtered out arc from', q.which, 'to', neighbor.dest.which);
        }
      }
      q.neighbors = newList;
    }
  }

  if (track) {
    return dynamicCalculateNearestNeighbors('beats');
  } else {
    throw new Error('track is null');
  }
}