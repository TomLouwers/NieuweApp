export type PersistDriver = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export function createBrowserStorage(): PersistDriver {
  if (typeof window === "undefined") {
    return {
      async getItem() { return null; },
      async setItem() {},
      async removeItem() {},
    };
  }
  return {
    async getItem(key) { return window.localStorage.getItem(key); },
    async setItem(key, value) { window.localStorage.setItem(key, value); },
    async removeItem(key) { window.localStorage.removeItem(key); },
  };
}

