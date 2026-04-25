/**
 * Loads an image from a public/ path. Browsers' {@code Image()} is async, so
 * sprite-loading code returns Promises that callers await before drawing.
 */
export function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
    img.src = path;
  });
}
