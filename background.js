// Chrome runs this as a service worker; Firefox loads the shared files first via background.scripts.
if (typeof importScripts === "function" && !self.TIRAI_LOCK) {
  importScripts("shared/defaults.js", "shared/lock.js");
}

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
