const MAX_BYTES = 2 * 1024 * 1024; // 2MB, per the Figma upload hints.

/**
 * Reads a picked image into a data URL so the prototype can persist it in
 * localStorage alongside the rest of the settings. Resolves to an empty
 * string when the file is missing, not an image, or over the size cap.
 */
export const readImageFile = (file) =>
  new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.size > MAX_BYTES) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
