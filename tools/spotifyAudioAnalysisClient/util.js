import fsPromises from 'fs/promises';

// Pretty-print JSON.
export function pp(json) {
  return JSON.stringify(json, undefined, 2);
}

export async function readFileIfExists(filePath, options) {
  try {
    return await fsPromises.readFile(filePath, options);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    } else {
      throw error;
    }
  }
}
