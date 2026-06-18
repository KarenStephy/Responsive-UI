(function (global) {
  function init(store) {
    const page = document.body.dataset.page || "dashboard";
    setActiveNav(page);

    const initMap = {
      dashboard: initDashboardPage,
      records: initRecordsPage,
      form: initFormPage,
      settings: initSettingsPage
    };

    const start = initMap[page] || initDashboardPage;
    start(store);
  }

  function setActiveNav(page) {
    document.querySelectorAll("[data-nav-page]").forEach((link) => {
      if (link.dataset.navPage === page) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function todayIso() {
    return global.BookVaultStats.localDateKey(new Date());
  }

  function toInputNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    const rounded = Number(number.toFixed(2));
    return String(rounded);
  }

  function toStoredPages(value, settings) {
    const number = Number(value);
    const pages = settings.displayUnit === "chapters" ? number * settings.chapterSize : number;
    return Number(pages.toFixed(2));
  }

  function escapeHtml(value) {
    return global.BookVaultSearch.escapeHtml(value);
  }

  function formatDateTime(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDateIso(value) {
    return String(value ?? "");
  }

  function setMessage(element, message, tone = "good") {
    if (!element) {
      return;
    }
    element.dataset.tone = tone;
    element.textContent = message;
  }

  function setHtmlMessage(element, html, tone = "good") {
    if (!element) {
      return;
    }
    element.dataset.tone = tone;
    element.innerHTML = html;
  }

  function renderDashboardStats(elements, state) {
    const stats = global.BookVaultStats.buildStats(state.records, state.settings);

    if (elements.heroBookCount) {
      elements.heroBookCount.textContent = String(stats.totalBooks);
    }
    if (elements.heroPages) {
      elements.heroPages.textContent = stats.totalPagesDisplay;
    }
    if (elements.heroTopTag) {
      elements.heroTopTag.textContent = stats.topTag;
    }
    if (elements.statsGrid) {
      elements.statsGrid.innerHTML = `
        <article class="stats-card">
          <span>Total books</span>
          <strong>${stats.totalBooks}</strong>
          <small class="tiny-label">Every catalog entry in the vault.</small>
        </article>
        <article class="stats-card">
          <span>Total pages</span>
          <strong>${escapeHtml(stats.totalPagesDisplay)}</strong>
          <small class="tiny-label">Shown in ${state.settings.displayUnit}.</small>
        </article>
        <article class="stats-card">
          <span>Top tag</span>
          <strong>${escapeHtml(stats.topTag)}</strong>
          <small class="tiny-label">Most frequent category.</small>
        </article>
        <article class="stats-card">
          <span>Reading target</span>
          <strong>${escapeHtml(stats.remainingPagesDisplay)}</strong>
          <small class="tiny-label">${stats.tone === "alert" ? "Over target" : "Remaining"}</small>
        </article>
      `;
    }
    if (elements.targetMessage) {
      elements.targetMessage.innerHTML = `
        <div class="target-card">
          <div class="chip-row">
            <span class="status-pill">Reading target</span>
            <span class="tiny-label">${escapeHtml(global.BookVaultStats.formatPages(stats.targetPages, state.settings))} cap</span>
          </div>
          <progress class="target-progress" max="${Math.max(stats.targetPages, stats.totalPages, 1)}" value="${Math.min(stats.totalPages, Math.max(stats.targetPages, stats.totalPages, 1))}"></progress>
          <p>${escapeHtml(stats.targetMessage)}</p>
          <div class="chip-row">
            <span class="chip">Current: ${escapeHtml(stats.totalPagesDisplay)}</span>
            <span class="chip">Remaining: ${escapeHtml(stats.remainingPagesDisplay)}</span>
          </div>
        </div>
      `;
      elements.targetMessage.dataset.tone = stats.tone === "alert" ? "alert" : "good";
    }
    if (elements.chart) {
      const maxCount = Math.max(1, ...stats.last7Days.map((day) => day.count));
      elements.chart.innerHTML = stats.last7Days
        .map((day) => {
          const height = Math.max(8, Math.round((day.count / maxCount) * 100));
          return `
            <div class="chart-bar" aria-label="${escapeHtml(day.label)}: ${day.count} additions">
              <div class="chart-track">
                <div class="chart-fill" style="height:${height}%"></div>
              </div>
              <strong>${day.count}</strong>
              <small>${escapeHtml(day.label)}</small>
            </div>
          `;
        })
        .join("");
    }
  }

  function initDashboardPage(store) {
    const elements = {
      heroBookCount: document.getElementById("heroBookCount"),
      heroPages: document.getElementById("heroPages"),
      heroTopTag: document.getElementById("heroTopTag"),
      statsGrid: document.getElementById("statsGrid"),
      targetMessage: document.getElementById("targetMessage"),
      chart: document.getElementById("chart")
    };

    if (!elements.statsGrid && !elements.targetMessage && !elements.chart) {
      return;
    }

    const render = () => {
      renderDashboardStats(elements, store.getState());
    };

    store.subscribe(render);
    render();
  }

  function sortRecords(records, sortBy) {
    const sorted = [...records];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "pages-asc":
          return Number(a.pages) - Number(b.pages);
        case "pages-desc":
          return Number(b.pages) - Number(a.pages);
        case "date-asc":
          return new Date(a.dateAdded) - new Date(b.dateAdded);
        case "date-desc":
        default:
          return new Date(b.dateAdded) - new Date(a.dateAdded);
      }
    });

    return sorted;
  }

  function initRecordsPage(store) {
    const elements = {
      searchInput: document.getElementById("searchInput"),
      caseToggle: document.getElementById("caseToggle"),
      sortSelect: document.getElementById("sortSelect"),
      tagFilter: document.getElementById("tagFilter"),
      searchMessage: document.getElementById("searchMessage"),
      recordSummary: document.getElementById("recordSummary"),
      recordsTableBody: document.getElementById("recordsTableBody"),
      mobileRecords: document.getElementById("mobileRecords"),
      recordsSection: document.getElementById("records")
    };

    if (!elements.recordsTableBody && !elements.mobileRecords) {
      return;
    }

    const uiState = {
      editingId: null,
      pendingFocusId: null,
      flashMessage: "",
      flashTone: "good"
    };

    function getView() {
      const query = elements.searchInput ? elements.searchInput.value.trim() : "";
      const caseInsensitive = !elements.caseToggle || elements.caseToggle.checked;
      const sortBy = elements.sortSelect ? elements.sortSelect.value : "date-desc";
      const tagFilter = elements.tagFilter ? elements.tagFilter.value : "all";
      const flags = caseInsensitive ? "i" : "";
      const searchRegex = global.BookVaultSearch.compileRegex(query, flags);
      const highlightRegex = global.BookVaultSearch.compileRegex(query, `${flags}g`);
      const invalid = Boolean(query) && !searchRegex;

      return { query, caseInsensitive, sortBy, tagFilter, searchRegex, highlightRegex, invalid };
    }

    function renderTagFilter(records) {
      if (!elements.tagFilter) {
        return;
      }
      const current = elements.tagFilter.value || "all";
      const tags = [...new Set(records.map((record) => record.tag))].sort((a, b) => a.localeCompare(b));
      elements.tagFilter.innerHTML =
        `<option value="all">All tags</option>` +
        tags
          .map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)
          .join("");
      elements.tagFilter.value = tags.includes(current) ? current : "all";
    }

    function renderInlineEdit(record, settings) {
      const pageLabel = settings.displayUnit === "chapters" ? "Chapters" : "Pages";
      const displayPages = toInputNumber(global.BookVaultStats.convertPages(record.pages, settings));

      return `
        <form class="edit-form" data-edit-form="${escapeHtml(record.id)}">
          <div class="status-box">
            <div class="chip-row">
              <span class="status-pill">Editing</span>
              <span class="tiny-label">Updated ${escapeHtml(formatDateTime(record.updatedAt))}</span>
            </div>
            <div class="card-edit-grid">
              <label class="field">
                <span>Title</span>
                <input name="title" type="text" value="${escapeHtml(record.title)}" />
              </label>
              <label class="field">
                <span>Author</span>
                <input name="author" type="text" value="${escapeHtml(record.author)}" />
              </label>
              <label class="field">
                <span>${escapeHtml(pageLabel)}</span>
                <input name="pages" type="text" inputmode="decimal" value="${escapeHtml(displayPages)}" />
              </label>
              <label class="field">
                <span>Tag</span>
                <input name="tag" type="text" value="${escapeHtml(record.tag)}" />
              </label>
              <label class="field">
                <span>Date added</span>
                <input name="dateAdded" type="date" value="${escapeHtml(record.dateAdded)}" />
              </label>
            </div>
            <div class="warning-message" data-edit-warning>${global.BookVaultValidators.DUPLICATE_WORD_REGEX.test(record.title) ? "Repeated word detected." : ""}</div>
            <div class="error-list" data-edit-errors></div>
            <div class="form-actions">
              <button class="button button-primary" type="submit">Save changes</button>
              <button class="button button-secondary" type="button" data-action="cancel-edit">Cancel</button>
            </div>
          </div>
        </form>
      `;
    }

    function renderRecordRow(record, settings, highlightRegex, pinned) {
      if (record.id === uiState.editingId) {
        return `<tr class="editing-row"><td colspan="6">${renderInlineEdit(record, settings)}</td></tr>`;
      }

      const title = global.BookVaultSearch.highlight(record.title, highlightRegex);
      const author = global.BookVaultSearch.highlight(record.author, highlightRegex);
      const pages = global.BookVaultSearch.highlight(
        global.BookVaultStats.formatPages(record.pages, settings),
        highlightRegex
      );
      const tag = global.BookVaultSearch.highlight(record.tag, highlightRegex);
      const date = global.BookVaultSearch.highlight(formatDateIso(record.dateAdded), highlightRegex);

      return `
        <tr${pinned ? ' class="editing-row"' : ""}>
          <td>${pinned ? '<span class="status-pill">Editing</span>' : ""}<div class="record-title">${title}</div></td>
          <td>${author}</td>
          <td>${pages}</td>
          <td>${tag}</td>
          <td><time datetime="${escapeHtml(record.dateAdded)}">${date}</time></td>
          <td>
            <div class="action-group">
              <button class="button button-secondary" type="button" data-action="edit" data-id="${escapeHtml(record.id)}">Edit</button>
              <button class="button button-ghost" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }

    function renderRecordCard(record, settings, highlightRegex, pinned) {
      if (record.id === uiState.editingId) {
        return `<article class="record-card editing">${renderInlineEdit(record, settings)}</article>`;
      }

      const title = global.BookVaultSearch.highlight(record.title, highlightRegex);
      const author = global.BookVaultSearch.highlight(record.author, highlightRegex);
      const pages = global.BookVaultSearch.highlight(
        global.BookVaultStats.formatPages(record.pages, settings),
        highlightRegex
      );
      const tag = global.BookVaultSearch.highlight(record.tag, highlightRegex);
      const date = global.BookVaultSearch.highlight(formatDateIso(record.dateAdded), highlightRegex);

      return `
        <article class="record-card${pinned ? " editing" : ""}">
          <div class="chip-row" style="margin-bottom:0.4rem">
            ${pinned ? '<span class="status-pill">Editing</span>' : ""}
            <span class="chip">${escapeHtml(record.tag)}</span>
          </div>
          <h3>${title}</h3>
          <div class="record-meta">
            <span><strong>Author:</strong> ${author}</span>
            <span><strong>Pages:</strong> ${pages}</span>
            <span><strong>Date:</strong> <time datetime="${escapeHtml(record.dateAdded)}">${date}</time></span>
          </div>
          <div class="record-actions">
            <button class="button button-secondary" type="button" data-action="edit" data-id="${escapeHtml(record.id)}">Edit</button>
            <button class="button button-ghost" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">Delete</button>
          </div>
        </article>
      `;
    }

    function render() {
      const state = store.getState();
      const view = getView();

      let visible = state.records.filter((record) => {
        if (view.tagFilter !== "all" && record.tag !== view.tagFilter) {
          return false;
        }
        if (view.searchRegex && !global.BookVaultSearch.matchesRecord(record, view.searchRegex)) {
          return false;
        }
        return true;
      });

      const editingRecord = uiState.editingId
        ? state.records.find((record) => record.id === uiState.editingId)
        : null;

      if (editingRecord && !visible.some((record) => record.id === editingRecord.id)) {
        visible.unshift(editingRecord);
      }

      visible = sortRecords(visible, view.sortBy);
      if (editingRecord) {
        visible = [editingRecord, ...visible.filter((record) => record.id !== editingRecord.id)];
      }

      if (elements.searchMessage) {
        if (view.invalid) {
          setMessage(elements.searchMessage, "Invalid regex pattern. Showing all records.", "alert");
        } else if (uiState.flashMessage) {
          setMessage(elements.searchMessage, uiState.flashMessage, uiState.flashTone);
        } else {
          setMessage(elements.searchMessage, "", "good");
        }
      }

      if (elements.recordSummary) {
        const visibleCount = visible.length;
        const filterText = view.tagFilter === "all" ? "All tags" : `Tag: ${view.tagFilter}`;
        const sortLabel = elements.sortSelect?.selectedOptions[0]?.textContent || "Date: newest first";
        const extra = editingRecord ? " Editing record pinned." : "";
        elements.recordSummary.textContent = `Showing ${visibleCount} of ${state.records.length} records. ${filterText}. Sort: ${sortLabel}.${extra}`;
      }

      renderTagFilter(state.records);

      const noDataMessage = state.records.length
        ? view.invalid
          ? "Invalid regex. The full list is visible above."
          : "No records match your filters."
        : "No records yet. Add your first entry.";

      if (elements.recordsTableBody) {
        elements.recordsTableBody.innerHTML = visible.length
          ? visible
              .map((record) => renderRecordRow(record, state.settings, view.highlightRegex, editingRecord && editingRecord.id === record.id))
              .join("")
          : `<tr><td colspan="6"><div class="empty-state">${escapeHtml(noDataMessage)}</div></td></tr>`;
      }

      if (elements.mobileRecords) {
        elements.mobileRecords.innerHTML = visible.length
          ? visible
              .map((record) => renderRecordCard(record, state.settings, view.highlightRegex, editingRecord && editingRecord.id === record.id))
              .join("")
          : `<div class="empty-state">${escapeHtml(noDataMessage)}</div>`;
      }

      if (uiState.pendingFocusId) {
        window.requestAnimationFrame(() => {
          const editForm = document.querySelector(`[data-edit-form="${uiState.pendingFocusId}"]`);
          const focusTarget = editForm?.querySelector('input[name="title"]');
          if (focusTarget) {
            focusTarget.focus();
            focusTarget.select?.();
          }
          uiState.pendingFocusId = null;
        });
      }
    }

    function startEditing(id) {
      uiState.editingId = id;
      uiState.pendingFocusId = id;
      render();
    }

    function cancelEditing() {
      uiState.editingId = null;
      uiState.pendingFocusId = null;
      render();
    }

    function handleDelete(id) {
      const record = store.getState().records.find((entry) => entry.id === id);
      if (!record) {
        return;
      }
      if (!window.confirm(`Delete "${record.title}"?`)) {
        return;
      }
      uiState.flashMessage = `Deleted "${record.title}".`;
      uiState.flashTone = "good";
      if (uiState.editingId === id) {
        uiState.editingId = null;
      }
      store.deleteRecord(id, { type: "delete" });
      render();
    }

    function handleEditSubmit(form) {
      const id = form.dataset.editForm;
      const state = store.getState();
      const original = state.records.find((entry) => entry.id === id);
      if (!original) {
        return;
      }

      const raw = Object.fromEntries(new FormData(form).entries());
      const check = global.BookVaultValidators.validateRecordInput(raw);
      const errorTarget = form.querySelector("[data-edit-errors]");

      if (!check.valid) {
        setHtmlMessage(
          errorTarget,
          `<ul class="feature-list">${check.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`,
          "alert"
        );
        return;
      }

      const updated = {
        title: global.BookVaultValidators.trimCollapse(raw.title),
        author: global.BookVaultValidators.trimCollapse(raw.author),
        pages: toStoredPages(raw.pages, state.settings),
        tag: global.BookVaultValidators.trimCollapse(raw.tag),
        dateAdded: global.BookVaultValidators.trimCollapse(raw.dateAdded),
        updatedAt: new Date().toISOString()
      };

      uiState.flashMessage = `Saved "${updated.title}".`;
      uiState.flashTone = "good";
      uiState.editingId = null;
      uiState.pendingFocusId = null;
      store.updateRecord(id, updated, { type: "edit" });
      render();
    }

    function handleRecordsClick(event) {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }

      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === "edit") {
        startEditing(id);
      } else if (action === "delete") {
        handleDelete(id);
      } else if (action === "cancel-edit") {
        cancelEditing();
      }
    }

    function handleRecordsSubmit(event) {
      const form = event.target.closest("[data-edit-form]");
      if (!form) {
        return;
      }
      event.preventDefault();
      handleEditSubmit(form);
    }

    function handleRecordsInput(event) {
      const form = event.target.closest("[data-edit-form]");
      if (!form) {
        return;
      }
      if (event.target.name === "title") {
        const warningTarget = form.querySelector("[data-edit-warning]");
        setMessage(
          warningTarget,
          global.BookVaultValidators.DUPLICATE_WORD_REGEX.test(event.target.value) ? "Repeated word detected." : "",
          "good"
        );
      }
    }

    function handleRecordsKeydown(event) {
      const form = event.target.closest("[data-edit-form]");
      if (!form) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
      }
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", render);
    }
    if (elements.caseToggle) {
      elements.caseToggle.addEventListener("change", render);
    }
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener("change", render);
    }
    if (elements.tagFilter) {
      elements.tagFilter.addEventListener("change", render);
    }
    if (elements.recordsSection) {
      elements.recordsSection.addEventListener("click", handleRecordsClick);
      elements.recordsSection.addEventListener("submit", handleRecordsSubmit);
      elements.recordsSection.addEventListener("input", handleRecordsInput);
      elements.recordsSection.addEventListener("keydown", handleRecordsKeydown);
    }

    store.subscribe(render);
    render();
  }

  function initFormPage(store) {
    const elements = {
      recordForm: document.getElementById("recordForm"),
      recordTitle: document.getElementById("recordTitle"),
      titleWarning: document.getElementById("titleWarning"),
      recordAuthor: document.getElementById("recordAuthor"),
      recordPages: document.getElementById("recordPages"),
      pagesFieldLabel: document.getElementById("pagesFieldLabel"),
      recordTag: document.getElementById("recordTag"),
      recordDate: document.getElementById("recordDate"),
      recordFormErrors: document.getElementById("recordFormErrors"),
      formStatus: document.getElementById("formStatus"),
      clearFormBtn: document.getElementById("clearFormBtn")
    };

    if (!elements.recordForm) {
      return;
    }

    function render() {
      const state = store.getState();
      const pageLabel = state.settings.displayUnit === "chapters" ? "Chapters" : "Pages";
      if (elements.pagesFieldLabel) {
        elements.pagesFieldLabel.textContent = pageLabel;
      }
      if (elements.recordPages) {
        elements.recordPages.placeholder = state.settings.displayUnit === "chapters" ? "2.5" : "350";
      }
      if (!elements.recordDate.value) {
        elements.recordDate.value = todayIso();
      }
      if (elements.titleWarning && elements.recordTitle) {
        setMessage(
          elements.titleWarning,
          global.BookVaultValidators.DUPLICATE_WORD_REGEX.test(elements.recordTitle.value)
            ? "Repeated word detected."
            : "",
          "good"
        );
      }
    }

    function clearForm() {
      elements.recordForm.reset();
      elements.recordDate.value = todayIso();
      setMessage(elements.titleWarning, "", "good");
      setMessage(elements.recordFormErrors, "", "good");
      setMessage(elements.formStatus, "", "good");
      elements.recordTitle.focus();
    }

    function handleSubmit(event) {
      event.preventDefault();
      const state = store.getState();
      const raw = Object.fromEntries(new FormData(elements.recordForm).entries());
      const check = global.BookVaultValidators.validateRecordInput(raw);

      if (!check.valid) {
        setHtmlMessage(
          elements.recordFormErrors,
          `<ul class="feature-list">${check.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`,
          "alert"
        );
        setMessage(elements.formStatus, "", "good");
        return;
      }

      const now = new Date().toISOString();
      const record = {
        id: `book_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        title: global.BookVaultValidators.trimCollapse(raw.title),
        author: global.BookVaultValidators.trimCollapse(raw.author),
        pages: toStoredPages(raw.pages, state.settings),
        tag: global.BookVaultValidators.trimCollapse(raw.tag),
        dateAdded: global.BookVaultValidators.trimCollapse(raw.dateAdded),
        createdAt: now,
        updatedAt: now
      };

      store.addRecord(record, { type: "add" });
      clearForm();
      setMessage(elements.formStatus, `Added "${record.title}".`, "good");
    }

    function handleInput() {
      if (!elements.recordTitle || !elements.titleWarning) {
        return;
      }
      setMessage(
        elements.titleWarning,
        global.BookVaultValidators.DUPLICATE_WORD_REGEX.test(elements.recordTitle.value)
          ? "Repeated word detected."
          : "",
        "good"
      );
    }

    if (elements.recordForm) {
      elements.recordForm.addEventListener("submit", handleSubmit);
    }
    if (elements.recordTitle) {
      elements.recordTitle.addEventListener("input", handleInput);
    }
    if (elements.clearFormBtn) {
      elements.clearFormBtn.addEventListener("click", clearForm);
    }

    render();
  }

  function initSettingsPage(store) {
    const elements = {
      settingsForm: document.getElementById("settingsForm"),
      readingTarget: document.getElementById("readingTarget"),
      displayUnit: document.getElementById("displayUnit"),
      chapterSize: document.getElementById("chapterSize"),
      settingsStatus: document.getElementById("settingsStatus"),
      targetMessage: document.getElementById("targetMessage"),
      exportBtn: document.getElementById("exportBtn"),
      importInput: document.getElementById("importInput"),
      resetSeedBtn: document.getElementById("resetSeedBtn")
    };

    if (!elements.settingsForm) {
      return;
    }

    function render() {
      const state = store.getState();
      if (elements.readingTarget) {
        elements.readingTarget.value = toInputNumber(
          global.BookVaultStats.convertPages(state.settings.readingTargetPages, state.settings)
        );
      }
      if (elements.displayUnit) {
        elements.displayUnit.value = state.settings.displayUnit;
      }
      if (elements.chapterSize) {
        elements.chapterSize.value = toInputNumber(state.settings.chapterSize);
      }

      const stats = global.BookVaultStats.buildStats(state.records, state.settings);
      if (elements.targetMessage) {
        elements.targetMessage.innerHTML = `
          <div class="target-card">
            <div class="chip-row">
              <span class="status-pill">Reading target</span>
              <span class="tiny-label">${escapeHtml(global.BookVaultStats.formatPages(stats.targetPages, state.settings))} cap</span>
            </div>
            <progress class="target-progress" max="${Math.max(stats.targetPages, stats.totalPages, 1)}" value="${Math.min(stats.totalPages, Math.max(stats.targetPages, stats.totalPages, 1))}"></progress>
            <p>${escapeHtml(stats.targetMessage)}</p>
            <div class="chip-row">
              <span class="chip">Current: ${escapeHtml(stats.totalPagesDisplay)}</span>
              <span class="chip">Remaining: ${escapeHtml(stats.remainingPagesDisplay)}</span>
            </div>
          </div>
        `;
        elements.targetMessage.dataset.tone = stats.tone === "alert" ? "alert" : "good";
      }
    }

    function saveSettings(event) {
      event.preventDefault();
      const raw = {
        readingTargetPages: elements.readingTarget ? elements.readingTarget.value : "",
        displayUnit: elements.displayUnit ? elements.displayUnit.value : "pages",
        chapterSize: elements.chapterSize ? elements.chapterSize.value : ""
      };

      const check = global.BookVaultValidators.validateSettingsInput(raw);
      if (!check.valid) {
        setHtmlMessage(
          elements.settingsStatus,
          `<ul class="feature-list">${check.errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`,
          "alert"
        );
        return;
      }

      const current = store.getState().settings;
      const chapterSize = Number(raw.chapterSize || current.chapterSize);
      const nextSettings = {
        readingTargetPages: toStoredPages(raw.readingTargetPages, {
          displayUnit: raw.displayUnit,
          chapterSize
        }),
        displayUnit: raw.displayUnit,
        chapterSize
      };

      store.setSettings(nextSettings, { type: "settings" });
      setMessage(elements.settingsStatus, "Settings saved.", "good");
      render();
    }

    function exportJson() {
      const state = store.getState();
      global.BookVaultStorage.exportBundle(state);
      setMessage(elements.settingsStatus, "Export downloaded.", "good");
    }

    function importJson(event) {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      global.BookVaultStorage.readJsonFile(file)
        .then((payload) => {
          const result = global.BookVaultStorage.validateBundle(payload);
          if (!result.valid) {
            setHtmlMessage(elements.settingsStatus, `<ul class="feature-list"><li>${escapeHtml(result.error)}</li></ul>`, "alert");
            event.target.value = "";
            return;
          }

          store.replaceAll(result, { type: "import" });
          setMessage(elements.settingsStatus, `Imported ${result.records.length} record${result.records.length === 1 ? "" : "s"}.`, "good");
          event.target.value = "";
          render();
        })
        .catch(() => {
          setHtmlMessage(elements.settingsStatus, `<ul class="feature-list"><li>Could not read that JSON file.</li></ul>`, "alert");
          event.target.value = "";
        });
    }

    function resetSeed() {
      if (!window.confirm("Reset the vault to the seed data?")) {
        return;
      }
      store.resetToSeed({ type: "reset" });
      setMessage(elements.settingsStatus, "Seed data restored.", "good");
      render();
    }

    if (elements.settingsForm) {
      elements.settingsForm.addEventListener("submit", saveSettings);
    }
    if (elements.exportBtn) {
      elements.exportBtn.addEventListener("click", exportJson);
    }
    if (elements.importInput) {
      elements.importInput.addEventListener("change", importJson);
    }
    if (elements.resetSeedBtn) {
      elements.resetSeedBtn.addEventListener("click", resetSeed);
    }

    store.subscribe(render);
    render();
  }

  global.BookVaultUI = {
    init
  };
})(window);
