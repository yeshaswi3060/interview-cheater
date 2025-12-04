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
        // Get available desktop sources
        const sources = await (window as any).ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', { types: ['screen'] });

        if (!sources || sources.length === 0) {
            throw new Error('No screen sources available');
        }

        // Use the first screen source
        const sourceId = sources[0].id;

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
                    chromeMediaSourceId: sourceId
                }
            } as any
        });

        // We only need the audio track
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
            throw new Error('No audio track found in system stream');
        }

        return new MediaStream([audioTrack]);
    } catch (error) {
        console.error('Error capturing system audio:', error);
        throw error;
    }
};
