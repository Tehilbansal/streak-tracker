const { app, BrowserWindow, Tray, Menu, Notification } = require("electron");
const path = require("path");

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 620,
    minWidth: 380,
    minHeight: 500,
    title: "Streak Tracker",
    icon: path.join(__dirname, "assets/icon.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile("renderer/index.html");

  // Hide instead of close (tray behavior)
  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

/* ---------- TRAY ---------- */
function createTray() {
  tray = new Tray(path.join(__dirname, "assets/tray.png"));

  const menu = Menu.buildFromTemplate([
    {
      label: "Open Streak Tracker",
      click: () => {
        mainWindow.show();
      }
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Streak Tracker – Build habits daily");
  tray.setContextMenu(menu);

  tray.on("double-click", () => {
    mainWindow.show();
  });
}

/* ---------- DAILY NOTIFICATION ---------- */
function startDailyReminder() {
  setInterval(() => {
    const now = new Date();

    // 🔔 Daily reminder at 8:00 PM
    if (now.getHours() === 20 && now.getMinutes() === 0) {
      new Notification({
        title: "Habit Reminder 🔔",
        body: "Don't forget to complete your habits today!"
      }).show();
    }
  }, 60000); // check every minute
}

/* ---------- APP LIFECYCLE ---------- */
app.whenReady().then(() => {
  createWindow();
  createTray();
  startDailyReminder();
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
  }
});
