import type { VoiceProsodyFeatures, CaptureValidity } from "@/types/session";
import { computePitch } from "@/lib/yin/algorithm";
import { computeRMSdb, mean, stdDev, estimateSNRdb } from "@/lib/yin/rms";
import { evaluateQuality } from "@/lib/yin/quality-gate";
import { YIN_CONFIG, CAPTURE } from "@/lib/config";

const YIN_PARAMS = {
  sample_rate: YIN_CONFIG.SAMPLE_RATE,
  buffer_size: YIN_CONFIG.BUFFER_SIZE,
  pitch_floor_hz: YIN_CONFIG.PITCH_FLOOR_HZ,
  pitch_ceiling_hz: YIN_CONFIG.PITCH_CEILING_HZ,
  threshold: YIN_CONFIG.THRESHOLD,
};

interface CaptureResult {
  buffer: Float32Array;
  sampleRate: number;
  permission: "granted" | "denied";
}

/**
 * audioService — Service Pattern wrapper for microphone capture and prosody extraction.
 * Components/hooks must call this service rather than touching getUserMedia directly.
 *
 * Note: We use a ScriptProcessor-style capture (collecting frames from getUserMedia)
 * rather than an AudioWorklet here, because the YIN math is run AFTER capture on the
 * full buffer for accuracy. The buffer is discarded immediately after extractProsody.
 */
export const audioService = {
  async requestPermission(): Promise<"granted" | "denied"> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return "granted";
    } catch {
      return "denied";
    }
  },

  async startCapture(durationMs = CAPTURE.DURATION_MS): Promise<CaptureResult> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });
    } catch {
      return {
        buffer: new Float32Array(0),
        sampleRate: YIN_CONFIG.SAMPLE_RATE,
        permission: "denied",
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);

    // Collect audio via an AnalyserNode time-domain pull loop
    const analyser = ctx.createAnalyser();
    analyser.fftSize = YIN_CONFIG.BUFFER_SIZE;
    source.connect(analyser);

    const sampleRate = ctx.sampleRate;
    const totalSamples = Math.floor((durationMs / 1000) * sampleRate);
    const collected = new Float32Array(totalSamples);
    let writeIdx = 0;

    return new Promise<CaptureResult>((resolve) => {
      const frame = new Float32Array(analyser.fftSize);
      const tick = () => {
        analyser.getFloatTimeDomainData(frame);
        const remaining = totalSamples - writeIdx;
        const take = Math.min(remaining, frame.length);
        collected.set(frame.subarray(0, take), writeIdx);
        writeIdx += take;
        if (writeIdx < totalSamples) {
          requestAnimationFrame(tick);
        } else {
          stream.getTracks().forEach((t) => t.stop());
          ctx.close();
          resolve({ buffer: collected, sampleRate, permission: "granted" });
        }
      };
      requestAnimationFrame(tick);
    });
  },

  extractProsody(capture: CaptureResult): VoiceProsodyFeatures {
    if (capture.permission === "denied") {
      return {
        pitch_mean_hz: null,
        pitch_sd_hz: null,
        energy_rms_db: null,
        validity: "permission_denied" as CaptureValidity,
        yin_params: YIN_PARAMS,
      };
    }

    const { buffer, sampleRate } = capture;
    const win = YIN_CONFIG.BUFFER_SIZE;
    const hop = Math.floor(win / 2);
    const pitches: number[] = [];
    const frameEnergies: number[] = [];
    let voicedFrames = 0;
    let totalFrames = 0;

    for (let off = 0; off + win <= buffer.length; off += hop) {
      const frame = buffer.subarray(off, off + win);
      const energyDb = computeRMSdb(frame);
      frameEnergies.push(energyDb);
      const yinResult = computePitch(
        frame,
        sampleRate,
        YIN_CONFIG.PITCH_FLOOR_HZ,
        YIN_CONFIG.PITCH_CEILING_HZ,
        YIN_CONFIG.THRESHOLD
      );
      totalFrames++;
      if (yinResult.pitch_hz !== null && energyDb > -50) {
        pitches.push(yinResult.pitch_hz);
        voicedFrames++;
      }
    }

    const overallEnergyDb = computeRMSdb(buffer);
    const snrDb = estimateSNRdb(frameEnergies.filter((e) => isFinite(e)));
    const voicedRatio = totalFrames > 0 ? voicedFrames / totalFrames : 0;
    const validity = evaluateQuality({ snrDb, voicedFramesRatio: voicedRatio });

    return {
      pitch_mean_hz: pitches.length > 0 ? mean(pitches) : null,
      pitch_sd_hz: pitches.length > 1 ? stdDev(pitches) : null,
      energy_rms_db: isFinite(overallEnergyDb) ? overallEnergyDb : null,
      validity,
      yin_params: YIN_PARAMS,
    };
    // The raw buffer goes out of scope here and is GC'd. Never persisted.
  },
};
