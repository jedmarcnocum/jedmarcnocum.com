(() => {
  if (!document.querySelector("article")) return;

  const button = document.createElement("button");
  button.className = "blog-back-to-top";
  button.type = "button";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML = '<span aria-hidden="true">&uarr;</span>';
  document.body.append(button);

  button.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
