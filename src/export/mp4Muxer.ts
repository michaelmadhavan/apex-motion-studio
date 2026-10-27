/**
 * ISO BMFF (MP4) Muxer for WebCodecs VideoEncoder output.
 * Creates genuine H.264 MP4 files compatible with QuickTime, VLC, Chrome, iOS, and Premiere.
 */

export interface MuxerChunk {
  data: Uint8Array;
  type: 'key' | 'delta';
  timestamp: number; // in microseconds
  duration: number; // in microseconds
}

export class SimpleMp4Muxer {
  private static readonly maxOutputBytes = 256 * 1024 * 1024;
  private width: number;
  private height: number;
  private timescale: number;
  private defaultFrameDuration: number;
  private chunks: MuxerChunk[] = [];
  private avcCDescription: Uint8Array | null = null;
  private totalEncodedBytes = 0;

  constructor(options: {
    width: number;
    height: number;
    timescale?: number;
    defaultFrameDuration?: number;
  }) {
    this.width = options.width;
    this.height = options.height;
    this.timescale = options.timescale ?? 1_000_000;
    this.defaultFrameDuration = options.defaultFrameDuration ?? 33_333;
  }

  public setVideoDecoderConfig(description: ArrayBuffer | Uint8Array) {
    const config = new Uint8Array(description);
    if (config.length < 7 || config[0] !== 1) {
      throw new Error('The H.264 encoder did not provide a valid AVC decoder configuration');
    }
    this.avcCDescription = config;
  }

  public addVideoChunk(chunk: { type: 'key' | 'delta'; byteLength: number; copyTo: (dest: Uint8Array) => void; timestamp: number; duration?: number }) {
    if (chunk.byteLength <= 0) return;
    if (this.totalEncodedBytes + chunk.byteLength > SimpleMp4Muxer.maxOutputBytes) {
      throw new Error('MP4 export exceeded the 256 MB in-memory file limit. Reduce the duration, bitrate, or resolution and try again.');
    }
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    this.totalEncodedBytes += chunk.byteLength;
    this.chunks.push({
      data,
      type: chunk.type,
      timestamp: chunk.timestamp,
      duration: chunk.duration ?? this.defaultFrameDuration,
    });
  }

  public finalize(): Blob {
    if (this.chunks.length === 0) {
      throw new Error('No video frames were encoded');
    }
    if (!this.avcCDescription) {
      throw new Error('The H.264 encoder did not provide the configuration required to finalize MP4');
    }

    const durationInMicros = this.chunks.reduce(
      (end, chunk) => Math.max(end, chunk.timestamp + chunk.duration),
      0
    );
    const durationInTimescale = Math.round((durationInMicros / 1_000_000) * this.timescale);

    // 1. Build ftyp box
    const ftypBox = this.createFtypBox();

    // 2. Prepare mdat data & measure sizes
    let totalMdatSize = 0;
    const chunkSizes: number[] = [];
    for (const c of this.chunks) {
      totalMdatSize += c.data.byteLength;
      chunkSizes.push(c.data.byteLength);
    }
    if (totalMdatSize + 8 > 0xffffffff) {
      throw new Error('The MP4 is too large for this browser to finalize safely');
    }

    // mdat header: 8 bytes (4 bytes size, 4 bytes 'mdat')
    const mdatHeader = new Uint8Array(8);
    const mdatTotalLength = 8 + totalMdatSize;
    new DataView(mdatHeader.buffer).setUint32(0, mdatTotalLength);
    mdatHeader.set([0x6d, 0x64, 0x61, 0x74], 4); // 'mdat'

    // Compute exact mdat start offset
    const ftypLength = ftypBox.byteLength;
    // Dry-run moov box generation to get its exact size
    const dummyMoov = this.createMoovBox(durationInTimescale, chunkSizes, 0);
    const mdatDataOffset = ftypLength + dummyMoov.byteLength + 8;

    // Real moov with true chunk offsets
    const moovBox = this.createMoovBox(durationInTimescale, chunkSizes, mdatDataOffset);

    // Assemble final MP4 binary
    const parts: BlobPart[] = [ftypBox as unknown as BlobPart, moovBox as unknown as BlobPart, mdatHeader as unknown as BlobPart];
    for (const c of this.chunks) {
      parts.push(c.data as unknown as BlobPart);
    }

    return new Blob(parts, { type: 'video/mp4' });
  }

