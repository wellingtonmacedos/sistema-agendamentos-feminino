const fs = require('fs');
const path = require('path');

// Generate a simple sine wave beep (WAV format)
const sampleRate = 44100;
const duration = 1.0; // 1 second
const frequency = 660; // Hz (High pitch beep)
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples * 2); // 16-bit mono

// WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4); // ChunkSize
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Subchunk1Size
buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
buffer.writeUInt16LE(1, 22); // NumChannels (Mono)
buffer.writeUInt32LE(sampleRate, 24); // SampleRate
buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
buffer.writeUInt16LE(2, 32); // BlockAlign
buffer.writeUInt16LE(16, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40); // Subchunk2Size

// Write Sine Wave Data (Pulse/Beep pattern)
for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Simple envelope to make it sound like a "ping"
    const envelope = Math.exp(-3 * t); 
    const value = Math.sin(2 * Math.PI * frequency * t);
    const sample = Math.max(-32768, Math.min(32767, value * 32767 * 0.5 * envelope)); 
    buffer.writeInt16LE(Math.floor(sample), 44 + i * 2);
}

const outputPath = path.join(__dirname, 'frontend/public/ringtone.wav');
fs.writeFileSync(outputPath, buffer);
console.log(`Sound file created at ${outputPath}`);
