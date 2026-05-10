// Plays inhale / exhale sounds during breathing sessions.
// Sounds are loaded once and replayed from start on each phase change.
// Respects the global mute state in `useBreathingAudioStore`.

import { useBreathingAudioStore } from '@/stores/breathingAudioStore';

type BreathSound = 'inhale' | 'exhale';

let inhaleSound: any = null;
let exhaleSound: any = null;
let loadPromise: Promise<void> | null = null;

function getSource(name: BreathSound): unknown | null {
  try {
    if (name === 'inhale') return require('../../assets/sounds/inhale.mp3');
    return require('../../assets/sounds/exhale.mp3');
  } catch {
    return null;
  }
}

async function ensureLoaded(): Promise<void> {
  if (inhaleSound && exhaleSound) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const expoAv = await import('expo-av').catch(() => null);
      if (!expoAv) return;

      const { Audio } = expoAv;
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      }).catch(() => {});

      const inhaleSrc = getSource('inhale');
      const exhaleSrc = getSource('exhale');

      if (inhaleSrc) {
        const result = await Audio.Sound.createAsync(inhaleSrc as never, { volume: 0.6 });
        inhaleSound = result.sound;
      }
      if (exhaleSrc) {
        const result = await Audio.Sound.createAsync(exhaleSrc as never, { volume: 0.6 });
        exhaleSound = result.sound;
      }
    } catch {
      // Audio is enhancement — fail silently if anything goes wrong.
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

async function playOne(sound: any | null): Promise<void> {
  if (!sound) return;
  if (useBreathingAudioStore.getState().muted) return;
  try {
    await sound.stopAsync().catch(() => {});
    await sound.setPositionAsync(0).catch(() => {});
    await sound.playAsync();
  } catch {
    // Silent — playback errors shouldn't surface in the breathing UI.
  }
}

export async function preloadBreathingAudio(): Promise<void> {
  await ensureLoaded();
}

export async function playInhale(): Promise<void> {
  await ensureLoaded();
  await playOne(inhaleSound);
}

export async function playExhale(): Promise<void> {
  await ensureLoaded();
  await playOne(exhaleSound);
}

export async function stopBreathingAudio(): Promise<void> {
  try {
    await inhaleSound?.stopAsync().catch(() => {});
    await exhaleSound?.stopAsync().catch(() => {});
  } catch {
    // ignore
  }
}

export async function unloadBreathingAudio(): Promise<void> {
  try {
    await inhaleSound?.unloadAsync().catch(() => {});
    await exhaleSound?.unloadAsync().catch(() => {});
  } catch {
    // ignore
  } finally {
    inhaleSound = null;
    exhaleSound = null;
  }
}
