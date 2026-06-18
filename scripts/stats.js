(function (global) {
  function formatNumber(value) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2
    }).format(value);
  }

  function localDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function convertPages(pages, settings) {
    if (settings.displayUnit === "chapters") {
      return pages / settings.chapterSize;
    }
    return pages;
  }

  function formatPages(pages, settings) {
    return `${formatNumber(convertPages(pages, settings))} ${settings.displayUnit}`;
  }

  function getTopTag(records) {
    const counts = new Map();
    for (const record of records) {
      counts.set(record.tag, (counts.get(record.tag) || 0) + 1);
    }

    const ranking = [...counts.entries()].sort((a, b) => {
      const countDiff = b[1] - a[1];
      return countDiff !== 0 ? countDiff : a[0].localeCompare(b[0]);
    });

    return ranking[0] || null;
  }

  function getLast7Days(records) {
    const today = new Date();
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const key = localDateKey(date);
      const label = date.toLocaleDateString(undefined, { weekday: "short" });
      const count = records.filter((record) => record.dateAdded === key).length;
      days.push({ key, label, count });
    }

    return days;
  }

  function buildStats(records, settings) {
    const totalBooks = records.length;
    const totalPages = records.reduce((sum, record) => sum + Number(record.pages || 0), 0);
    const topTag = getTopTag(records);
    const last7Days = getLast7Days(records);
    const targetPages = Number(settings.readingTargetPages || 0);
    const remainingPages = targetPages - totalPages;
    const progress = targetPages > 0 ? Math.min(100, (totalPages / targetPages) * 100) : 0;
    const tone = remainingPages >= 0 ? "good" : "alert";
    const targetMessage =
      remainingPages >= 0
        ? `Reading target is ${formatPages(Math.max(remainingPages, 0), settings)} away.`
        : `Reading target exceeded by ${formatPages(Math.abs(remainingPages), settings)}.`;

    return {
      totalBooks,
      totalPages,
      totalPagesDisplay: formatPages(totalPages, settings),
      topTag: topTag ? `${topTag[0]} (${topTag[1]})` : "-",
      last7Days,
      targetPages,
      targetPagesDisplay: formatPages(targetPages, settings),
      remainingPages,
      remainingPagesDisplay: formatPages(Math.abs(remainingPages), settings),
      progress,
      tone,
      targetMessage
    };
  }

  global.BookVaultStats = {
    buildStats,
    formatPages,
    convertPages,
    localDateKey
  };
})(window);