  private createFtypBox(): Uint8Array {
    const majorBrand = 'mp42';
    const minorVersion = 0;
    const compatibleBrands = ['isom', 'mp41', 'mp42'];

    const length = 16 + compatibleBrands.length * 4;
    const buf = new Uint8Array(length);
    const view = new DataView(buf.buffer);

    view.setUint32(0, length);
    buf.set([0x66, 0x74, 0x79, 0x70], 4); // 'ftyp'
    for (let i = 0; i < 4; i++) buf[8 + i] = majorBrand.charCodeAt(i);
    view.setUint32(12, minorVersion);

    for (let i = 0; i < compatibleBrands.length; i++) {
      const brand = compatibleBrands[i];
      for (let j = 0; j < 4; j++) buf[16 + i * 4 + j] = brand.charCodeAt(j);
    }

    return buf;
  }

  private createMoovBox(duration: number, chunkSizes: number[], mdatStartOffset: number): Uint8Array {
    const mvhd = this.createMvhdBox(duration);
    const trak = this.createTrakBox(duration, chunkSizes, mdatStartOffset);
    return this.box('moov', [mvhd, trak]);
  }

  private createMvhdBox(duration: number): Uint8Array {
    const buf = new Uint8Array(108);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 108);
    buf.set([0x6d, 0x76, 0x68, 0x64], 4); // 'mvhd'
    view.setUint32(20, this.timescale);
    view.setUint32(24, duration);
    view.setUint32(28, 0x00010000); // 1.0 rate
    view.setUint16(32, 0x0100); // 1.0 volume

    // Matrix
    view.setUint32(44, 0x00010000);
    view.setUint32(60, 0x00010000);
    view.setUint32(76, 0x40000000);

