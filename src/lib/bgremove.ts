// On-device background removal (subject cutout) via @imgly/background-removal.
// ONNX-based (ISNet), runs fully client-side; weights (~40 MB, isnet_quint8)
// download from CDN on first use. Dynamically imported + module-level
// singleton so the entry bundle stays lean. Any failure → null (caller
// falls back to the plain bbox crop).

type RemoveFn = (image: Blob, config?: Record<string, unknown>) => Promise<Blob>

let removerPromise: Promise<RemoveFn> | null = null

function getRemover(): Promise<RemoveFn> {
  if (!removerPromise) {
    removerPromise = (async () => {
      const mod = await import('@imgly/background-removal')
      return mod.removeBackground as unknown as RemoveFn
    })()
    // allow retry on next snap if this load fails
    removerPromise.catch(() => {
      removerPromise = null
    })
  }
  return removerPromise
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((r) => r.blob())
}

function blobToPngDataUrl(blob: Blob): Promise<string | null> {
  return createImageBitmap(blob)
    .then((bmp) => {
      const scale = Math.min(1, 480 / bmp.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bmp.width * scale))
      canvas.height = Math.max(1, Math.round(bmp.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        bmp.close()
        return null
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height)
      bmp.close()
      return canvas.toDataURL('image/png')
    })
    .catch(() => null)
}

/**
 * Cut the subject out of a cropped photo → transparent PNG data URL (≤480px).
 * Returns null when the model can't load (offline) or segmentation fails.
 */
export async function cutoutSubject(cropDataUrl: string): Promise<string | null> {
  try {
    const removeBackground = await getRemover()
    const inputBlob = await dataUrlToBlob(cropDataUrl)
    const outBlob = await removeBackground(inputBlob, {
      model: 'isnet_quint8',
      output: { format: 'image/png' },
    })
    return await blobToPngDataUrl(outBlob)
  } catch {
    return null
  }
}
