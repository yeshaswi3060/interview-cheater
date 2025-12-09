import { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, screen } from 'electron'
import { autoUpdater } from 'electron-updater'
import path from 'node:path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

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

// Configure auto-updater for silent auto-install
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

// Auto-updater event handlers
autoUpdater.on('update-available', () => {
    console.log('Update available - downloading...')
})

autoUpdater.on('update-downloaded', () => {
    console.log('Update downloaded - will install on next restart')
})

autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err)
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

        // Quit application
        ipcMain.on('app-quit', () => {
            app.quit();
        });
    })
}

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})