    view.setUint32(104, 2); // next track ID
    return buf;
  }

  private createTrakBox(duration: number, chunkSizes: number[], mdatStartOffset: number): Uint8Array {
    const tkhd = this.createTkhdBox(duration);
    const mdia = this.createMdiaBox(duration, chunkSizes, mdatStartOffset);
    return this.box('trak', [tkhd, mdia]);
  }

  private createTkhdBox(duration: number): Uint8Array {
    const buf = new Uint8Array(92);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 92);
    buf.set([0x74, 0x6b, 0x68, 0x64], 4); // 'tkhd'
    view.setUint32(8, 0x00000003); // enabled & in movie
    view.setUint32(20, 1); // track ID = 1
    view.setUint32(28, duration);

    // Matrix
    view.setUint32(48, 0x00010000);
    view.setUint32(64, 0x00010000);
    view.setUint32(80, 0x40000000);

    view.setUint32(84, this.width << 16);
    view.setUint32(88, this.height << 16);
    return buf;
  }

  private createMdiaBox(duration: number, chunkSizes: number[], mdatStartOffset: number): Uint8Array {
    const mdhd = this.createMdhdBox(duration);
    const hdlr = this.createHdlrBox();
    const minf = this.createMinfBox(chunkSizes, mdatStartOffset);
    return this.box('mdia', [mdhd, hdlr, minf]);
  }

  private createMdhdBox(duration: number): Uint8Array {
    const buf = new Uint8Array(32);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 32);
    buf.set([0x6d, 0x64, 0x68, 0x64], 4); // 'mdhd'
    view.setUint32(20, this.timescale);
    view.setUint32(24, duration);
    view.setUint16(28, 0x55c4); // language = und
    return buf;
  }

  private createHdlrBox(): Uint8Array {
    const name = 'Apex Video Handler';
    const buf = new Uint8Array(33 + name.length);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x68, 0x64, 0x6c, 0x72], 4); // 'hdlr'
    buf.set([0x76, 0x69, 0x64, 0x65], 16); // 'vide'
    for (let i = 0; i < name.length; i++) buf[32 + i] = name.charCodeAt(i);
    buf[32 + name.length] = 0;
    return buf;
  }

  private createMinfBox(chunkSizes: number[], mdatStartOffset: number): Uint8Array {
    const vmhd = this.createVmhdBox();
    const dinf = this.createDinfBox();
    const stbl = this.createStblBox(chunkSizes, mdatStartOffset);
    return this.box('minf', [vmhd, dinf, stbl]);
  }

  private createVmhdBox(): Uint8Array {
    const buf = new Uint8Array(20);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 20);
    buf.set([0x76, 0x6d, 0x68, 0x64], 4); // 'vmhd'
    view.setUint32(8, 0x00000001);
    return buf;
  }

  private createDinfBox(): Uint8Array {
    const dref = new Uint8Array(28);
    const view = new DataView(dref.buffer);
    view.setUint32(0, 28);
    dref.set([0x64, 0x72, 0x65, 0x66], 4); // 'dref'
    view.setUint32(12, 1); // 1 entry
    view.setUint32(16, 12);
    dref.set([0x75, 0x72, 0x6c, 0x20], 20); // 'url '
    view.setUint32(24, 0x00000001);
    return this.box('dinf', [dref]);
  }

  private createStblBox(chunkSizes: number[], mdatStartOffset: number): Uint8Array {
    const stsd = this.createStsdBox();
    const stts = this.createSttsBox();
    const ctts = this.createCttsBox();
    const stsc = this.createStscBox();
    const stsz = this.createStszBox(chunkSizes);
    const stco = this.createStcoBox(chunkSizes, mdatStartOffset);
    const stss = this.createStssBox();

    const parts = [stsd, stts];
    if (ctts) parts.push(ctts);
    parts.push(stsc, stsz, stco);
    if (stss) parts.push(stss);
    return this.box('stbl', parts);
  }

  private createCttsBox(): Uint8Array | null {
    let decodeTimestamp = 0;
    const offsets = this.chunks.map((chunk) => {
      const offset = Math.round((chunk.timestamp / 1_000_000) * this.timescale) - decodeTimestamp;
      decodeTimestamp += Math.max(1, Math.round((chunk.duration / 1_000_000) * this.timescale));
      return offset;
    });
    if (offsets.every((offset) => offset === 0)) return null;

    const runs: Array<{ count: number; offset: number }> = [];
    for (const offset of offsets) {
      if (offset < -0x80000000 || offset > 0x7fffffff) {
        throw new Error('The H.264 encoder produced an unsupported MP4 composition timestamp');
      }
      const previous = runs[runs.length - 1];
      if (previous?.offset === offset) {
        previous.count += 1;
      } else {
        runs.push({ count: 1, offset });
      }
    }

    const buf = new Uint8Array(16 + runs.length * 8);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x63, 0x74, 0x74, 0x73], 4); // 'ctts'
    buf[8] = 1; // version 1 uses signed composition offsets
    view.setUint32(12, runs.length);
    runs.forEach((run, index) => {
      view.setUint32(16 + index * 8, run.count);
      view.setInt32(20 + index * 8, run.offset);
    });
    return buf;
  }

  private createStsdBox(): Uint8Array {
    const avc1 = this.createAvc1Box();
    const buf = new Uint8Array(16 + avc1.byteLength);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x73, 0x74, 0x73, 0x64], 4); // 'stsd'
    view.setUint32(12, 1);
    buf.set(avc1, 16);
    return buf;
  }

  private createAvc1Box(): Uint8Array {
    if (!this.avcCDescription) {
      throw new Error('The H.264 encoder did not provide its AVC decoder configuration');
    }
    const avcCBox = this.box('avcC', [this.avcCDescription]);

    const buf = new Uint8Array(86 + avcCBox.byteLength);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x61, 0x76, 0x63, 0x31], 4); // 'avc1'
    view.setUint16(14, 1); // data reference index
    view.setUint16(32, this.width);
    view.setUint16(34, this.height);
    view.setUint32(36, 0x00480000); // 72 dpi
    view.setUint32(40, 0x00480000);
    view.setUint16(48, 1); // frame count
    view.setUint16(82, 0x0018); // 24-bit depth
    view.setInt16(84, -1);
    buf.set(avcCBox, 86);
    return buf;
  }

  private createSttsBox(): Uint8Array {
    const runs: Array<{ count: number; delta: number }> = [];
    for (const chunk of this.chunks) {
      const delta = Math.max(1, Math.round((chunk.duration / 1_000_000) * this.timescale));
      const previous = runs[runs.length - 1];
      if (previous?.delta === delta) {
        previous.count += 1;
      } else {
        runs.push({ count: 1, delta });
      }
    }

    const buf = new Uint8Array(16 + runs.length * 8);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x73, 0x74, 0x74, 0x73], 4); // 'stts'
    view.setUint32(12, runs.length);
    runs.forEach((run, index) => {
      view.setUint32(16 + index * 8, run.count);
      view.setUint32(20 + index * 8, run.delta);
    });
    return buf;
  }

  private createStscBox(): Uint8Array {
    const buf = new Uint8Array(28);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 28);
    buf.set([0x73, 0x74, 0x73, 0x63], 4); // 'stsc'
    view.setUint32(12, 1);
    view.setUint32(16, 1); // first chunk = 1
    view.setUint32(20, 1); // 1 sample per chunk
    view.setUint32(24, 1); // sample desc index = 1
    return buf;
  }

  private createStszBox(chunkSizes: number[]): Uint8Array {
    const count = chunkSizes.length;
    const buf = new Uint8Array(20 + count * 4);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x73, 0x74, 0x73, 0x7a], 4); // 'stsz'
    view.setUint32(12, 0); // variable sizes
    view.setUint32(16, count);
    for (let i = 0; i < count; i++) {
      view.setUint32(20 + i * 4, chunkSizes[i]);
    }
    return buf;
  }

  private createStcoBox(chunkSizes: number[], mdatStartOffset: number): Uint8Array {
    const count = chunkSizes.length;
    const buf = new Uint8Array(16 + count * 4);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x73, 0x74, 0x63, 0x6f], 4); // 'stco'
    view.setUint32(12, count);
    let curOffset = mdatStartOffset;
    for (let i = 0; i < count; i++) {
      view.setUint32(16 + i * 4, curOffset);
      curOffset += chunkSizes[i];
    }
    return buf;
  }

  private createStssBox(): Uint8Array | null {
    const keyframes: number[] = [];
    this.chunks.forEach((chunk, index) => {
      if (chunk.type === 'key') {
        keyframes.push(index + 1);
      }
    });

    if (keyframes.length === 0) return null;

    const buf = new Uint8Array(16 + keyframes.length * 4);
    const view = new DataView(buf.buffer);
    view.setUint32(0, buf.byteLength);
    buf.set([0x73, 0x74, 0x73, 0x73], 4); // 'stss'
    view.setUint32(12, keyframes.length);
    for (let i = 0; i < keyframes.length; i++) {
      view.setUint32(16 + i * 4, keyframes[i]);
    }
    return buf;
  }

  private box(type: string, contents: Uint8Array[]): Uint8Array {
    const totalContentLen = contents.reduce((s, p) => s + p.byteLength, 0);
    const boxLen = 8 + totalContentLen;
    const buf = new Uint8Array(boxLen);
    const view = new DataView(buf.buffer);
    view.setUint32(0, boxLen);
    for (let i = 0; i < 4; i++) buf[4 + i] = type.charCodeAt(i);
    let offset = 8;
    for (const c of contents) {
      buf.set(c, offset);
      offset += c.byteLength;
    }
    return buf;
  }
}
