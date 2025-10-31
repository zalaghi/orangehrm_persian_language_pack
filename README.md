add following line in the beginning of app.css:

**@import url("./custom.css");
**

add following line in the end of app.js:
**
(function () {
  function inject() {
    var s = document.createElement("script");
    s.src = "/web/dist/js/custom.js?v=1";   // bump ?v= when you update
    s.async = true;                         // load without blocking
    document.head.appendChild(s);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject, { once: true });
  } else {
    inject();
  }
})();**
