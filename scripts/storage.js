(function (global) {
  const STORAGE_KEY = "book-notes-vault:v1";
  let memoryStorage = {};

  function getSafeStorage() {
    try {
      const probeKey = "__book_vault_probe__";
      window.localStorage.setItem(probeKey, "1");
      window.localStorage.removeItem(probeKey);
      return window.localStorage;
    } catch {
      return {
        getItem(key) {
          return Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null;
        },
        setItem(key, value) {
          memoryStorage[key] = String(value);
        },
        removeItem(key) {
          delete memoryStorage[key];
        }
      };
    }
  }

  const storage = getSafeStorage();

  function loadBundle() {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.records)) {
        return null;
      }

      const records = [];
      for (const entry of parsed.records) {
        if (!global.BookVaultValidators.validateImportedRecord(entry).valid) {
          return null;
        }
        records.push(global.BookVaultValidators.normalizeImportedRecord(entry));
      }
      const settings = global.BookVaultValidators.normalizeSettings(parsed.settings);

      return { records, settings };
    } catch {
      return null;
    }
  }

  function saveBundle(bundle) {
    storage.setItem(STORAGE_KEY, JSON.stringify(bundle));
  }

  function clearBundle() {
    storage.removeItem(STORAGE_KEY);
  }

  function exportBundle(bundle) {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vault-export.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 200);
  }

  async function readJsonFile(file) {
    const text = await file.text();
    return JSON.parse(text);
  }

  function validateBundle(payload) {
    let records = null;
    let settings = {};

    if (Array.isArray(payload)) {
      records = payload;
    } else if (payload && Array.isArray(payload.records)) {
      records = payload.records;
      settings = payload.settings || {};
    } else {
      return {
        valid: false,
        error: "Import file must be an array of records or an object with a records array."
      };
    }

    const normalizedRecords = [];
    for (const entry of records) {
      const check = global.BookVaultValidators.validateImportedRecord(entry);
      if (!check.valid) {
        return {
          valid: false,
          error: `Invalid record: ${check.errors[0] || "unknown issue"}`
        };
      }
      normalizedRecords.push(global.BookVaultValidators.normalizeImportedRecord(entry));
    }

    return {
      valid: true,
      records: normalizedRecords,
      settings: global.BookVaultValidators.normalizeSettings(settings)
    };
  }

  global.BookVaultStorage = {
    STORAGE_KEY,
    loadBundle,
    saveBundle,
    clearBundle,
    exportBundle,
    readJsonFile,
    validateBundle
  };
})(window);
