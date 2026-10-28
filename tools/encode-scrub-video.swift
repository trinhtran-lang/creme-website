// Re-encode a video as all-intra H.264 (every frame a keyframe), no audio, moov-at-front.
// Usage (from the project folder):
//   swift tools/encode-scrub-video.swift assets/video/Hero_Animation_Video.mp4 assets/video/hero-scrub-1080.mp4 1920 1080 16000000
//   swift tools/encode-scrub-video.swift assets/video/Hero_Animation_Video.mp4 assets/video/hero-scrub-720.mp4 1280 720 7000000
// The original file is only read, never modified.
import AVFoundation
let src = URL(fileURLWithPath: CommandLine.arguments[1])
let dst = URL(fileURLWithPath: CommandLine.arguments[2])
let width = Int(CommandLine.arguments[3])!, height = Int(CommandLine.arguments[4])!
let bitrate = Int(CommandLine.arguments[5])!
try? FileManager.default.removeItem(at: dst)
let sem = DispatchSemaphore(value: 0)
Task {
  let asset = AVURLAsset(url: src)
  let track = try await asset.loadTracks(withMediaType: .video)[0]
  let reader = try AVAssetReader(asset: asset)
  let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
  out.alwaysCopiesSampleData = false
  reader.add(out)
  let writer = try AVAssetWriter(outputURL: dst, fileType: .mp4)
  writer.shouldOptimizeForNetworkUse = true
  let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width, AVVideoHeightKey: height,
    AVVideoScalingModeKey: AVVideoScalingModeResizeAspectFill,
    AVVideoCompressionPropertiesKey: [
      AVVideoAverageBitRateKey: bitrate,
      AVVideoMaxKeyFrameIntervalKey: 1,
      AVVideoAllowFrameReorderingKey: false,
      AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
      AVVideoExpectedSourceFrameRateKey: 30,
    ],
  ])
  input.expectsMediaDataInRealTime = false
  writer.add(input)
  reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)
  var n = 0
  while let sb = out.copyNextSampleBuffer() {
    while !input.isReadyForMoreMediaData { usleep(2000) }
    input.append(sb); n += 1
  }
  input.markAsFinished()
  await writer.finishWriting()
  print("wrote", n, "frames", writer.status.rawValue, writer.error as Any)
  sem.signal()
}
sem.wait()
