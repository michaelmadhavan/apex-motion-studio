import { ExportProgress, ExportSettings, RenderContext, AspectRatioType } from '../types';
import { getResolutionDimensions } from '../utils/layout';
import { SimpleMp4Muxer } from './mp4Muxer';

type WebCodecsWindow = Window & {
  VideoEncoder?: any;
  VideoFrame?: any;
};

export class VideoExportEngine {
  private isCancelled = false;
  private isExporting = false;

  public cancel() {
    if (this.isExporting) this.isCancelled = true;
  }

  public async exportMP4(
    renderFrameFn: (ctx: RenderContext) => void,
    images: HTMLImageElement[],
    settings: ExportSettings,
    aspectRatio: AspectRatioType,
    durationSeconds: number,
    onProgress: (p: ExportProgress) => void
  ): Promise<Blob> {
    if (this.isExporting) {
      throw new Error('An export is already in progress');
    }

    this.isExporting = true;
    this.isCancelled = false;
    let exportCanvas: HTMLCanvasElement | null = null;

    try {
      const { width, height } =
        settings.resolution === 'custom'
          ? { width: settings.width, height: settings.height }
          : getResolutionDimensions(settings.resolution, aspectRatio);
      if (typeof width !== 'number' || typeof height !== 'number') {
        throw new Error('Custom video width and height are required.');
      }
      this.validateSettings(width, height, settings.frameRate, settings.bitrateMbps, durationSeconds);

      const videoCodecs = window as WebCodecsWindow;
      const VideoEncoderClass = videoCodecs.VideoEncoder;
      const VideoFrameClass = videoCodecs.VideoFrame;
      if (
        typeof VideoEncoderClass !== 'function' ||
        typeof VideoEncoderClass.isConfigSupported !== 'function' ||
        typeof VideoFrameClass !== 'function'
      ) {
        throw new Error(
          'MP4 export is unavailable in this browser. Use a recent Chrome or Edge build, or another browser/device that supports WebCodecs H.264.'
        );
      }

      const fps = settings.frameRate;
      const frameCount = Math.round(durationSeconds * fps);
      const totalFrames = Math.max(1, frameCount);
      const bitrate = Math.round(settings.bitrateMbps * 1_000_000);
      const offCanvas = document.createElement('canvas');
      exportCanvas = offCanvas;
      offCanvas.width = width;
      offCanvas.height = height;
      const ctx = offCanvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not create the export canvas context');

      const muxer = new SimpleMp4Muxer({
        width,
        height,
        timescale: 1_000_000,
        defaultFrameDuration: Math.round(1_000_000 / fps),
      });
      let callbackError: Error | null = null;
      const encoderConfig = await this.getSupportedEncoderConfig(
        VideoEncoderClass,
        width,
        height,
        fps,
        bitrate
      );
      const encoder = new VideoEncoderClass({
        output: (chunk: any, metadata: any) => {
          try {
            const description = metadata?.decoderConfig?.description;
            if (description) muxer.setVideoDecoderConfig(description);
            muxer.addVideoChunk(chunk);
          } catch (error) {
            callbackError = error instanceof Error ? error : new Error(String(error));
          }
        },
        error: (error: Error) => {
          callbackError = error instanceof Error ? error : new Error(String(error));
        },
      });

      try {
        encoder.configure(encoderConfig);

        onProgress({
          currentFrame: 0,
          totalFrames,
          percentage: 0,
          status: 'rendering',
        });

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex += 1) {
          this.throwIfCancelled();
          this.throwIfEncoderFailed(callbackError);

          const timestamp = Math.round((frameIndex * 1_000_000) / fps);
          const nextTimestamp = Math.round(((frameIndex + 1) * 1_000_000) / fps);
          const currentTime = timestamp / 1_000_000;

          renderFrameFn({
            ctx,
            width,
            height,
            images,
            time: currentTime,
            progress: Math.min(1, currentTime / durationSeconds),
            aspectRatio,
          });

          const videoFrame = new VideoFrameClass(offCanvas, {
            timestamp,
            duration: nextTimestamp - timestamp,
          });
          try {
            encoder.encode(videoFrame, { keyFrame: frameIndex % (fps * 2) === 0 });
          } finally {
            videoFrame.close();
          }

          if ((frameIndex + 1) % 4 === 0 || frameIndex === totalFrames - 1) {
            onProgress({
              currentFrame: frameIndex + 1,
              totalFrames,
              percentage: Math.round(((frameIndex + 1) / totalFrames) * 90),
              status: 'encoding',
            });
            await encoder.flush();
            this.throwIfCancelled();
            this.throwIfEncoderFailed(callbackError);
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
          }
        }

        onProgress({
          currentFrame: totalFrames,
          totalFrames,
          percentage: 95,
          status: 'finalizing',
        });

        await encoder.flush();
        this.throwIfCancelled();
        this.throwIfEncoderFailed(callbackError);
        const mp4Blob = muxer.finalize();
        if (mp4Blob.type !== 'video/mp4' || mp4Blob.size === 0) {
          throw new Error('MP4 finalization did not produce a non-empty MP4 file');
        }

        onProgress({
          currentFrame: totalFrames,
          totalFrames,
          percentage: 100,
          status: 'completed',
        });
        return mp4Blob;
      } finally {
        if (encoder.state !== 'closed') encoder.close();
      }
    } finally {
      if (exportCanvas) {
        exportCanvas.width = 0;
        exportCanvas.height = 0;
      }
      this.isExporting = false;
      this.isCancelled = false;
    }
  }

  private validateSettings(
    width: number | undefined,
    height: number | undefined,
    fps: number,
    bitrateMbps: number,
    durationSeconds: number
  ) {
    if (
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 16 ||
      height < 16 ||
      width > 8192 ||
      height > 8192 ||
      width % 2 !== 0 ||
      height % 2 !== 0 ||
      width * height > 33_554_432
    ) {
      throw new Error('Video dimensions must be even integers between 16 and 8192 pixels, with at most 8K UHD total pixels.');
    }
    if (fps !== 30 && fps !== 60) {
      throw new Error('Frame rate must be either 30 or 60 FPS.');
    }
    if (!Number.isFinite(bitrateMbps) || bitrateMbps < 1 || bitrateMbps > 60) {
      throw new Error('Target bitrate must be between 1 and 60 Mbps.');
    }
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error('Animation duration must be greater than zero.');
    }
  }

  private async getSupportedEncoderConfig(
    VideoEncoderClass: any,
    width: number,
    height: number,
    framerate: number,
    bitrate: number
  ): Promise<Record<string, unknown>> {
    const level = width * height >= 3_000_000
      ? (framerate > 30 ? '34' : '33')
      : '2a';
    const codecs = width * height >= 3_000_000
      ? [`avc1.6400${level}`, `avc1.4d00${level}`]
      : [`avc1.4d00${level}`, `avc1.4200${level}`, 'avc1.42001f'];

    for (const codec of codecs) {
      const config = {
        codec,
        width,
        height,
        bitrate,
        framerate,
        latencyMode: 'realtime',
        avc: { format: 'avc' },
      };
      try {
        const support = await VideoEncoderClass.isConfigSupported(config);
        if (support.supported) return support.config ?? config;
      } catch {
        // Continue checking other H.264 profiles supported by the browser.
      }
    }

    throw new Error(
      `This browser or device cannot encode H.264 at ${width} × ${height} and ${framerate} FPS. Try a lower resolution or a browser with hardware H.264 WebCodecs support.`
    );
  }

  private throwIfCancelled() {
    if (this.isCancelled) throw new Error('Export cancelled by user');
  }

  private throwIfEncoderFailed(error: Error | null) {
    if (error) throw error;
  }
}
