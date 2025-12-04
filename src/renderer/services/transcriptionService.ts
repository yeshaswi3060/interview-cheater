import hark from 'hark';
import { captureSystemAudio } from './mediaCapture';
import { transcribeAudio } from './groqService';

let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let speechEvents: any = null;
let audioChunks: Blob[] = [];
let isRecording = false;

export const startLiveTranscription = async (
    apiKey: string,
    onTranscript: (text: string) => void,
    onError: (error: string) => void
) => {
    if (isRecording) return;

    try {
        mediaStream = await captureSystemAudio();

        // Initialize Hark for VAD
        speechEvents = hark(mediaStream, {
            threshold: -50, // Adjust sensitivity
            interval: 100
        });

        isRecording = true;

        // Start recording immediately
        startNewRecording();

        speechEvents.on('speaking', () => {
            console.log('Speaking started');
        });

        speechEvents.on('stopped_speaking', () => {
            console.log('Speaking stopped');
            stopAndTranscribe(apiKey, onTranscript, onError);
        });

    } catch (error: any) {
        console.error('Failed to start live transcription:', error);
        onError(error.message || 'Failed to start audio capture');
        stopLiveTranscription();
    }
};

const startNewRecording = () => {
    if (!mediaStream) return;

    audioChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm;codecs=opus' });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            audioChunks.push(e.data);
        }
    };

    mediaRecorder.start();
};

const stopAndTranscribe = async (
    apiKey: string,
    onTranscript: (text: string) => void,
    onError: (error: string) => void
) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });

        // Start next recording immediately to avoid missing audio
        if (isRecording) {
            startNewRecording();
        }

        if (blob.size < 1000) return; // Ignore very small chunks

        try {
            const text = await transcribeAudio(apiKey, blob);
            if (text && text.trim()) {
                onTranscript(text);
            }
        } catch (error: any) {
            console.error('Transcription error:', error);
            // Don't stop the whole process on one error, just log it
            // onError(error.message); 
        }
    };

    mediaRecorder.stop();
};

export const stopLiveTranscription = () => {
    isRecording = false;

    if (speechEvents) {
        speechEvents.stop();
        speechEvents = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    audioChunks = [];
};
