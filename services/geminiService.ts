import { GoogleGenAI, Modality } from "@google/genai";

const AI_KEY = process.env.API_KEY || '';

// Initialize Audio Context lazily to handle browser autoplay policies
let audioContext: AudioContext | null = null;
const audioCache = new Map<string, AudioBuffer>();

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// Helper to decode base64
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to decode audio data
const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const fetchAndCacheAudio = async (text: string, voiceName: string): Promise<AudioBuffer | null> => {
  const cacheKey = `${text}:${voiceName}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  if (!AI_KEY) {
    console.warn("No API Key found for TTS");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: AI_KEY });
    
    // Using the dedicated TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName as any },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      const ctx = getAudioContext();
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1,
      );
      audioCache.set(cacheKey, audioBuffer);
      return audioBuffer;
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
  return null;
};

export const preloadText = async (text: string, voiceName: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' = 'Kore') => {
  await fetchAndCacheAudio(text, voiceName);
};

export const speakText = async (text: string, voiceName: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' = 'Kore') => {
  const audioBuffer = await fetchAndCacheAudio(text, voiceName);

  if (audioBuffer) {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const outputNode = ctx.createGain();
    outputNode.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();
  }
};