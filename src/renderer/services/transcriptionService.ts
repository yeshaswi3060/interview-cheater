import hark from 'hark';
import { captureSystemAudio } from './mediaCapture';
import { transcribeAudio } from './groqService';

let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let speechEvents: any = null;
let audioChunks: Blob[] = [];
let isRecording = false;
let intervalTimer: ReturnType<typeof setInterval> | null = null;
let isSpeaking = false;
let silenceTimer: ReturnType<typeof setTimeout> | null = null;

// Memory optimization: limit max chunks to prevent memory leaks
const MAX_CHUNKS = 50;

// ===== BATCH RECORDING MODE (for mic button) =====
// Records while on, transcribes only when stopped

let batchMediaStream: MediaStream | null = null;
let batchMediaRecorder: MediaRecorder | null = null;
let batchAudioChunks: Blob[] = [];
let isBatchRecording = false;

export const startBatchRecording = async (
    onError: (error: string) => void
) => {
    if (isBatchRecording) return;

    try {
        batchMediaStream = await captureSystemAudio();
        batchAudioChunks = [];
        isBatchRecording = true;

        batchMediaRecorder = new MediaRecorder(batchMediaStream, { mimeType: 'audio/webm;codecs=opus' });

        batchMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                batchAudioChunks.push(e.data);
            }
        };

        // Record continuously in 500ms chunks
        batchMediaRecorder.start(500);
    } catch (error: any) {
        onError(error.message || 'Failed to start recording');
        stopBatchRecording();
    }
};

export const stopBatchRecording = async (
    apiKey?: string,
    onTranscript?: (text: string) => void,
    onError?: (error: string) => void
): Promise<void> => {
    if (!isBatchRecording) return;

    isBatchRecording = false;

    // Stop recorder and get final chunks
    if (batchMediaRecorder && batchMediaRecorder.state !== 'inactive') {
        batchMediaRecorder.stop();
    }

    // Wait a bit for final chunks to be collected
    await new Promise(resolve => setTimeout(resolve, 200));

    // Stop media stream
    if (batchMediaStream) {
        batchMediaStream.getTracks().forEach(track => track.stop());
        batchMediaStream = null;
    }

    // Transcribe the accumulated audio if we have chunks and callback
    // Note: transcribeAudio uses secureApiCall internally, so apiKey param is not required
    if (onTranscript && batchAudioChunks.length > 0) {
        const blob = new Blob(batchAudioChunks, { type: 'audio/webm' });

        if (blob.size > 1000) {
            try {
                const text = await transcribeAudio('', blob);
                if (text && text.trim()) {
                    onTranscript(text);
                }
            } catch (error: any) {
                onError?.(error.message || 'Transcription failed');
            }
        }
    }

    batchMediaRecorder = null;
    batchAudioChunks = [];
};

// ===== LIVE TRANSCRIPTION MODE (for auto-detect) =====
// Transcribes in real-time as speech is detected

export const startLiveTranscription = async (
    apiKey: string,
    onTranscript: (text: string) => void,
    onError: (error: string) => void
) => {
    if (isRecording) return;

    try {
        mediaStream = await captureSystemAudio();

        // Initialize Hark for VAD - optimized for low CPU
        speechEvents = hark(mediaStream, {
            threshold: -50,
            interval: 100
        });

        isRecording = true;
        isSpeaking = false;

        startNewRecording();

        speechEvents.on('speaking', () => {
            isSpeaking = true;
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
        });

        speechEvents.on('stopped_speaking', () => {
            isSpeaking = false;
            silenceTimer = setTimeout(() => {
                stopAndTranscribe(apiKey, onTranscript, onError);
            }, 1000);
        });

        intervalTimer = setInterval(() => {
            if (isRecording && audioChunks.length > 0) {
                stopAndTranscribe(apiKey, onTranscript, onError);
            }
        }, 5000);

    } catch (error: any) {
        onError(error.message || 'Failed to start audio capture');
        stopLiveTranscription();
    }
};

const startNewRecording = () => {
    if (!mediaStream) return;

    audioChunks = [];

    try {
        mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0 && audioChunks.length < MAX_CHUNKS) {
                audioChunks.push(e.data);
            }
            if (audioChunks.length >= MAX_CHUNKS) {
                audioChunks = audioChunks.slice(-30);
            }
        };

        mediaRecorder.start(200);
    } catch (e) { }
};

const stopAndTranscribe = async (
    apiKey: string,
    onTranscript: (text: string) => void,
    onError: (error: string) => void
) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;
    if (audioChunks.length === 0) return;

    const chunksToProcess = audioChunks;
    audioChunks = [];

    if (isRecording && mediaRecorder) {
        try { mediaRecorder.stop(); } catch (e) { }
    }

    if (isRecording) {
        setTimeout(() => startNewRecording(), 100);
    }

    const blob = new Blob(chunksToProcess, { type: 'audio/webm' });
    if (blob.size < 1000) return;

    try {
        const text = await transcribeAudio(apiKey, blob);
        if (text && text.trim() && text.trim().length > 3) {
            onTranscript(text);
        }
    } catch (error: any) { }
};

export const stopLiveTranscription = () => {
    isRecording = false;
    isSpeaking = false;

    if (intervalTimer) {
        clearInterval(intervalTimer);
        intervalTimer = null;
    }

    if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
    }

    if (speechEvents) {
        try { speechEvents.stop(); } catch (e) { }
        speechEvents = null;
    }

    if (mediaRecorder) {
        try {
            if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        } catch (e) { }
        mediaRecorder = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) { }
        });
        mediaStream = null;
    }

    audioChunks = [];
};

