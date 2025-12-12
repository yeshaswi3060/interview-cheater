import { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, screen } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'
import * as fs from 'fs'

// Simple settings storage for update tracking
const settingsPath = path.join(app.getPath('userData'), 'app-settings.json')

function getSettings(): any {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
        }
    } catch (e) {
        console.error('Failed to read settings:', e)
    }
    return {}
}

function saveSettings(settings: any) {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings))
    } catch (e) {
        console.error('Failed to save settings:', e)
    }
}

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// Auto-update status tracking
let updateStatus: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error' = 'idle'
let updateError: string | null = null
let downloadProgress: number = 0
let updateVersion: string | null = null

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    win = new BrowserWindow({
        width: width,
        height: height,
        x: 0,
        y: 0,
        icon: path.join(process.env.VITE_PUBLIC || '', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
        },
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        show: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        hasShadow: false,
        resizable: false,
        movable: false,
        focusable: true,
        title: '',  // Empty title to avoid detection
        type: 'popup',  // popup type doesn't show in Apps section
        paintWhenInitiallyHidden: true,
        thickFrame: false,
        // Additional settings to hide from Apps section
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
    })

    // Set reasonable frame rate (higher for smoother rendering)
    win.webContents.setFrameRate(30);

    // Additional optimizations
    win.webContents.setBackgroundThrottling(true);

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())

        // Check if app was just updated and notify renderer
        const settings = getSettings()
        const currentVersion = app.getVersion()
        if (settings.previousVersion && settings.previousVersion !== currentVersion) {
            // App was updated, notify the renderer
            setTimeout(() => {
                win?.webContents.send('app-just-updated', {
                    previousVersion: settings.previousVersion,
                    currentVersion: currentVersion
                })
            }, 1500) // Delay to ensure UI is ready
        }
        // Save current version for next launch
        saveSettings({ ...settings, previousVersion: currentVersion })
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST!, 'index.html'))
    }

    win.once('ready-to-show', () => {
        win?.show()

        // Check for updates after window is shown (only in production)
        if (app.isPackaged) {
            autoUpdater.checkForUpdatesAndNotify()
        }
    })
}

// Configure auto-updater
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.allowDowngrade = false

// CRITICAL: Bypass signature verification for self-signed certificates
// Without this, electron-updater will fail to verify updates signed with self-signed certs
autoUpdater.forceDevUpdateConfig = true

// Add cache headers to avoid stale updates
autoUpdater.requestHeaders = { 'Cache-Control': 'no-cache' }

// Logging for debugging (logs to %APPDATA%/gogly/logs/)
autoUpdater.logger = require('electron-log')
if (autoUpdater.logger) {
    (autoUpdater.logger as any).transports.file.level = 'info'
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
    updateStatus = 'checking'
    win?.webContents.send('update-status', { status: 'checking' })
})

autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version)
    updateStatus = 'available'
    updateVersion = info.version
    win?.webContents.send('update-status', {
        status: 'available',
        version: info.version
    })
})

autoUpdater.on('update-not-available', () => {
    console.log('No updates available')
    updateStatus = 'idle'
    win?.webContents.send('update-status', { status: 'not-available' })
})

autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent.toFixed(1)}%`)
    updateStatus = 'downloading'
    downloadProgress = progressObj.percent
    win?.webContents.send('update-status', {
        status: 'downloading',
        progress: progressObj.percent,
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total
    })
})

autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded - will install on next restart')
    updateStatus = 'downloaded'
    updateVersion = info.version
    win?.webContents.send('update-status', {
        status: 'downloaded',
        version: info.version
    })
})

autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
    updateStatus = 'error'
    updateError = err.message
    win?.webContents.send('update-status', {
        status: 'error',
        error: err.message
    })
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Enable high DPI support for sharp rendering
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

// Reduce memory usage with V8 garbage collection
app.commandLine.appendSwitch('js-flags', '--expose-gc --max-old-space-size=256');

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (win) {
            if (win.isMinimized()) win.restore()
            if (!win.isVisible()) win.show()
            win.focus()
        }
    })

    app.whenReady().then(() => {
        const { exec } = require('child_process');
        exec('net session', (err: any, stdout: any, stderr: any) => {
            if (err || (stderr && stderr.length > 0)) {
                const { dialog } = require('electron');
                dialog.showMessageBoxSync({
                    type: 'error',
                    title: 'Administrator Access Required',
                    message: 'This application requires Administrator privileges to function correctly.\n\nPlease restart the application as an Administrator.',
                    buttons: ['Exit']
                });
                app.quit();
                return;
            }

            createWindow()

            if (win) {
                win.setContentProtection(true);
            }

            globalShortcut.register('CommandOrControl+Enter', () => {
                if (win) {
                    if (win.isVisible() && win.isFocused()) {
                        win.hide()
                    } else {
                        win.show()
                        win.focus()
                    }
                }
            })

            // Global shortcut for Snipping Tool (Ctrl+Shift+C)
            globalShortcut.register('CommandOrControl+Shift+C', () => {
                if (win) {
                    win.show();
                    win.focus();
                    win.webContents.send('global-shortcut', 'snip');
                }
            })

            // Global shortcut for Transcription Toggle (Ctrl+Shift+T)
            globalShortcut.register('CommandOrControl+Shift+T', () => {
                if (win) {
                    win.show();
                    win.focus();
                    win.webContents.send('global-shortcut', 'transcribe');
                }
            })

            // Emergency Quit Shortcut (Ctrl+Shift+Enter)
            globalShortcut.register('CommandOrControl+Shift+Enter', () => {
                app.quit();
            })
        });

        ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', async (_event, opts) => {
            return await desktopCapturer.getSources(opts)
        })

        ipcMain.handle('MINIMIZE_WINDOW', () => {
            if (win) {
                win.setIgnoreMouseEvents(false);
                win.minimize();
            }
        });

        ipcMain.handle('CLOSE_WINDOW', () => {
            win?.close();
        });

        ipcMain.handle('RESTORE_WINDOW', () => {
            if (win) {
                if (win.isMinimized()) win.restore();
                win.setSkipTaskbar(true);
                win.show();
                win.focus();
            }
        });

        ipcMain.handle('SET_FULLSCREEN', (_event, flag: boolean) => {
            if (win) {
                if (flag) {
                    // For snipping: disable ignore mouse, set fullscreen
                    win.setIgnoreMouseEvents(false);
                    win.setSimpleFullScreen(true);
                    win.setAlwaysOnTop(true, 'floating'); // Use floating, not screen-saver
                    win.setSkipTaskbar(true);
                } else {
                    win.setSimpleFullScreen(false);
                    win.setSkipTaskbar(true);
                }
            }
        });

        // Notch Mode - Fullscreen with click-through
        ipcMain.handle('SET_NOTCH_MODE', () => {
            if (win) {
                const primaryDisplay = screen.getPrimaryDisplay();
                const { width, height } = primaryDisplay.workAreaSize;

                win.setSimpleFullScreen(false);
                win.setPosition(0, 0);
                win.setSize(width, height);
                win.setAlwaysOnTop(true, 'floating'); // Use floating to not block video rendering
                win.setIgnoreMouseEvents(true, { forward: true });
            }
        });

        // Toggle mouse events
        ipcMain.handle('SET_IGNORE_MOUSE', (_event, ignore: boolean) => {
            if (win) {
                if (ignore) {
                    win.setIgnoreMouseEvents(true, { forward: true });
                } else {
                    win.setIgnoreMouseEvents(false);
                }
            }
        });

        ipcMain.handle('UPDATE_NOTCH_HEIGHT', () => {
            // No longer needed
        });

        ipcMain.handle('EXIT_NOTCH_MODE', () => {
            if (win) {
                const primaryDisplay = screen.getPrimaryDisplay();
                const { width, height } = primaryDisplay.workAreaSize;

                win.setIgnoreMouseEvents(false);
                win.setSimpleFullScreen(false);
                win.setSize(width, height);
                win.center();
                win.setAlwaysOnTop(true);
                win.setSkipTaskbar(true);
            }
        });

        // Get app version
        ipcMain.handle('GET_APP_VERSION', () => {
            return app.getVersion();
        });

        // Auto-updater IPC handlers
        ipcMain.handle('CHECK_FOR_UPDATES', async () => {
            if (app.isPackaged) {
                try {
                    return await autoUpdater.checkForUpdates();
                } catch (err: any) {
                    console.error('Check for updates error:', err);
                    return { error: err.message };
                }
            } else {
                // In dev mode, return a mock response
                win?.webContents.send('update-status', { status: 'dev-mode' });
                return { devMode: true };
            }
        });

        ipcMain.handle('QUIT_AND_INSTALL', () => {
            autoUpdater.quitAndInstall(false, true);
        });

        ipcMain.handle('GET_UPDATE_STATUS', () => {
            return {
                status: updateStatus,
                error: updateError,
                progress: downloadProgress,
                version: updateVersion
            };
        });

        // Quit application
        ipcMain.on('app-quit', () => {
            app.quit();
        });
    })
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})
