(function (global) {
  function cloneRecord(record) {
    return { ...record };
  }

  function cloneSettings(settings) {
    return { ...settings };
  }

  function buildInitialRecords() {
    const saved = global.BookVaultStorage.loadBundle();
    if (saved) {
      return saved.records.map(cloneRecord);
    }
    return (global.BOOK_VAULT_SEED || []).map(global.BookVaultValidators.normalizeImportedRecord);
  }

  function buildInitialSettings() {
    const saved = global.BookVaultStorage.loadBundle();
    if (saved) {
      return cloneSettings(global.BookVaultValidators.normalizeSettings(saved.settings));
    }
    return cloneSettings(global.BookVaultValidators.DEFAULT_SETTINGS);
  }

  function createStore() {
    let state = {
      records: buildInitialRecords(),
      settings: buildInitialSettings()
    };
    const listeners = new Set();

    function persist() {
      global.BookVaultStorage.saveBundle({
        records: state.records,
        settings: state.settings
      });
    }

    function notify(meta = {}) {
      const snapshot = getState();
      listeners.forEach((listener) => listener(snapshot, meta));
    }

    function getState() {
      return {
        records: state.records.map(cloneRecord),
        settings: cloneSettings(state.settings)
      };
    }

    function setRecords(records, meta = {}) {
      state = {
        ...state,
        records: records.map(cloneRecord)
      };
      persist();
      notify(meta);
    }

    function setSettings(settings, meta = {}) {
      state = {
        ...state,
        settings: global.BookVaultValidators.normalizeSettings(settings)
      };
      persist();
      notify(meta);
    }

    function addRecord(record, meta = {}) {
      setRecords([record, ...state.records], meta);
    }

    function updateRecord(id, updates, meta = {}) {
      setRecords(
        state.records.map((record) => (record.id === id ? { ...record, ...updates } : record)),
        meta
      );
    }

    function deleteRecord(id, meta = {}) {
      setRecords(state.records.filter((record) => record.id !== id), meta);
    }

    function replaceAll(bundle, meta = {}) {
      state = {
        records: bundle.records.map(cloneRecord),
        settings: global.BookVaultValidators.normalizeSettings(bundle.settings)
      };
      persist();
      notify(meta);
    }

    function resetToSeed(meta = {}) {
      state = {
        records: (global.BOOK_VAULT_SEED || []).map(global.BookVaultValidators.normalizeImportedRecord),
        settings: cloneSettings(global.BookVaultValidators.DEFAULT_SETTINGS)
      };
      persist();
      notify(meta);
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    return {
      getState,
      setRecords,
      setSettings,
      addRecord,
      updateRecord,
      deleteRecord,
      replaceAll,
      resetToSeed,
      subscribe
    };
  }

  global.BookVaultState = {
    createStore
  };
})(window);
