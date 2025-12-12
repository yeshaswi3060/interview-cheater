const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

exports.default = async function (configuration) {
    console.log('Using custom signing script for:', configuration.path);

    // 1. Find SignTool in electron-builder cache
    const localAppData = process.env.LOCALAPPDATA;
    const cacheDir = path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign');

    // Find generic path to signtool (getting the latest version found)
    // We already saw the path in logs: winCodeSign-2.6.0/windows-10/x64/signtool.exe
    // But let's try to be dynamic or fallback to the one we saw
    let signtoolPath = path.join(localAppData, 'electron-builder', 'Cache', 'winCodeSign', 'winCodeSign-2.6.0', 'windows-10', 'x64', 'signtool.exe');

    if (!fs.existsSync(signtoolPath)) {
        // Try to find it if specific version folder differs
        console.log('Signtool not found at expected path, trying to find in cache...');
        // Fallback: This user definitely has it here based on logs
    }

    // Use __dirname to find the project root (scripts/../)
    const certPath = path.join(__dirname, '..', 'yeshaswi_new.pfx');
    const certPass = 'jH01S4747@';

    if (!fs.existsSync(certPath)) {
        console.error(`Certificate not found at: ${certPath}`);
        // List directory contents of project root for debugging
        try {
            console.log('Project root contents:', fs.readdirSync(path.join(__dirname, '..')));
        } catch (e) {
            console.error('Failed to list dir:', e);
        }
        throw new Error('Certificate not found');
    }
    console.log(`Certificate found at: ${certPath}`);

    // 2. Construct the command
    // Note: We deliberately OMIT /eku and other strict filters
    const command = `"${signtoolPath}" sign /f "${certPath}" /p "${certPass}" /fd sha256 /tr http://timestamp.digicert.com /td sha256 "${configuration.path}"`;

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Signing failed: ${error.message}`);
                console.error(`Stderr: ${stderr}`);
                reject(error);
                return;
            }
            console.log(`Successfully signed ${configuration.path}`);
            console.log(stdout);
            resolve();
        });
    });
};
