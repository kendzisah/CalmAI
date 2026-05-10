type ChimeName = 'hero' | 'relief' | 'paywall_success';

const CHIME_VOLUME: Record<ChimeName, number> = {
  hero: 0.35,
  relief: 0.4,
  paywall_success: 0.5,
};

let cachedSource: unknown = undefined;

function getChimeSource(): unknown {
  if (cachedSource !== undefined) return cachedSource;
  try {
    cachedSource = require('../../assets/sounds/chime.mp3');
  } catch {
    cachedSource = null;
  }
  return cachedSource;
}

export async function playChime(name: ChimeName): Promise<void> {
  try {
    const source = getChimeSource();
    if (!source) return;

    const expoAv = await import('expo-av').catch(() => null);
    if (!expoAv) return;

    const { sound } = await expoAv.Audio.Sound.createAsync(source as never, {
      volume: CHIME_VOLUME[name],
      shouldPlay: true,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    // Audio is polish — never let it surface as a user-visible failure.
  }
}
