(function (global) {
  const TITLE_REGEX = /^\S(?:.*\S)?$/;
  const PAGES_REGEX = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
  const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  const TAG_REGEX = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
  const ID_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;
  const DUPLICATE_WORD_REGEX = /\b(\w+)\s+\1\b/i;
  const DEFAULT_SETTINGS = {
    readingTargetPages: 5000,
    displayUnit: "pages",
    chapterSize: 12
  };

  function trimCollapse(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
  }

  function isNumericText(value) {
    return PAGES_REGEX.test(String(value ?? "").trim());
  }

  function toFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeSettings(input = {}) {
    const readingTargetPages = Math.max(0, toFiniteNumber(input.readingTargetPages) ?? DEFAULT_SETTINGS.readingTargetPages);
    const displayUnit = input.displayUnit === "chapters" ? "chapters" : "pages";
    const chapterSizeRaw = toFiniteNumber(input.chapterSize);
    const chapterSize = chapterSizeRaw && chapterSizeRaw > 0 ? Number(chapterSizeRaw) : DEFAULT_SETTINGS.chapterSize;

    return {
      readingTargetPages,
      displayUnit,
      chapterSize
    };
  }

  function normalizeImportedRecord(record) {
    const normalized = {
      id: trimCollapse(record.id),
      title: trimCollapse(record.title),
      author: trimCollapse(record.author),
      pages: Number(record.pages),
      tag: trimCollapse(record.tag),
      dateAdded: trimCollapse(record.dateAdded),
      createdAt: trimCollapse(record.createdAt),
      updatedAt: trimCollapse(record.updatedAt)
    };

    return normalized;
  }

  function validateImportedRecord(record) {
    const errors = [];
    const title = String(record?.title ?? "");
    const author = String(record?.author ?? "");
    const pages = String(record?.pages ?? "");
    const tag = String(record?.tag ?? "");
    const dateAdded = String(record?.dateAdded ?? "");
    const id = String(record?.id ?? "");
    const createdAt = String(record?.createdAt ?? "");
    const updatedAt = String(record?.updatedAt ?? "");

    const result = validateRecordInput(
      {
        title,
        author,
        pages,
        tag,
        dateAdded
      },
      { requireAllFields: true }
    );
    errors.push(...result.errors);

    if (!ID_REGEX.test(id)) {
      errors.push("Record id is required and must start with a letter.");
    }

    if (!createdAt.trim()) {
      errors.push("createdAt is required.");
    }

    if (!updatedAt.trim()) {
      errors.push("updatedAt is required.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function validateRecordInput(input, options = {}) {
    const errors = [];
    const requireAllFields = options.requireAllFields !== false;
    const title = String(input.title ?? "");
    const author = String(input.author ?? "");
    const tag = String(input.tag ?? "");
    const pages = String(input.pages ?? "");
    const dateAdded = String(input.dateAdded ?? "");

    if (!TITLE_REGEX.test(title)) {
      errors.push("Title cannot have leading or trailing spaces.");
    }

    if (!TITLE_REGEX.test(author)) {
      errors.push("Author cannot have leading or trailing spaces.");
    }

    if (!isNumericText(pages)) {
      errors.push("Pages must be a non-negative number with up to two decimals.");
    }

    if (!TAG_REGEX.test(tag)) {
      errors.push("Tag must use letters, spaces, or hyphens only.");
    }

    if (!DATE_REGEX.test(dateAdded)) {
      errors.push("Date must follow YYYY-MM-DD.");
    }

    if (requireAllFields) {
      if (!title.trim()) {
        errors.push("Title is required.");
      }
      if (!author.trim()) {
        errors.push("Author is required.");
      }
      if (!tag.trim()) {
        errors.push("Tag is required.");
      }
      if (!dateAdded.trim()) {
        errors.push("Date is required.");
      }
      if (!pages.trim()) {
        errors.push("Pages are required.");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function validateSettingsInput(input) {
    const errors = [];
    const targetText = String(input.readingTargetPages ?? "").trim();
    const chapterText = String(input.chapterSize ?? "").trim();

    if (targetText && !isNumericText(targetText)) {
      errors.push("Reading target must be numeric.");
    }

    if (chapterText && !isNumericText(chapterText)) {
      errors.push("Pages per chapter must be numeric.");
    }

    const chapterSize = toFiniteNumber(chapterText || DEFAULT_SETTINGS.chapterSize);
    if (chapterSize !== null && chapterSize <= 0) {
      errors.push("Pages per chapter must be greater than zero.");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  global.BookVaultValidators = {
    TITLE_REGEX,
    PAGES_REGEX,
    DATE_REGEX,
    TAG_REGEX,
    ID_REGEX,
    DUPLICATE_WORD_REGEX,
    DEFAULT_SETTINGS,
    trimCollapse,
    isNumericText,
    toFiniteNumber,
    normalizeSettings,
    normalizeImportedRecord,
    validateImportedRecord,
    validateRecordInput,
    validateSettingsInput
  };
})(window);
