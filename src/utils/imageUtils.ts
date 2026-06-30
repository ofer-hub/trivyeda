const SIZE = 128;
const MAX_BYTES = 20 * 1024;

export function processAvatarImage(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }

        const srcSize = Math.min(img.width, img.height);
        const srcX = (img.width - srcSize) / 2;
        const srcY = (img.height - srcSize) / 2;
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);

        for (const quality of [0.75, 0.5, 0.35]) {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length * 0.75 <= MAX_BYTES) {
            resolve(dataUrl);
            return;
          }
        }
        resolve(null);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}
