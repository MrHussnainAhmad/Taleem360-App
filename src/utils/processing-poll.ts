export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new Error('Processing cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

export async function pollVideoProcessing(
  load: (signal: AbortSignal) => Promise<{ status: string; videoUrl?: string; error?: string }>,
  options: { signal: AbortSignal; waitUntilActive: () => Promise<void>; delay?: typeof abortableDelay },
): Promise<string> {
  // Five-second checks initially, then 10/15/20 seconds. Roughly the same
  // active processing window with at most 36 reads, rather than 120.
  for (let attempt = 0; attempt < 36; attempt += 1) {
    await options.waitUntilActive();
    if (options.signal.aborted) throw new Error('Processing cancelled');
    const status = await load(options.signal);
    if (status.status === 'READY' && status.videoUrl) return status.videoUrl;
    if (status.status === 'ERROR') throw new Error(status.error || 'The provider could not process this video');
    if (attempt < 35) await (options.delay || abortableDelay)(Math.min(5000 * (1 + Math.floor(attempt / 3)), 20_000), options.signal);
  }
  throw new Error('Video is still processing. Resume processing shortly; the uploaded video is saved.');
}
