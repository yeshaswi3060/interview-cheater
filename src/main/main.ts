import { app, BrowserWindow, globalShortcut } from 'electron'
import path from 'node:path'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(process.env.VITE_PUBLIC || '', 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden', // For custom title bar
        titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#ffffff',
            height: 30
        },
        backgroundColor: '#0f0f0f', // Dark background to match theme
        show: false, // Don't show until ready-to-show
        skipTaskbar: true, // Hide from taskbar
        alwaysOnTop: true, // Keep window on top of everything
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // In production, load from the dist folder
        win.loadFile(path.join(process.env.DIST!, 'index.html'))
    }

    win.once('ready-to-show', () => {
        win?.show()
    })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (win) {
            if (win.isMinimized()) win.restore()
            if (!win.isVisible()) win.show()
            win.focus()
        }
    })

    app.whenReady().then(() => {
        // Check for Administrator Privileges
        const { exec } = require('child_process');
        exec('net session', (err: any, stdout: any, stderr: any) => {
            if (err || (stderr && stderr.length > 0)) {
                // Not running as admin
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

            // Running as admin, proceed to create window
            createWindow()

            // Enable Screen Protection (Invisible to Screen Share)
            if (win) {
                win.setContentProtection(true);
            }

            // Register Global Shortcut
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
        });
    })
}

app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll()
})
