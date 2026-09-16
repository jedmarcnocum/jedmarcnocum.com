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
      <div class="blog-image-modal__stage">
        <img class="blog-image-modal__image" alt="" />
        <button class="blog-image-modal__control blog-image-modal__control--previous" type="button" aria-label="Previous image">
          <span aria-hidden="true">&larr;</span>
        </button>
        <button class="blog-image-modal__control blog-image-modal__control--next" type="button" aria-label="Next image">
          <span aria-hidden="true">&rarr;</span>
        </button>
        <button class="blog-image-modal__close" type="button" aria-label="Close image preview">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="blog-image-modal__gallery" role="group" aria-label="Images in this post"></div>
    </div>
  `;

  document.body.append(dialog);

  const modalImage = dialog.querySelector(".blog-image-modal__image");
  const previousButton = dialog.querySelector(".blog-image-modal__control--previous");
  const nextButton = dialog.querySelector(".blog-image-modal__control--next");
  const closeButton = dialog.querySelector(".blog-image-modal__close");
  const gallery = dialog.querySelector(".blog-image-modal__gallery");
  let opener;
  let activeIndex = 0;

  const closeModal = () => dialog.close();

  const thumbnails = images.map((image, index) => {
    const thumbnail = document.createElement("button");
    thumbnail.className = "blog-image-modal__thumbnail";
    thumbnail.type = "button";
    thumbnail.setAttribute(
      "aria-label",
      `View image ${index + 1} of ${images.length}: ${image.alt || "blog image"}`,
    );

    const thumbnailImage = document.createElement("img");
    thumbnailImage.src = image.currentSrc || image.src;
    thumbnailImage.alt = "";
    thumbnailImage.loading = "lazy";
    thumbnail.append(thumbnailImage);
    gallery.append(thumbnail);
    return thumbnail;
  });

  const setActiveImage = (index) => {
    activeIndex = (index + images.length) % images.length;
    const image = images[activeIndex];

    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt;
    thumbnails.forEach((thumbnail, thumbnailIndex) => {
      const isActive = thumbnailIndex === activeIndex;
      thumbnail.classList.toggle("is-active", isActive);
      thumbnail.setAttribute("aria-pressed", String(isActive));
    });
    thumbnails[activeIndex].scrollIntoView({ block: "nearest", inline: "center" });
  };

  const openModal = (image) => {
    opener = image;
    setActiveImage(images.indexOf(image));
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

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => setActiveImage(index));
  });
  previousButton.addEventListener("click", () => setActiveImage(activeIndex - 1));
  nextButton.addEventListener("click", () => setActiveImage(activeIndex + 1));
  closeButton.addEventListener("click", closeModal);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeModal();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    setActiveImage(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    thumbnails[activeIndex].focus();
  });
  dialog.addEventListener("close", () => opener?.focus());
})();
