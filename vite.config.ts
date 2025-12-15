import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [
        react(),
        electron({
            main: {
                // Shortcut of `build.lib.entry`.
                entry: 'src/main/main.ts',
            },
            preload: {
                // Shortcut of `build.rollupOptions.input`.
                // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
                input: 'src/preload/preload.ts',
            },
            // Ployfill the Electron and Node.js built-in modules for Renderer process.
            // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
            renderer: {},
        }),
    ],
    server: {
        watch: {
            ignored: ['**/release/**', '**/dist-electron/**']
        }
    },
    // PDF.js worker needs special handling
    optimizeDeps: {
        include: ['pdfjs-dist'],
    },
    build: {
        rollupOptions: {
            // Ensure pdf.worker is handled correctly
            output: {
                manualChunks: {
                    pdfjs: ['pdfjs-dist']
                }
            }
        }
    }
})
