// FullWidthOverlay.js
export default function FullWidthOverlay(map, position, contentHtml) {
  // make sure the Maps API is ready
  if (!window.google || !window.google.maps) {
    throw new Error("Google Maps JS API not loaded yet");
  }

  // 1) create a fresh OverlayView
  const overlay = new window.google.maps.OverlayView();
  overlay.position = position;
  overlay.content  = contentHtml;

  // 2) when added, mount your HTML
  overlay.onAdd = function () {
    const div = document.createElement("div");
    div.style.position    = "absolute";
    div.style.boxSizing   = "border-box";
    div.innerHTML         = this.content;
    this.div = div;
    this.getPanes().floatPane.appendChild(div);
  };

  // 3) each draw, size & position to full map width
  overlay.draw = function () {
    const proj  = this.getProjection();
    const pix   = proj.fromLatLngToDivPixel(
      new window.google.maps.LatLng(this.position.lat, this.position.lng)
    );
    const mapDiv = map.getDiv();
    const w     = mapDiv.offsetWidth;

    this.div.style.width = w + "px";
    this.div.style.left  = pix.x - w/2 + "px";
    this.div.style.top   = pix.y + "px";
  };

  // 4) cleanup
  overlay.onRemove = function () {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  };

  // finally attach it
  overlay.setMap(map);
  return overlay;
}