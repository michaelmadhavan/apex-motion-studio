import { ExportProgress, ExportSettings, RenderContext, AspectRatioType } from '../types';
import { getResolutionDimensions } from '../utils/layout';
import { SimpleMp4Muxer } from './mp4Muxer';

export class VideoExportEngine {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportMP4(
    renderFrameFn: (ctx: RenderContext) => void,
    images: HTMLImageElement[],
    settings: ExportSettings,
    aspectRatio: AspectRatioType,
    durationSeconds: number,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob> {
    this.isCancelled = false;

    const { width, height } = getResolutionDimensions(settings.resolution, aspectRatio);
    const fps = settings.frameRate || 30;
    const totalFrames = Math.max(1, Math.round(durationSeconds * fps));

    // Try Path 1: WebCodecs VideoEncoder with ISO BMFF MP4 Muxer (Pure frame-by-frame deterministic rendering)
    if (typeof (window as any).VideoEncoder === 'function') {
      try {
        return await this.exportWithWebCodecs(
          renderFrameFn,
          images,
          settings,
          aspectRatio,
          durationSeconds,
          width,
          height,
          fps,
          totalFrames,
          onProgress
        );
      } catch (err: any) {
        if (this.isCancelled) throw err;
        console.warn('WebCodecs encoder encountered an issue, checking genuine MP4 MediaRecorder...', err);
        // Fall through to Path 2 if available
      }
    }

    // Path 2: MediaRecorder with native MP4 container
    if (typeof window.MediaRecorder === 'function' && window.MediaRecorder.isTypeSupported('video/mp4')) {
      return await this.exportWithMediaRecorder(
        renderFrameFn,
        images,
        settings,
        aspectRatio,
        durationSeconds,
        width,
        height,
        fps,
        totalFrames,
        onProgress
      );
    }

    // If genuine MP4 is completely unavailable on this engine
    throw new Error(
      'Genuine MP4 hardware encoding requires standard WebCodecs or MP4 MediaRecorder (supported in Google Chrome, Microsoft Edge, Brave, Opera, and Safari 16.4+). WebM conversion was rejected to ensure authentic MP4 video integrity.'
    );
  }

  private async exportWithWebCodecs(
    renderFrameFn: (ctx: RenderContext) => void,
    images: HTMLImageElement[],
    settings: ExportSettings,
    aspectRatio: AspectRatioType,
    durationSeconds: number,
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob> {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not create offscreen 2D canvas context');

    const muxer = new SimpleMp4Muxer({ width, height });
    let encoderError: Error | null = null;

    const VideoEncoderClass = (window as any).VideoEncoder;
    const VideoFrameClass = (window as any).VideoFrame;

    const encoder = new VideoEncoderClass({
      output: (chunk: any, metadata: any) => {
        if (metadata?.decoderConfig?.description) {
          muxer.setVideoDecoderConfig(metadata.decoderConfig.description);
        }
        muxer.addVideoChunk(chunk);
      },
      error: (e: any) => {
        console.error('VideoEncoder error:', e);
        encoderError = e instanceof Error ? e : new Error(String(e));
      },
    });

    const bitrate = (settings.bitrateMbps || (settings.resolution === '4K' ? 35 : 18)) * 1_000_000;

    // AVC level selection based on resolution
    const codecCandidates = [
      settings.resolution === '4K' ? 'avc1.640033' : 'avc1.4d002a', // High/Main profile
      'avc1.42001f', // Baseline profile
      'avc1.42001e',
    ];

    let configured = false;
    for (const codec of codecCandidates) {
      try {
        encoder.configure({
          codec,
          width,
          height,
          bitrate,
          framerate: fps,
          avc: { format: 'avc' },
        });
        configured = true;
        break;
      } catch (e) {
        // Continue to fallback codec
      }
    }

    if (!configured) {
      throw new Error('No compatible H.264 video codec found on this device');
    }

    onProgress({
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      status: 'rendering',
    });

    const frameDurationMicros = Math.round(1_000_000 / fps);

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        encoder.close();
        throw new Error('Export cancelled by user');
      }

      if (encoderError) {
        encoder.close();
        throw encoderError;
      }

      const currentTime = frameIndex / fps;
      const progress = durationSeconds > 0 ? currentTime / durationSeconds : 0;

      // Render exact frame
      renderFrameFn({
        ctx,
        width,
        height,
        images,
        time: currentTime,
        progress,
        aspectRatio,
      });

      // Construct VideoFrame
      const videoFrame = new VideoFrameClass(offCanvas, {
        timestamp: frameIndex * frameDurationMicros,
        duration: frameDurationMicros,
      });

      const isKeyframe = frameIndex % (fps * 2) === 0;
      encoder.encode(videoFrame, { keyFrame: isKeyframe });
      videoFrame.close();

      // Yield event loop every 4 frames so UI stays responsive and updates progress
      if (frameIndex % 4 === 0 || frameIndex === totalFrames - 1) {
        onProgress({
          currentFrame: frameIndex + 1,
          totalFrames,
          percentage: Math.round(((frameIndex + 1) / totalFrames) * 90),
          status: 'rendering',
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress({
      currentFrame: totalFrames,
      totalFrames,
      percentage: 95,
      status: 'finalizing',
    });

    await encoder.flush();
    encoder.close();

    const mp4Blob = muxer.finalize();
    if (mp4Blob.size < 1000) {
      throw new Error('Generated MP4 file is empty or corrupted');
    }

    onProgress({
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      status: 'completed',
    });

    return mp4Blob;
  }

  private async exportWithMediaRecorder(
    renderFrameFn: (ctx: RenderContext) => void,
    images: HTMLImageElement[],
    settings: ExportSettings,
    aspectRatio: AspectRatioType,
    durationSeconds: number,
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob> {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not create offscreen canvas');

    const stream = offCanvas.captureStream(fps);
    const recordedChunks: Blob[] = [];

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/mp4',
      videoBitsPerSecond: (settings.bitrateMbps || 18) * 1_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start();

    const intervalMs = 1000 / fps;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        recorder.stop();
        throw new Error('Export cancelled by user');
      }

      const currentTime = frameIndex / fps;
      const progress = durationSeconds > 0 ? currentTime / durationSeconds : 0;

      renderFrameFn({
        ctx,
        width,
        height,
        images,
        time: currentTime,
        progress,
        aspectRatio,
      });

      if (frameIndex % 5 === 0) {
        onProgress({
          currentFrame: frameIndex + 1,
          totalFrames,
          percentage: Math.round(((frameIndex + 1) / totalFrames) * 92),
          status: 'rendering',
        });
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        if (blob.size < 1000) {
          reject(new Error('MediaRecorder MP4 output was too small'));
          return;
        }
        onProgress({
          currentFrame: totalFrames,
          totalFrames,
          percentage: 100,
          status: 'completed',
        });
        resolve(blob);
      };
      recorder.onerror = (e) => reject(e);
      recorder.stop();
    });
  }
}
