(function (global) {
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function compileRegex(input, flags = "i") {
    const source = String(input ?? "");
    if (!source.trim()) {
      return null;
    }

    try {
      return new RegExp(source, flags);
    } catch {
      return null;
    }
  }

  function highlight(text, re) {
    const source = String(text ?? "");
    if (!re) {
      return escapeHtml(source);
    }

    const globalFlags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
    const matcher = new RegExp(re.source, globalFlags);
    let output = "";
    let lastIndex = 0;

    for (const match of source.matchAll(matcher)) {
      const index = match.index ?? 0;
      const matched = match[0];
      output += escapeHtml(source.slice(lastIndex, index));
      output += `<mark>${escapeHtml(matched)}</mark>`;
      lastIndex = index + matched.length;
    }

    output += escapeHtml(source.slice(lastIndex));
    return output;
  }

  function matchesRecord(record, regex) {
    if (!regex) {
      return true;
    }

    const haystack = [
      record.title,
      record.author,
      record.tag,
      record.dateAdded,
      String(record.pages)
    ].join(" ");

    regex.lastIndex = 0;
    return regex.test(haystack);
  }

  global.BookVaultSearch = {
    escapeHtml,
    compileRegex,
    highlight,
    matchesRecord
  };
})(window);
