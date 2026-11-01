// Independent QR decode oracle: macOS Vision, not the ReportLab encoder.
import Foundation
import Vision
let request = VNDetectBarcodesRequest()
request.symbologies = [.qr]
let handler = VNImageRequestHandler(url: URL(fileURLWithPath: CommandLine.arguments[1]), options: [:])
do {
    try handler.perform([request])
    let values = (request.results ?? []).compactMap { $0.payloadStringValue }
    let data = try JSONSerialization.data(withJSONObject: values)
    print(String(data: data, encoding: .utf8)!)
} catch {
    fputs("QR decode unavailable\n", stderr)
    exit(1)
}
