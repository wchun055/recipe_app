const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (MAIN_WINDOW_WEBPACK_ENTRY) {
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  }
  mainWindow.setMenuBarVisibility(false);
}

// Handle local image uploads
ipcMain.handle('upload-image', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'webp', 'jpeg'] }]
  });
  
  if (canceled) return null;
  
  const imageData = fs.readFileSync(filePaths[0]).toString('base64');
  const ext = path.extname(filePaths[0]).split('.').pop();
  return `data:image/${ext};base64,${imageData}`;
});

app.on('ready', createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });