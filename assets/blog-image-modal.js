(() => {
  const article = document.querySelector("article");

  if (!article) return;

  const images = [...article.querySelectorAll("img[src]")];

  if (!images.length) return;

  const dialog = document.createElement("dialog");
  dialog.className = "blog-image-modal";
  dialog.setAttribute("aria-label", "Image preview");
  dialog.innerHTML = `
    <div class="blog-image-modal__content">
      <img class="blog-image-modal__image" alt="" />
      <button class="blog-image-modal__close" type="button" aria-label="Close image preview">
        <span aria-hidden="true">×</span>
      </button>
    </div>
  `;

  document.body.append(dialog);

  const modalImage = dialog.querySelector(".blog-image-modal__image");
  const closeButton = dialog.querySelector(".blog-image-modal__close");
  let opener;

  const closeModal = () => dialog.close();

  const openModal = (image) => {
    opener = image;
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt;
    dialog.showModal();
    closeButton.focus();
  };

  images.forEach((image) => {
    image.classList.add("blog-image-modal__trigger");
    image.tabIndex = 0;
    image.setAttribute("role", "button");
    image.setAttribute("aria-haspopup", "dialog");
    image.setAttribute(
      "aria-label",
      `View full-size image: ${image.alt || "blog image"}`,
    );

    image.addEventListener("click", () => openModal(image));
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(image);
      }
    });
  });

  closeButton.addEventListener("click", closeModal);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeModal();
  });
  dialog.addEventListener("close", () => opener?.focus());
})();
