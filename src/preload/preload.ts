import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
    on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
    },
    off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
    },
    removeListener(...args: Parameters<typeof ipcRenderer.removeListener>) {
        const [channel, listener] = args
        return ipcRenderer.removeListener(channel, listener)
    },
    send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
    },
    invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
    },

    // You can expose other APTs you need here.
    getScreenSources: (opts: any) => ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES', opts),
    minimizeWindow: () => ipcRenderer.invoke('MINIMIZE_WINDOW'),
    restoreWindow: () => ipcRenderer.invoke('RESTORE_WINDOW'),
    setFullscreen: (flag: boolean) => ipcRenderer.invoke('SET_FULLSCREEN', flag),
    getAppVersion: () => ipcRenderer.invoke('GET_APP_VERSION'),

    // Auto-update functions
    checkForUpdates: () => ipcRenderer.invoke('CHECK_FOR_UPDATES'),
    quitAndInstall: () => ipcRenderer.invoke('QUIT_AND_INSTALL'),
    getUpdateStatus: () => ipcRenderer.invoke('GET_UPDATE_STATUS'),

    // Update event listeners
    onUpdateStatus: (callback: (data: any) => void) => {
        const listener = (_event: any, data: any) => callback(data)
        ipcRenderer.on('update-status', listener)
        return () => ipcRenderer.removeListener('update-status', listener)
    },
    onAppJustUpdated: (callback: (data: any) => void) => {
        const listener = (_event: any, data: any) => callback(data)
        ipcRenderer.on('app-just-updated', listener)
        return () => ipcRenderer.removeListener('app-just-updated', listener)
    }
})

