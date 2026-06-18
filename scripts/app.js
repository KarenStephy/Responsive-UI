(function () {
  function start() {
    const store = window.BookVaultState.createStore();
    window.BookVaultUI.init(store);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
