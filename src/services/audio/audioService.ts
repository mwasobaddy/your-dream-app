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
 * Returned by startCapture — the caller can stop early (press-release)
 * or let the timeout fire automatically.
 */
interface CaptureController {
  result: Promise<CaptureResult>;
  stop: () => void;
}

/**
 * audioService — Service Pattern wrapper for microphone capture and prosody extraction.
 * Components/hooks must call this service rather than touching getUserMedia directly.
 *
 * Capture uses the MediaRecorder API for clean, contiguous audio, then decodes
 * with AudioContext.decodeAudioData. The raw buffer is discarded immediately
 * after extractProsody — never persisted.
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

  startCapture(durationMs = CAPTURE.DURATION_MS): CaptureController {
    let stopFn: () => void = () => {};
    let resolveResult: (value: CaptureResult | PromiseLike<CaptureResult>) => void;
    const resultPromise = new Promise<CaptureResult>((resolve) => {
      resolveResult = resolve;
    });

    const controller: CaptureController = {
      result: resultPromise,
      stop: () => stopFn(),
    };

    (async () => {
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
        resolveResult({
          buffer: new Float32Array(0),
          sampleRate: YIN_CONFIG.SAMPLE_RATE,
          permission: "denied",
        });
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      let finished = false;

      // Wire up the stop function
      stopFn = () => {
        if (recorder.state !== "inactive") {
          finished = true;
          recorder.stop();
        }
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const arrayBuffer = await blob.arrayBuffer();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        const ctx = new AudioCtx();
        await ctx.resume();

        try {
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          const sampleRate = audioBuffer.sampleRate;
          const channelData = audioBuffer.getChannelData(0);
          ctx.close();
          resolveResult({ buffer: channelData, sampleRate, permission: "granted" });
        } catch {
          ctx.close();
          resolveResult({
            buffer: new Float32Array(0),
            sampleRate: YIN_CONFIG.SAMPLE_RATE,
            permission: "denied",
          });
        }
      };

      recorder.start();

      // Auto-stop after max duration (safety net for hold-to-record)
      setTimeout(() => {
        if (!finished && recorder.state !== "inactive") {
          finished = true;
          recorder.stop();
        }
      }, durationMs);
    })();

    return controller;
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
      if (yinResult.pitch_hz !== null && energyDb > -60) {
        pitches.push(yinResult.pitch_hz);
        voicedFrames++;
      }
    }

    const overallEnergyDb = computeRMSdb(buffer);
    const snrDb = estimateSNRdb(frameEnergies.filter((e) => isFinite(e)));
    const voicedRatio = totalFrames > 0 ? voicedFrames / totalFrames : 0;

    // Debug: log capture metrics to help diagnose quality issues
    console.log("[audioService] capture metrics:", {
      bufferLength: buffer.length,
      sampleRate,
      totalFrames,
      voicedFrames,
      voicedRatio: voicedRatio.toFixed(3),
      overallEnergyDb: overallEnergyDb?.toFixed(1),
      snrDb: snrDb?.toFixed(1),
    });
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
