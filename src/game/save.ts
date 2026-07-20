// src/game/save.ts
let fs: typeof import('@tauri-apps/plugin-fs') | null = null;

async function ensureTauri() {
  const hasTauri = typeof (window as any).__TAURI_IPC__ !== 'undefined';
  if (!hasTauri) return false;
  if (!fs) fs = await import('@tauri-apps/plugin-fs');
  return true;
}

export async function saveGame(slot: string, data: unknown) {
  if (await ensureTauri()) {
    const { BaseDirectory, exists, mkdir, writeTextFile } = fs!;
    const dir = 'life-sim';
    const base = BaseDirectory.AppData;
    if (!(await exists(dir, { baseDir: base }))) {
      await mkdir(dir, { baseDir: base, recursive: true });
    }
    await writeTextFile(`${dir}/${slot}.json`, JSON.stringify(data, null, 2), {
      baseDir: base,
    });
    return;
  }
  localStorage.setItem(`life-sim:${slot}`, JSON.stringify(data));
}

export async function loadGame<T>(slot: string): Promise<T | null> {
  if (await ensureTauri()) {
    const { BaseDirectory, readTextFile } = fs!;
    try {
      const txt = await readTextFile(`life-sim/${slot}.json`, {
        baseDir: BaseDirectory.AppData,
      });
      return JSON.parse(txt) as T;
    } catch {
      return null;
    }
  }
  const raw = localStorage.getItem(`life-sim:${slot}`);
  return raw ? (JSON.parse(raw) as T) : null;
}
