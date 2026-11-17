// Module service worker: static imports are fetched together with this file when the
// worker is registered, so they can't fail later the way importScripts() can.
// The shared files are plain scripts that attach self.TIRAI and self.TIRAI_LOCK.
import "./shared/defaults.js";
import "./shared/lock.js";

const KEY = self.TIRAI.STORAGE_KEY;
const L = self.TIRAI_LOCK;

async function load() {
  const data = await chrome.storage.sync.get(KEY);
  return self.TIRAI.withDefaults(data[KEY]);
}

async function paintBadge(settings) {
  const s = settings || (await load());
  await chrome.action.setBadgeText({ text: s.enabled ? "" : "off" });
  await chrome.action.setBadgeBackgroundColor({ color: "#687189" });
}

chrome.runtime.onInstalled.addListener(async () => {
  const s = await load();
  await chrome.storage.sync.set({ [KEY]: s });
  paintBadge(s);
});

chrome.runtime.onStartup.addListener(async () => {
  paintBadge();
  const lock = await L.load();
  if (L.hasPin(lock) && lock.lockOnStartup) await L.lockNow();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes[KEY]) {
    paintBadge(self.TIRAI.withDefaults(changes[KEY].newValue));
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "lock-now") {
    await L.lockNow();
    return;
  }
  if (command !== "toggle-tirai") return;
  const s = await load();
  s.enabled = !s.enabled;
  await chrome.storage.sync.set({ [KEY]: s });
});
