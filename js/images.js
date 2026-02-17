// js/images.js
export function makeImg(src) {
  const img = new Image();
  img.src = src;
  let ready = false;
  img.onload = () => (ready = true);
  return { img, get ready() { return ready; } };
}

export function loadImages() {
  return {
    // pickups
    jetpack: makeImg("Images/jetpack.png"),

    // characters
    ghost: makeImg("Images/Ghost.png"),
    rocketChar: makeImg("Images/Rocket.png"),
    ufo: makeImg("Images/UFO.png"),
    football: makeImg("Images/Football.png"),
    basketball: makeImg("Images/Basketball.png"),
    golfball: makeImg("Images/Golfball.png"),
    diaSword: makeImg("Images/DiaSword.png"),

    // powerup icons
    doublePoints: makeImg("Images/DoublePoints.png"),
    timeSlow: makeImg("Images/TimeSlow.png"),
    magnet: makeImg("Images/Magnet.png"),
    shrink: makeImg("Images/Shrink.png"),
  };
}
