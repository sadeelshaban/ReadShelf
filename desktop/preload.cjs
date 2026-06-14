const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("readshelfDesktop", {
  platform: process.platform,
  isDesktop: true,
});
