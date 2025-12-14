export const captureScreen = async (): Promise<string> => {
    try {
        // Use exposed Electron API
        const sources = await (window as any).ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', { types: ['screen'], thumbnailSize: { width: 1920, height: 1080 } });
        const primarySource = sources[0]; // Assuming primary screen for now

        if (!primarySource) {
            throw new Error('No screen source found');
        }

        return primarySource.thumbnail.toDataURL(); // Returns base64 string
    } catch (error) {
        console.error('Error capturing screen:', error);
        throw error;
    }
};

export const captureSystemAudio = async (): Promise<MediaStream> => {
    try {
        // Get desktop sources for audio capture
        const sources = await (window as any).ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', {
            types: ['screen'],
            thumbnailSize: { width: 1, height: 1 } // Minimal thumbnail to reduce GPU load
        });

        if (!sources || sources.length === 0) {
            throw new Error('No screen sources available');
        }

        const sourceId = sources[0].id;

        // Capture with minimal video (required by Electron for audio) - will be stopped immediately
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId
                }
            } as any,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: sourceId,
                    minWidth: 1,
                    maxWidth: 1,
                    minHeight: 1,
                    maxHeight: 1,
                    minFrameRate: 1,
                    maxFrameRate: 1
                }
            } as any
        });

        // IMMEDIATELY stop video track to prevent GPU interference
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => {
            track.stop();
            stream.removeTrack(track);
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
            throw new Error('No system audio track found');
        }

        console.log('System audio capture started - interviewer voice will be captured');
        return new MediaStream([audioTrack]);

    } catch (error: any) {
        console.error('System audio failed, falling back to microphone:', error.message);

        // Fallback to microphone
        const micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false },
            video: false
        });

        console.log('Using microphone as fallback');
        return micStream;
    }
};
