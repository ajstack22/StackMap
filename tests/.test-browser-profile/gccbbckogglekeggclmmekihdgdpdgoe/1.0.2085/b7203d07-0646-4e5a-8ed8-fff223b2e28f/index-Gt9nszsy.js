function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
const dispatchedEvents = /* @__PURE__ */ new Set();
function dispatchNttEvent(eventType) {
  if (dispatchedEvents.has(eventType)) return;
  dispatchedEvents.add(eventType);
  const targetOrigin = isAndroid() ? "chrome://new-tab-takeover" : "chrome://newtab";
  window.parent.postMessage(
    { type: "richMediaEvent", value: eventType },
    targetOrigin
  );
}
function bindClickEvent(selector, handler) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => element.addEventListener("click", handler));
}
function bindClickEvents(selectors, handler) {
  selectors.forEach((selector) => bindClickEvent(selector, handler));
}
const DEFAULT_TRACK_POSITION = "50%";
function initSlider() {
  const container = document.querySelector("#slider-container");
  if (!container) {
    console.warn("Slider container not found, failed to initialize.");
    return;
  }
  const baseImage = document.querySelector("#slider-base-image");
  if (!baseImage) {
    console.warn("Base image not found, failed to initialize.");
    return;
  }
  const overlayImage = document.querySelector(
    "#slider-overlay-image"
  );
  if (!overlayImage) {
    console.warn("Overlay image not found, failed to initialize.");
    return;
  }
  const track = document.querySelector("#slider-track");
  if (!track) {
    console.warn("Slider track not found, failed to initialize.");
    return;
  }
  let isDraggingTrack = false;
  const getClientX = (event) => event.clientX;
  function setImageFocalPoints() {
    if (!overlayImage || !baseImage) return;
    overlayImage.style.objectPosition = overlayImage.getAttribute("data-focal-point") || "center";
    baseImage.style.objectPosition = baseImage.getAttribute("data-focal-point") || "center";
  }
  const updateTrack = (position) => {
    let percentage;
    if (typeof position === "string") {
      percentage = Math.min(Math.max(parseFloat(position), 0), 100);
    } else if (typeof position === "number") {
      const { left, width } = container.getBoundingClientRect();
      percentage = Math.min(
        Math.max((position - left) / width * 100, 0),
        100
      );
    } else {
      return;
    }
    overlayImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
    track.style.left = `${percentage}%`;
  };
  const handleTrackDragStart = (event) => {
    isDraggingTrack = true;
    track.setPointerCapture(event.pointerId);
    event.preventDefault();
    updateTrack(getClientX(event));
  };
  const handleTrackDragging = (event) => {
    if (!isDraggingTrack) return;
    event.preventDefault();
    updateTrack(getClientX(event));
  };
  const handleTrackDragEnd = (event) => {
    if (!isDraggingTrack) return;
    isDraggingTrack = false;
    track.releasePointerCapture(event.pointerId);
    dispatchNttEvent("interaction");
  };
  function addEventListeners() {
    bindClickEvents(
      ["#slider-base-image", "#slider-overlay-image"],
      () => dispatchNttEvent("click")
    );
    track?.addEventListener("pointerdown", handleTrackDragStart);
    track?.addEventListener("pointermove", handleTrackDragging);
    track?.addEventListener("pointerup", handleTrackDragEnd);
    track?.addEventListener("pointercancel", handleTrackDragEnd);
  }
  addEventListeners();
  setImageFocalPoints();
  const trackPosition = container.getAttribute("data-track-position") ?? DEFAULT_TRACK_POSITION;
  updateTrack(trackPosition);
}
document.addEventListener("DOMContentLoaded", () => {
  initSlider();
  bindClickEvent(".brand-button", () => dispatchNttEvent("click"));
});
