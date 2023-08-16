function assert(pred, msg) {
  if (!pred) {
    throw new Error('Assert failed: ' + msg);
  }
}

// Returns pretty-printed JSON.
function pp(x) {
  return JSON.stringify(x, undefined, 2);
}

export function timeout(ms) {
  return new Promise(resolve => {
    if (ms < 0) {
      resolve();
    } else {
      setTimeout(() => {
        resolve();
      }, ms);
    }
  });
}

export async function fetchJson(url) {
  const resp = await fetch(url);
  assert(resp.ok, 'fetchJson failed: ' + pp({
    url,
    httpStatus: resp.status + ' ' + resp.statusText
  }));
  return await resp.json();
}
