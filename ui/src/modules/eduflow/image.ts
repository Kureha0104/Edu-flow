/**
 * Reads a notebook photo, downsizes it to fit the demo's MongoDB document,
 * and returns a JPEG data URL. Keeps uploads around 100–300 KB.
 */
export const fileToCompressedDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose an image file (JPG, PNG or WebP)."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const source = reader.result;
      if (typeof source !== "string") {
        reject(new Error("Could not read that file."));
        return;
      }

      const image = new Image();
      image.onerror = () => reject(new Error("Could not open that image."));
      image.onload = () => {
        const maxSide = 1000;
        const scale = Math.min(
          1,
          maxSide / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Your browser cannot prepare this image."));
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.src = source;
    };

    reader.readAsDataURL(file);
  });
