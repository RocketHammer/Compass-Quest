// ===== State =====
const state = {
  position: null,       // { lat, lng, accuracy } — latest GPS fix
  destination: null,    // { lat, lng, source, initialDistance } — where the arrow points
  gpsWatchId: null,     // watchPosition ID for cleanup
  gpsError: null,       // last geolocation error message, or null
  castMode: false,      // true when cast-a-point UI is active
  castDistanceIndex: 0, // index into DISTANCE_STEPS array
  arrivedAtCurrent: false, // true once arrival fires for current destination
};

let tutorialStep = 0;
let tutorialSteps = [];


// ===== Achievement Registry =====
// Each achievement has a stable `id` (never changes across versions).
// Names and descriptions can be freely updated.  The save file stores
// only IDs + timestamps + stats, so code changes never break saved progress.
// To add a new achievement, just append an object to this array.

const ACHIEVEMENTS = [
  // --- Getting Started ---
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Arrive at your first destination',
    check: (ctx) => ctx.event === 'arrival',
  },
  {
    id: 'pathfinder',
    name: 'Pathfinder',
    description: 'Arrive at 5 destinations',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalArrivals >= 5,
  },
  {
    id: 'trailblazer',
    name: 'Trailblazer',
    description: 'Arrive at 25 destinations',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalArrivals >= 25,
  },
  {
    id: 'target_audience',
    name: '<your name here>, the Target Audience',
    description: 'Arrive at 50 destinations',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalArrivals >= 50,
  },

  // --- Input Destinations ---
  {
    id: 'novice_navigator',
    name: 'Novice Navigator',
    description: 'Arrive at a coordinate destination from 2 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && ctx.initialDistance >= 2000,
  },
  {
    id: 'long_walk',
    name: 'The Long Walk',
    description: 'Arrive at a coordinate destination from 10 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && ctx.initialDistance >= 10000,
  },
  {
    id: 'getting_somewhere',
    name: 'Getting Somewhere',
    description: 'Arrive at a coordinate destination from 50 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && ctx.initialDistance >= 50000,
  },
  {
    id: 'expedition',
    name: 'Expedition to the Great Somewhere',
    description: 'Arrive at a coordinate destination from 100 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && ctx.initialDistance >= 100000,
  },
  {
    id: 'ultra_elite_navigator',
    name: '<your name here>, the Ultra Elite Navigator',
    description: 'Arrive at a coordinate destination from 2,000 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && ctx.initialDistance >= 2000000,
  },

  // --- Cast Destinations ---
  {
    id: 'first_cast',
    name: 'Leap of Faith',
    description: 'Arrive at your first cast destination',
    check: (ctx) => ctx.event === 'arrival' && ctx.source === 'cast',
  },
  {
    id: 'carefree_wanderer',
    name: 'Carefree Wanderer',
    description: 'Arrive at 10 cast destinations',
    check: (ctx) => ctx.event === 'arrival' && ctx.castArrivals >= 10,
  },
  {
    id: 'no_destination',
    name: 'No Destination Required',
    description: 'Arrive at a cast destination from 1 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'cast'
                 && ctx.initialDistance >= 1000,
  },
  {
    id: 'where_am_i',
    name: 'Where Am I?',
    description: 'Arrive at a cast destination from 10 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'cast'
                 && ctx.initialDistance >= 10000,
  },
  {
    id: 'leaf_in_the_wind',
    name: 'Like a Leaf in the Wind',
    description: 'Arrive at a cast destination at least 50 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'cast'
                 && ctx.initialDistance >= 50000,
  },
  {
    id: 'vagabond',
    name: '<your name here>, Vagabond of Myth and Legend',
    description: 'Arrive at a cast destination 100 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'cast'
                 && ctx.initialDistance >= 100000,
  },

  // --- Cumulative Distance ---
  {
    id: 'ten_down',
    name: 'Ten Down',
    description: 'Travel a cumulative 10 km',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalDistance >= 10000,
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Travel a cumulative 100 km',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalDistance >= 100000,
  },
  {
    id: 'travelers_guild',
    name: "Traveler's Guild",
    description: 'Travel a cumulative 500 km',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalDistance >= 500000,
  },
  {
    id: 'eternal_traveler',
    name: '<your name here>, Eternal Traveler',
    description: 'Travel a cumulative 4,000 km',
    check: (ctx) => ctx.event === 'arrival' && ctx.totalDistance >= 4000000,
  },

  // --- Short Range / Precision ---
  {
    id: 'how_far',
    name: 'How far away is that?',
    description: 'Arrive at a coordinate destination precisely 501 m away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && Math.round(ctx.initialDistance) === 501,
  },
  {
    id: 'calibration_distance',
    name: 'Calibration Distance',
    description: 'Arrive at a coordinate destination precisely 1 km away',
    check: (ctx) => ctx.event === 'arrival'
                 && ctx.source === 'input'
                 && Math.round(ctx.initialDistance) === 1000,
  },

  // --- Special ---
  {
    id: 'half_marathon',
    name: 'Half Marathon',
    description: 'Arrive at a destination at least 21.0975 km away',
    check: (ctx) => ctx.event === 'arrival' && ctx.initialDistance >= 21097,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Arrive at a destination at least 42.195 km away',
    check: (ctx) => ctx.event === 'arrival' && ctx.initialDistance >= 42195,
  },
];

// ===== DOM References =====
const dom = {};

function cacheDom() {
  dom.compassRose     = document.getElementById('compass-rose');
  dom.arrowGroup      = document.getElementById('arrow-group');
  dom.bearingDisplay  = document.getElementById('bearing-display');
  dom.distanceDisplay = document.getElementById('distance-display');
  dom.gpsStatus       = document.getElementById('gps-status');
  dom.headingStatus   = document.getElementById('heading-status');
  dom.destInput       = document.getElementById('dest-input');
  dom.setDestBtn      = document.getElementById('set-dest-btn');
  dom.destInfo        = document.getElementById('dest-info');
  dom.currentCoords   = document.getElementById('current-coords');
  dom.permissionBtn   = document.getElementById('permission-btn');
  dom.castPicker      = document.getElementById('cast-picker');
  dom.castControls    = document.getElementById('cast-controls');
  dom.castBtn         = document.getElementById('cast-btn');
  dom.castCancelBtn   = document.getElementById('cast-cancel-btn');
  dom.achievementBtn  = document.getElementById('achievement-btn');
  dom.achievementPanel = document.getElementById('achievement-panel');
  dom.achievementToast = document.getElementById('achievement-toast');
  dom.helpBtn          = document.getElementById('help-btn');
  dom.helpPanel        = document.getElementById('help-panel');
  dom.desktopWarning   = document.getElementById('desktop-warning');
  dom.installInstructions = document.getElementById('install-instructions');
  dom.tutorialPanel    = document.getElementById('tutorial-panel');
  dom.tutorialTitle    = document.getElementById('tutorial-title');
  dom.tutorialBody     = document.getElementById('tutorial-body');
  dom.tutorialDots     = document.getElementById('tutorial-dots');
  dom.tutorialNext     = document.getElementById('tutorial-next');
  dom.tutorialSkip     = document.getElementById('tutorial-skip');
  dom.replayTutorial   = document.getElementById('replay-tutorial');
}

// ===== Platform Detection =====

/**
 * Detects the user's platform and browser for UX adaptation.
 * Returns a plain object — called once during init().
 */
function detectPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|Chromium/i.test(ua);
  const isChrome = /Chrome|CriOS/i.test(ua) && !/Edge|Edg|OPR/i.test(ua);

  return { isIOS, isAndroid, isMobile, isSafari, isChrome };
}

/**
 * Applies platform-specific UI adjustments:
 *  - Desktop: shows a dismissable warning banner
 *  - Safari:  updates install instructions for iOS workflow
 */
function applyPlatformAdaptations(platform) {
  // Desktop warning
  if (!platform.isMobile) {
    dom.desktopWarning.classList.remove('hidden');
    document.getElementById('desktop-warning-dismiss')
      .addEventListener('click', () => dom.desktopWarning.classList.add('hidden'));
  }

  // Adapt install instructions to the browser
  if (platform.isSafari) {
    dom.installInstructions.innerHTML =
      'In Safari, tap the <strong>Share</strong> button (square with arrow) '
      + 'and select &ldquo;Add to Home Screen.&rdquo; '
      + 'The app will work fully offline once installed.';
  } else if (!platform.isChrome && platform.isMobile) {
    dom.installInstructions.innerHTML =
      'For the best experience, open this page in <strong>Chrome</strong> (Android) '
      + 'or <strong>Safari</strong> (iOS) and install it to your home screen.';
  }
  // Chrome (default text in HTML) needs no change
}

// ===== Virtual Keyboard Viewport Fix =====
// On mobile, the virtual keyboard shrinks the visible area but html/body
// height: 100% doesn't update.  The Visual Viewport API gives us the real
// visible height so the flex layout can reflow and keep the input visible.
//
// We use offsetTop + height because some browsers (iOS Safari) scroll the
// layout viewport when the keyboard opens, shifting the visual viewport
// downward.  Without offsetTop the bottom of #app would sit above the
// actual visible bottom and the input would be partially covered.

function initViewportResize() {
  if (!window.visualViewport) return;

  const root = document.documentElement;
  const update = () => {
    const vv = window.visualViewport;
    root.style.setProperty('--app-height', `${vv.offsetTop + vv.height}px`);
  };

  window.visualViewport.addEventListener('resize', update);
  window.visualViewport.addEventListener('scroll', update);
}

// ===== Geolocation =====

function startGps() {
  if (!('geolocation' in navigator)) {
    state.gpsError = 'Geolocation not supported';
    return;
  }

  state.gpsWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      state.position = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      state.gpsError = null;
    },
    (err) => {
      const messages = {
        1: 'GPS permission denied',
        2: 'GPS unavailable',
        3: 'GPS timed out',
      };
      state.gpsError = messages[err.code] || 'GPS error';
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
  );
}

function stopGps() {
  if (state.gpsWatchId != null) {
    navigator.geolocation.clearWatch(state.gpsWatchId);
    state.gpsWatchId = null;
  }
}

// ===== Device Orientation =====
// ---------------------------------------------------------------------------
// ABSOLUTE vs NON-ABSOLUTE DeviceOrientationEvent
//
// The browser exposes two orientation events.  Understanding why both exist
// — and which one a compass must prefer — is critical to getting a correct
// heading.
//
//   ┌─────────────────────────┬────────────────────────────────────────────┐
//   │ 'deviceorientation      │ 'deviceorientation'                      │
//   │  absolute'              │  (standard / non-absolute)               │
//   ├─────────────────────────┼────────────────────────────────────────────┤
//   │ alpha is measured from  │ alpha is measured from an ARBITRARY       │
//   │ EARTH'S MAGNETIC NORTH. │ reference — typically wherever the phone  │
//   │ 0° always = north.      │ was pointing when the listener started.  │
//   │                         │ 0° has no fixed geographic meaning.      │
//   ├─────────────────────────┼────────────────────────────────────────────┤
//   │ Requires a magnetometer │ Works with just a gyroscope (more        │
//   │ (compass hardware).     │ devices support it).                     │
//   ├─────────────────────────┼────────────────────────────────────────────┤
//   │ Chrome Android 50+.     │ All mobile browsers (universal).         │
//   │ Firefox Android.        │                                          │
//   │ NOT fired on iOS.       │                                          │
//   └─────────────────────────┴────────────────────────────────────────────┘
//
// WHY A COMPASS NEEDS ABSOLUTE:
//   A compass must know where north is.  The non-absolute event only tells
//   you how the phone has ROTATED SINCE LISTENING STARTED — useful for
//   gaming or gesture detection, useless for pointing at a geographic
//   bearing.  So we always prefer the absolute event when it exists.
//
// WHY WE STILL NEED THE NON-ABSOLUTE EVENT:
//   iOS Safari never fires 'deviceorientationabsolute'.  Instead it puts
//   the compass heading in a webkit-proprietary property on the standard
//   event: event.webkitCompassHeading.  And on some Android browsers,
//   the standard event carries an event.absolute boolean flag that tells
//   us alpha IS north-referenced even though it came from the non-absolute
//   event name.  So we listen to both and pick the best data from each.
//
// ROTATION ANGLES (all three delivered by both events):
//
//   alpha (0-360)  — rotation around the Z axis (perpendicular to screen).
//                    This is the compass-relevant axis: it tells us which
//                    direction the top of the phone is pointing.
//                    We use ONLY this axis for compass heading.
//
//   beta (-180 to 180) — tilt front-to-back (X axis).
//                         0° = flat, 90° = upright.
//                         Not used for compass heading.
//
//   gamma (-90 to 90)  — tilt left-to-right (Y axis).
//                         0° = flat, ±90° = on its side.
//                         Not used for compass heading.
//
// LISTENER STRATEGY:
//   We attach BOTH event listeners simultaneously rather than picking one.
//   This is important because:
//     1. The absolute event may take a moment to arrive while the
//        magnetometer calibrates — the standard event provides interim data.
//     2. On iOS, only the standard event fires (with webkitCompassHeading).
//     3. Once the absolute event fires, we set a flag so the standard
//        handler yields to it — the highest-quality source always wins.
// ---------------------------------------------------------------------------

// Shared heading state — null means "no reading available yet"
let currentHeading = null;

// Tracks which event source is active so the UI can show calibration status.
// Ranked from most to least trustworthy:
//   'absolute' — deviceorientationabsolute event (best: hardware compass north)
//   'webkit'   — iOS webkitCompassHeading (good: Apple's fused compass)
//   'alpha-absolute' — standard event but event.absolute === true (good)
//   'alpha-relative' — standard event, alpha is NOT north-referenced (unreliable)
//   'unavailable'    — no sensor data at all
let headingSource = 'unavailable';

// Set to true once the dedicated absolute event fires successfully.
// Tells the standard-event handler to stop competing.
let absoluteEventActive = false;

/**
 * Returns the current compass heading of the device in degrees (0-360),
 * where 0 = north, 90 = east, 180 = south, 270 = west.
 *
 * Returns null when the sensor is unavailable, permission was denied,
 * or the device hasn't delivered a reading yet. Callers should treat null
 * as "heading unknown" and show a fallback UI (e.g. a calibration prompt
 * or a static north indicator).
 *
 * @returns {number | null}
 */
function getDeviceHeading() {
  return currentHeading;
}

/**
 * Requests the necessary permissions and starts listening for device
 * orientation events. Must be called from a user gesture on iOS.
 *
 * @returns {Promise<boolean>} — true if listening started, false if the
 *          sensor is unsupported or permission was denied.
 */
async function startHeadingUpdates() {
  // --- iOS 13+ permission gate ---
  // Safari requires an explicit user-gesture-driven permission request
  // before orientation events will fire.  If the method doesn't exist
  // (Android, older iOS) we skip straight to attaching listeners.
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== 'granted') {
        headingSource = 'unavailable';
        return false;
      }
    } catch {
      headingSource = 'unavailable';
      return false;
    }
  }

  // --- Attach BOTH listeners ---
  // We don't pick one-or-the-other.  Both are attached so:
  //   - The absolute handler fires on Chrome/Firefox Android and provides
  //     the best heading immediately.
  //   - The standard handler fires on ALL platforms and covers iOS
  //     (webkitCompassHeading) plus the gap before the absolute event
  //     calibrates.
  //   - Once the absolute handler fires, it sets absoluteEventActive=true
  //     so the standard handler yields automatically.
  let anyListenerAttached = false;

  if ('ondeviceorientationabsolute' in window) {
    window.addEventListener('deviceorientationabsolute', onAbsoluteOrientation);
    anyListenerAttached = true;
  }

  if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', onStandardOrientation);
    anyListenerAttached = true;
  }

  if (!anyListenerAttached) {
    // No orientation API at all (desktop browser, very old device).
    headingSource = 'unavailable';
    return false;
  }

  return true;
}


// ---------------------------------------------------------------------------
// Handler: 'deviceorientationabsolute'  (PREFERRED — compass north)
// ---------------------------------------------------------------------------
// This event only fires on browsers that have magnetometer access AND
// expose the absolute variant (Chrome Android 50+, Firefox Android).
// alpha is measured clockwise from magnetic north:
//   0° = north, 90° = east, 180° = south, 270° = west.
//
// This is the gold standard for compass heading.  We mark the absolute
// source as active so the standard handler yields.
//
// IMPORTANT:  The W3C spec defines alpha as increasing COUNTER-CLOCKWISE
// when viewed from above (turn left → alpha goes up).  Compass headings
// increase CLOCKWISE (turn right → heading goes up).  We must invert:
//   compassHeading = (360 − alpha) % 360
// ---------------------------------------------------------------------------
function onAbsoluteOrientation(event) {
  if (event.alpha == null) {
    // Sensor returned null — magnetometer still calibrating or hardware
    // issue.  Keep the previous reading rather than blinking to null.
    return;
  }

  currentHeading = (360 - event.alpha) % 360;
  headingSource = 'absolute';
  absoluteEventActive = true;
}


// ---------------------------------------------------------------------------
// Handler: 'deviceorientation'  (FALLBACK — three tiers of quality)
// ---------------------------------------------------------------------------
// The standard event fires on every mobile browser, but the meaning of
// alpha varies wildly.  We check three cases in order of reliability:
//
//   Tier 1 — event.webkitCompassHeading  (iOS Safari)
//     Apple's proprietary property.  Degrees clockwise from magnetic north.
//     This is Apple's fused sensor output and is the ONLY way to get a
//     compass heading on iOS, since iOS never fires the absolute event.
//
//   Tier 2 — event.absolute === true  (some Android browsers)
//     The W3C spec includes a boolean `absolute` property on every
//     DeviceOrientationEvent.  When true, the browser is telling us that
//     alpha is already referenced to magnetic north — even though this is
//     the standard event, not the absolute one.  Firefox Android commonly
//     does this.  We treat it the same as the absolute event.
//
//   Tier 3 — event.absolute === false / undefined  (last resort)
//     Alpha is relative to an ARBITRARY reference direction.  The spec
//     says it "may be the direction the device was pointing when the
//     sensor was initialized."  This is NOT reliable for a compass.
//     We still store it (converted to a clockwise-from-initial heading)
//     as a best-effort fallback so the arrow moves rather than being
//     frozen, but we flag the source as 'alpha-relative' so the UI can
//     warn the user that the heading is approximate.
// ---------------------------------------------------------------------------
function onStandardOrientation(event) {
  // If the dedicated absolute event is already providing data, don't
  // compete.  That source is strictly better than anything we can
  // extract from the standard event.
  if (absoluteEventActive) return;

  // --- Tier 1: iOS webkitCompassHeading ---
  if (event.webkitCompassHeading != null) {
    currentHeading = event.webkitCompassHeading;
    headingSource = 'webkit';
    return;
  }

  if (event.alpha == null) return;

  // --- Tier 2: standard event with absolute flag ---
  // event.absolute is a boolean defined by the W3C spec.  When true,
  // alpha is north-referenced — same semantics as the absolute event.
  // Same CCW→CW inversion as onAbsoluteOrientation (see note there).
  if (event.absolute === true) {
    currentHeading = (360 - event.alpha) % 360;
    headingSource = 'alpha-absolute';
    return;
  }

  // --- Tier 3: non-absolute alpha (unreliable for compass) ---
  // Alpha is measured counter-clockwise from an arbitrary reference in
  // the W3C coordinate frame.  We invert it to get a clockwise value
  // so that visual rotation direction is intuitive, but the zero-point
  // is meaningless — it is NOT north.
  currentHeading = (360 - event.alpha) % 360;
  headingSource = 'alpha-relative';
}


/**
 * Stops listening for orientation events. Call on teardown or when
 * the user navigates away.
 */
function stopHeadingUpdates() {
  window.removeEventListener('deviceorientationabsolute', onAbsoluteOrientation);
  window.removeEventListener('deviceorientation', onStandardOrientation);
  currentHeading = null;
  headingSource = 'unavailable';
  absoluteEventActive = false;
}

// ===== Bearing & Distance Calculation =====
// ---------------------------------------------------------------------------
// FORWARD AZIMUTH (initial bearing) on a sphere
//
// Problem: given two points on Earth's surface, what compass direction do
// you face at point A to walk in a straight line toward point B?
//
// On a flat plane this is trivial — just atan2(dy, dx).  On a sphere the
// "straight line" is a great-circle arc, and the direction you initially
// face (the forward azimuth) is NOT the same as the direction you'd face
// at the midpoint or at the destination, because meridians converge toward
// the poles.  The formula below computes that initial direction.
//
// The math uses the spherical law of sines and cosines applied to the
// "navigation triangle" formed by the two points and the North Pole:
//
//        North Pole
//           ╱╲
//          ╱  ╲
//     a   ╱    ╲  b          a = 90° − lat_A  (co-latitude of A)
//        ╱      ╲            b = 90° − lat_B  (co-latitude of B)
//       ╱   C    ╲           C = Δlng          (angle at the pole)
//      A ──────── B
//
// We want the angle at vertex A — the bearing from A toward B.
//
// From the spherical sine/cosine rules:
//   bearing = atan2(
//     sin(Δlng) · cos(lat_B),
//     cos(lat_A) · sin(lat_B) − sin(lat_A) · cos(lat_B) · cos(Δlng)
//   )
//
// The atan2 numerator is the EAST-WEST component of the direction:
//   sin(Δlng) · cos(lat_B) projects the longitude difference onto the
//   equatorial plane, scaled by how far B is from the pole.  Near the
//   equator cos(lat_B) ≈ 1 so longitude degrees map nearly 1:1 to
//   east-west distance.  Near the poles cos(lat_B) → 0, shrinking the
//   east-west component because meridians converge.
//
// The atan2 denominator is the NORTH-SOUTH component:
//   cos(lat_A)·sin(lat_B) is the "how far north B is" term.
//   sin(lat_A)·cos(lat_B)·cos(Δlng) subtracts the part of that northward
//   distance already accounted for by A's own latitude.  Together they
//   give the net northward displacement as seen from A along the
//   great-circle arc.
//
// atan2(east, north) then gives the angle measured clockwise from north,
// which is exactly what a compass bearing is.
// ---------------------------------------------------------------------------

/**
 * Calculates the initial compass bearing (forward azimuth) from point A
 * to point B along a great-circle path on a sphere.
 *
 * @param {number} lat1 — latitude of point A in decimal degrees
 * @param {number} lng1 — longitude of point A in decimal degrees
 * @param {number} lat2 — latitude of point B in decimal degrees
 * @param {number} lng2 — longitude of point B in decimal degrees
 * @returns {number} bearing in degrees, 0-360 (0 = north, 90 = east, etc.)
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  // --- Step 1: Convert degrees → radians ---
  // Trig functions in JavaScript operate on radians.
  // 1 degree = π/180 radians.
  const toRad = Math.PI / 180;
  const φ1 = lat1 * toRad;   // latitude of A in radians
  const φ2 = lat2 * toRad;   // latitude of B in radians
  const Δλ = (lng2 - lng1) * toRad;  // longitude difference in radians

  // --- Step 2: East-west component (x) ---
  // Project the longitude separation onto the equatorial plane.
  // Multiplying sin(Δλ) by cos(φ2) accounts for meridian convergence:
  // at high latitudes the same Δλ spans less physical east-west distance
  // because the longitude lines squeeze together near the poles.
  const x = Math.sin(Δλ) * Math.cos(φ2);

  // --- Step 3: North-south component (y) ---
  // This is the net northward displacement from A toward B along the
  // great-circle arc.
  //
  //   cos(φ1)·sin(φ2):
  //     "How far north is B?"  sin(φ2) is B's distance from the equator,
  //     scaled by cos(φ1) to project it onto A's local horizon.
  //
  //   sin(φ1)·cos(φ2)·cos(Δλ):
  //     "How much of that northward distance does A's own latitude already
  //     account for?"  This correction prevents the bearing from being
  //     biased northward when A is already at a high latitude.
  //
  // Subtracting gives the net north-south component as seen from A.
  const y = Math.cos(φ1) * Math.sin(φ2)
          - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  // --- Step 4: atan2(east, north) → bearing angle ---
  // atan2 returns the angle in radians from the positive Y axis (north)
  // toward the positive X axis (east), measured counter-clockwise in
  // standard math convention.  But because we passed (x, y) — i.e.
  // (east, north) — atan2 gives us the clockwise-from-north angle
  // directly, which is exactly how compass bearings work.
  //
  // The result is in the range (−π, π]:
  //   positive = clockwise from north (eastward bearings)
  //   negative = counter-clockwise from north (westward bearings)
  const θ = Math.atan2(x, y);

  // --- Step 5: Normalize to 0-360° ---
  // Convert radians → degrees, then shift negative values into the
  // positive range.  For example, a bearing of −90° (due west) becomes
  // 270°, matching the standard compass convention where north = 0°,
  // east = 90°, south = 180°, west = 270°.
  const bearing = ((θ * 180 / Math.PI) + 360) % 360;

  return bearing;
}

/**
 * Calculates the great-circle distance between two points using the
 * Haversine formula.
 *
 * @param {number} lat1 — latitude of point A in decimal degrees
 * @param {number} lng1 — longitude of point A in decimal degrees
 * @param {number} lat2 — latitude of point B in decimal degrees
 * @param {number} lng2 — longitude of point B in decimal degrees
 * @returns {number} distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6_371_000; // Earth's mean radius in meters
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;

  // Haversine of the central angle
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad)
          * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ---------------------------------------------------------------------------
// Project a point along a bearing at a given distance  (the "direct" problem)
// ---------------------------------------------------------------------------
// This is the inverse of calculateBearing + calculateDistance.  Given a
// starting point, a compass bearing, and a distance, it answers:
//   "If I walk X meters in direction Y, where do I end up?"
//
// The math uses the spherical law of cosines to solve the navigation
// triangle in the forward direction:
//
//        North Pole
//           /\
//          /  \
//     co‑φ₁ /    \ co‑φ₂       φ = latitude
//        /      \
//       / θ      \             θ = bearing (measured at start)
//      /___δ______\
//    Start        End          δ = angular distance = d / R
//
// Given: φ₁ (start lat), λ₁ (start lng), θ (bearing), δ (angular distance)
// Find:  φ₂ (end lat), λ₂ (end lng)
//
// Step 1 — Latitude of the destination:
//   sin(φ₂) = sin(φ₁)·cos(δ) + cos(φ₁)·sin(δ)·cos(θ)
//
//   This comes from the spherical law of cosines applied to the side
//   opposite the North Pole.  cos(θ) projects the travel distance onto
//   the north–south axis; the sin/cos(φ₁) terms account for the
//   starting latitude.
//
// Step 2 — Longitude offset:
//   Δλ = atan2( sin(θ)·sin(δ)·cos(φ₁),
//               cos(δ) − sin(φ₁)·sin(φ₂) )
//
//   sin(θ) projects the travel distance onto the east–west axis.
//   The atan2 resolves the correct quadrant, and the denominator
//   removes the latitude component so only the longitudinal shift
//   remains.
//
// @param {number} lat      — starting latitude in decimal degrees
// @param {number} lng      — starting longitude in decimal degrees
// @param {number} bearing  — compass bearing in degrees (0 = north, 90 = east)
// @param {number} distance — distance in meters
// @returns {{ lat: number, lng: number }}
// ---------------------------------------------------------------------------
function projectPoint(lat, lng, bearing, distance) {
  const R = 6_371_000; // Earth's mean radius in meters
  const toRad = Math.PI / 180;
  const toDeg = 180 / Math.PI;

  const φ1 = lat * toRad;
  const λ1 = lng * toRad;
  const θ  = bearing * toRad;
  const δ  = distance / R;       // angular distance in radians

  // Step 1 — destination latitude
  const sinφ2 = Math.sin(φ1) * Math.cos(δ)
              + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
  const φ2 = Math.asin(sinφ2);

  // Step 2 — destination longitude
  const Δλ = Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * sinφ2
  );
  const λ2 = λ1 + Δλ;

  return {
    lat: φ2 * toDeg,
    lng: λ2 * toDeg
  };
}


// ===== Cast a Point =====

// ---------------------------------------------------------------------------
// Adaptive distance steps — finer resolution close up, coarser at range.
// The minimum of 10m accounts for typical phone GPS accuracy of ±3-5m.
//
//   10–100m   in 5m steps    (19 values)
//   100–500m  in 25m steps   (16 values)
//   500–1000m in 50m steps   (10 values)
//   1–5km     in 250m steps  (16 values)
//   5–20km    in 1km steps   (15 values)
//   20–100km  in 5km steps   (16 values)
//                        total ≈ 92 values
// ---------------------------------------------------------------------------
function buildDistanceSteps() {
  const steps = [0];
  for (let d = 10;    d <= 100;    d += 5)    steps.push(d);
  for (let d = 125;   d <= 500;    d += 25)   steps.push(d);
  for (let d = 550;   d <= 1000;   d += 50)   steps.push(d);
  for (let d = 1250;  d <= 5000;   d += 250)  steps.push(d);
  for (let d = 6000;  d <= 20000;  d += 1000) steps.push(d);
  for (let d = 25000; d <= 100000; d += 5000) steps.push(d);
  return steps;
}

const DISTANCE_STEPS = buildDistanceSteps();


// ---------------------------------------------------------------------------
// Swipe gesture detection — 3 upward swipes within a time window
// ---------------------------------------------------------------------------
const SWIPE_MIN_DISTANCE = 50;   // px vertical delta to count as a swipe
const SWIPE_MAX_DURATION = 500;  // ms — max time for a single swipe
const SWIPE_WINDOW       = 2000; // ms — all 3 swipes must fit in this window
const SWIPES_REQUIRED    = 3;

let swipeStartY      = 0;
let swipeStartTime   = 0;
let consecutiveSwipes = 0;
let lastSwipeTime     = 0;

function onSwipeTouchStart(e) {
  if (state.castMode) return;
  swipeStartY    = e.touches[0].clientY;
  swipeStartTime = Date.now();
}

function onSwipeTouchEnd(e) {
  if (state.castMode) return;

  const endY    = e.changedTouches[0].clientY;
  const deltaY  = swipeStartY - endY;            // positive = upward
  const elapsed = Date.now() - swipeStartTime;

  if (deltaY > SWIPE_MIN_DISTANCE && elapsed < SWIPE_MAX_DURATION) {
    const now = Date.now();
    if (now - lastSwipeTime > SWIPE_WINDOW) {
      consecutiveSwipes = 0;                      // reset — too much time passed
    }
    consecutiveSwipes++;
    lastSwipeTime = now;

    if (consecutiveSwipes >= SWIPES_REQUIRED) {
      consecutiveSwipes = 0;
      enterCastMode();
    }
  } else {
    consecutiveSwipes = 0;
  }
}


// ---------------------------------------------------------------------------
// Cast mode management
// ---------------------------------------------------------------------------
function enterCastMode() {
  if (!state.position) {
    dom.distanceDisplay.textContent = 'GPS required to cast';
    return;
  }

  state.castMode = true;
  state.castDistanceIndex = findClosestStepIndex(100);  // default 100m

  // If the compass rose isn't currently visible (no destination), skip all
  // fade transitions to prevent a brief arrow flash.  The overlapping
  // parent opacity ramp-up (0.6s) and child opacity ramp-down (0.4s)
  // create a window where the arrow is partially visible — killing
  // transitions on the rose and its children avoids this entirely.
  const wasHidden = !dom.compassRose.classList.contains('visible');
  if (wasHidden) {
    dom.compassRose.classList.add('no-transition');
  }

  document.getElementById('app').classList.add('cast-active');

  if (wasHidden) {
    void dom.compassRose.offsetHeight;  // commit the no-transition state
    dom.compassRose.classList.remove('no-transition');
  }

  renderPicker();

  // Delay the picker fade-in so it appears AFTER the arrow has faded out.
  // When transitions were skipped (no destination), use a shorter delay
  // since there's no arrow animation to wait for.
  const pickerDelay = wasHidden ? 50 : 450;
  setTimeout(() => {
    if (!state.castMode) return;  // user cancelled before delay elapsed
    displayAngle = 0;
    dom.castPicker.classList.add('visible');
    dom.castControls.classList.add('visible');

    dom.castPicker.addEventListener('touchstart', onPickerTouchStart);
    dom.castPicker.addEventListener('touchmove',  onPickerTouchMove);
    dom.castPicker.addEventListener('touchend',   onPickerTouchEnd);
  }, pickerDelay);
}

function exitCastMode() {
  state.castMode = false;

  // Fade out picker and controls first
  dom.castPicker.classList.remove('visible');
  dom.castControls.classList.remove('visible');

  dom.castPicker.removeEventListener('touchstart', onPickerTouchStart);
  dom.castPicker.removeEventListener('touchmove',  onPickerTouchMove);
  dom.castPicker.removeEventListener('touchend',   onPickerTouchEnd);

  pickerAnimating = false;

  // If a destination was just set, delay removing cast-active so the
  // picker fades out before the arrow fades back in.  If there's no
  // destination (cancel, or cast failed), remove immediately with
  // transitions killed — otherwise the parent fading out while the
  // arrow fades back in creates a brief arrow flash.
  if (state.destination) {
    setTimeout(() => {
      if (state.castMode) return;  // re-entered cast mode during delay
      document.getElementById('app').classList.remove('cast-active');
    }, 400);
  } else {
    dom.compassRose.classList.add('no-transition');
    document.getElementById('app').classList.remove('cast-active');
    void dom.compassRose.offsetHeight;  // commit before restoring transitions
    dom.compassRose.classList.remove('no-transition');
  }
}

function findClosestStepIndex(targetMeters) {
  let closest = 0;
  let minDiff = Math.abs(DISTANCE_STEPS[0] - targetMeters);
  for (let i = 1; i < DISTANCE_STEPS.length; i++) {
    const diff = Math.abs(DISTANCE_STEPS[i] - targetMeters);
    if (diff < minDiff) { minDiff = diff; closest = i; }
  }
  return closest;
}


// ---------------------------------------------------------------------------
// Distance picker — touch-drag with momentum
// ---------------------------------------------------------------------------
let pickerDragOffset  = 0;      // fractional index offset during drag
let pickerVelocity    = 0;      // px/ms for momentum after release
let pickerLastMoveY   = 0;
let pickerLastMoveTime = 0;
let pickerAnimating   = false;

const PICKER_SENSITIVITY   = 0.02;  // index change per pixel dragged
const PICKER_MOMENTUM_DECAY = 0.92;

function onPickerTouchStart(e) {
  e.preventDefault();
  pickerAnimating   = false;
  pickerLastMoveY   = e.touches[0].clientY;
  pickerLastMoveTime = Date.now();
  pickerVelocity    = 0;
  pickerDragOffset  = 0;
}

function onPickerTouchMove(e) {
  e.preventDefault();
  const y  = e.touches[0].clientY;
  const now = Date.now();
  const deltaY = pickerLastMoveY - y;             // positive = finger up = increase

  const dt = now - pickerLastMoveTime;
  if (dt > 0) pickerVelocity = deltaY / dt;

  pickerLastMoveY    = y;
  pickerLastMoveTime = now;

  pickerDragOffset += deltaY * PICKER_SENSITIVITY;
  applyPickerOffset();
  renderPicker();
}

function onPickerTouchEnd(e) {
  e.preventDefault();
  if (Math.abs(pickerVelocity) > 0.3) {
    pickerAnimating = true;
    animatePickerMomentum();
  } else {
    pickerDragOffset = 0;
    renderPicker();
  }
}

function applyPickerOffset() {
  while (pickerDragOffset >= 1 && state.castDistanceIndex < DISTANCE_STEPS.length - 1) {
    state.castDistanceIndex++;
    pickerDragOffset -= 1;
  }
  while (pickerDragOffset <= -1 && state.castDistanceIndex > 0) {
    state.castDistanceIndex--;
    pickerDragOffset += 1;
  }
  // Clamp at boundaries
  if (state.castDistanceIndex === 0 && pickerDragOffset < 0) pickerDragOffset = 0;
  if (state.castDistanceIndex === DISTANCE_STEPS.length - 1 && pickerDragOffset > 0) pickerDragOffset = 0;
}

function animatePickerMomentum() {
  if (!pickerAnimating || !state.castMode) return;

  pickerDragOffset += pickerVelocity * 16 * PICKER_SENSITIVITY; // ~16ms frame
  pickerVelocity   *= PICKER_MOMENTUM_DECAY;

  applyPickerOffset();
  renderPicker();

  if (Math.abs(pickerVelocity) < 0.01) {
    pickerAnimating  = false;
    pickerDragOffset = 0;
    renderPicker();
    return;
  }
  requestAnimationFrame(animatePickerMomentum);
}


// ---------------------------------------------------------------------------
// Picker rendering — 5 labels: far, near, center, near, far
// ---------------------------------------------------------------------------
function renderPicker() {
  const idx    = state.castDistanceIndex;
  const labels = dom.castPicker.children;

  for (let offset = -2; offset <= 2; offset++) {
    const stepIdx = idx + offset;
    const label   = labels[offset + 2];

    if (stepIdx >= 0 && stepIdx < DISTANCE_STEPS.length) {
      label.textContent     = formatDistance(DISTANCE_STEPS[stepIdx]);
      label.style.visibility = 'visible';
    } else {
      label.textContent     = '';
      label.style.visibility = 'hidden';
    }
  }

  dom.distanceDisplay.textContent = formatDistance(DISTANCE_STEPS[idx]);
}


// ---------------------------------------------------------------------------
// Cast action — project a point using current heading + selected distance
// ---------------------------------------------------------------------------
function onCast() {
  const heading = getDeviceHeading();
  if (heading == null) {
    dom.distanceDisplay.textContent = 'Point phone in a direction first';
    return;
  }
  if (!state.position) {
    dom.distanceDisplay.textContent = 'GPS required to cast';
    return;
  }

  const distance  = DISTANCE_STEPS[state.castDistanceIndex];
  const projected = projectPoint(
    state.position.lat, state.position.lng,
    heading, distance
  );

  setDestinationFromCoords(projected.lat, projected.lng, distance, heading);
  exitCastMode();
}

function onCastCancel() {
  exitCastMode();
}


// ===== Compass Rendering =====

// Smoothed rotation angle — tracked across frames so we can always take
// the shortest rotational path and avoid the 359°→1° full-spin problem.
let displayAngle = 0;

/**
 * Main render loop — called every animation frame.
 * Reads the latest sensor state, computes the arrow angle, and updates
 * the DOM.  All DOM writes happen here to keep the rest of the code
 * purely data-driven.
 */
function render() {
  updateStatusDisplay();

  const heading = getDeviceHeading();

  // --- Cast mode rendering ---
  // In cast mode the arrow is hidden via CSS (.cast-active forces
  // compass-rose to opacity:1 and arrow/tail to opacity:0).
  // We do NOT add .visible here — that class is only for normal nav.
  if (state.castMode) {

    if (heading != null) {
      dom.bearingDisplay.textContent = `${Math.round(heading)}°`;
    } else {
      dom.bearingDisplay.textContent = 'Aim phone\u2026';
    }
    // Distance display is managed by renderPicker()

    requestAnimationFrame(render);
    return;
  }

  // --- Normal navigation rendering ---

  // Determine target bearing:
  //   - Destination set → point at destination
  //   - No destination  → point at north (bearing = 0), acting as a simple compass
  let targetBearing = 0;
  let distance = null;

  if (state.destination && state.position) {
    targetBearing = calculateBearing(
      state.position.lat, state.position.lng,
      state.destination.lat, state.destination.lng
    );
    distance = calculateDistance(
      state.position.lat, state.position.lng,
      state.destination.lat, state.destination.lng
    );
  }

  // Arrival threshold — adapts to current GPS accuracy.  Floor of 10m
  // prevents flickering when the signal is unusually good.  When accuracy
  // is poor the zone widens so you still trigger arrival reliably.
  const accuracy = state.position ? state.position.accuracy : 10;
  const ARRIVAL_RADIUS = Math.max(10, accuracy);
  const arrived = distance != null && distance < ARRIVAL_RADIUS;

  // Fire achievement check on the transition into arrived state (once per destination)
  if (arrived && !state.arrivedAtCurrent) {
    state.arrivedAtCurrent = true;
    persistArrivedFlag();
    checkAchievements('arrival');
  }

  // Only show and rotate the arrow when a destination is active.
  // The arrow fades in via a CSS transition on the .visible class.
  if (state.destination && state.position && heading != null) {
    if (arrived) {
      // Stop rotating the arrow and switch to the arrival indicator
      dom.arrowGroup.setAttribute('transform', 'rotate(0,100,100)');
      dom.compassRose.classList.add('visible', 'arrived');
    } else {
      dom.compassRose.classList.remove('arrived');

      const targetAngle = targetBearing - heading;

      // Shortest-path interpolation: normalize the delta to [−180, 180]
      // so the arrow never spins the long way around.
      let diff = targetAngle - displayAngle;
      diff = ((diff % 360) + 540) % 360 - 180;

      // Exponential lerp — 0.2 gives ~95% convergence in ~250ms at 60fps.
      // Fast enough to feel responsive, slow enough to filter sensor jitter.
      displayAngle += diff * 0.2;

      dom.arrowGroup.setAttribute('transform', `rotate(${displayAngle},100,100)`);
      dom.compassRose.classList.add('visible');
    }
  } else {
    dom.compassRose.classList.remove('visible', 'arrived');
  }

  // Update text readouts
  if (arrived) {
    dom.bearingDisplay.textContent = 'Arrived';
    dom.distanceDisplay.textContent = formatDistance(distance);
  } else if (state.destination && state.position && heading != null) {
    dom.bearingDisplay.textContent = `${Math.round(targetBearing)}°`;
    dom.distanceDisplay.textContent = formatDistance(distance);
  } else if (!state.destination) {
    dom.bearingDisplay.textContent = '--';
    dom.distanceDisplay.textContent = 'Set a destination to begin';
  } else {
    dom.bearingDisplay.textContent = '--';
    dom.distanceDisplay.textContent = 'Acquiring sensors\u2026';
  }

  requestAnimationFrame(render);
}

/**
 * Formats a distance in meters to a human-readable string.
 * Under 1 km: shows meters.  1 km and above: shows km with one decimal.
 */
function formatDistance(meters) {
  if (meters == null) return '--';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Pushes the latest sensor state into the status bar badges and
 * the current-coordinates readout.
 */
function updateStatusDisplay() {
  // --- GPS badge ---
  if (state.gpsError) {
    dom.gpsStatus.textContent = state.gpsError;
    dom.gpsStatus.className = 'status-badge error';
  } else if (state.position) {
    const acc = Math.round(state.position.accuracy);
    dom.gpsStatus.textContent = `GPS: \u00B1${acc}m`;
    dom.gpsStatus.className = 'status-badge' + (acc <= 20 ? ' good' : ' warn');
  } else {
    dom.gpsStatus.textContent = 'GPS: waiting';
    dom.gpsStatus.className = 'status-badge';
  }

  // --- Compass badge ---
  const sourceLabels = {
    'absolute':       ['Compass', 'good'],
    'webkit':         ['Compass', 'good'],
    'alpha-absolute': ['Compass', 'good'],
    'alpha-relative': ['Compass (approx)', 'warn'],
    'unavailable':    ['No compass', 'error'],
  };
  const [label, cls] = sourceLabels[headingSource] || ['Compass: waiting', ''];
  dom.headingStatus.textContent = label;
  dom.headingStatus.className = 'status-badge' + (cls ? ` ${cls}` : '');

  // --- Current coordinates ---
  if (state.position) {
    dom.currentCoords.textContent =
      `${state.position.lat.toFixed(5)}, ${state.position.lng.toFixed(5)}`;
  }
}

// ===== Destination Input Parsing =====

/**
 * Parses a user-supplied string and attempts to extract latitude and longitude.
 *
 * Supported formats:
 *   1. Raw coordinate pair  — "40.7128, -74.0060" or "40.7128 -74.0060"
 *   2. DMS (Degrees/Min/Sec) — 42°11'36.0"N 88°04'03.9"W
 *   3. Google Maps URL       — various google.com/maps URL patterns
 *   4. Apple Maps URL        — maps.apple.com with coordinate params
 *   5. Plus Code (Open Location Code) — "87G8Q2PQ+VX"
 *
 * @param {string} input — the raw string from the user
 * @returns {{ lat: number, lng: number, type: string } | null}
 *          Returns an object with coordinates and detected type, or null if
 *          the input could not be parsed.
 */
function parseDestinationInput(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Try each parser in order of specificity.
  // Google Maps URLs are checked first because they may contain raw coordinate
  // substrings — matching them early avoids a false positive on the raw parser.
  return parseGoogleMapsUrl(trimmed)
      || parseAppleMapsUrl(trimmed)
      || parseDMS(trimmed)
      || parsePlusCode(trimmed)
      || parseRawCoordinates(trimmed);
}


// ---------------------------------------------------------------------------
// 1. Raw Coordinate Pair
// ---------------------------------------------------------------------------
// Matches strings like:
//   "40.7128, -74.0060"    — comma-separated
//   "40.7128 -74.0060"     — space-separated
//   "-33.8688, 151.2093"   — negative values (southern / western hemispheres)
//
// The regex captures an optional sign, digits, optional decimal portion for
// each of the two numbers, separated by a comma and/or whitespace.
// After extraction the values are validated against geographic bounds:
//   latitude  must be in [-90,  90]
//   longitude must be in [-180, 180]
// ---------------------------------------------------------------------------
const RAW_COORD_RE = /^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/;

function parseRawCoordinates(str) {
  const match = str.match(RAW_COORD_RE);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (!isValidCoordinate(lat, lng)) return null;

  return { lat, lng, type: 'raw' };
}


// ---------------------------------------------------------------------------
// 2. DMS (Degrees, Minutes, Seconds)
// ---------------------------------------------------------------------------
// Matches coordinate strings in degree/minute/second notation, for example:
//
//   42°11'36.0"N 88°04'03.9"W
//   42°11'36"N, 88°4'3.9"W       — leading zeros optional, comma optional
//   42 11 36.0 N 88 04 03.9 W    — plain spaces instead of symbols
//
// Each component is:
//   degrees (integer) + minutes (integer) + seconds (decimal) + hemisphere
//
// Conversion to decimal degrees:
//   decimal = degrees + minutes/60 + seconds/3600
//
// The hemisphere letter (N/S for latitude, E/W for longitude) determines sign:
//   N and E are positive, S and W are negative.
//
// The regex accepts the degree symbol (° or \u00B0), ASCII apostrophe or the
// prime character (\u2032) for minutes, and ASCII double-quote or the
// double-prime character (\u2033) for seconds — covering both typed and
// copy-pasted variants.
// ---------------------------------------------------------------------------
const DMS_COMPONENT_RE =
  /(\d{1,3})\s*[°\u00B0]?\s*(\d{1,2})\s*['\u2032]?\s*(\d{1,2}(?:\.\d+)?)\s*["\u2033]?\s*([NSEWnsew])/g;

function parseDMS(str) {
  // Reset the regex lastIndex since we reuse it with the global flag.
  DMS_COMPONENT_RE.lastIndex = 0;

  // We expect exactly two DMS components — one for latitude, one for longitude.
  const parts = [];
  let m;
  while ((m = DMS_COMPONENT_RE.exec(str)) !== null) {
    const deg = parseFloat(m[1]);
    const min = parseFloat(m[2]);
    const sec = parseFloat(m[3]);
    const hem = m[4].toUpperCase();

    // Validate ranges: degrees 0-180, minutes 0-59, seconds 0-59.999…
    if (min >= 60 || sec >= 60) return null;

    let decimal = deg + min / 60 + sec / 3600;

    // Apply hemisphere sign: S and W are negative.
    if (hem === 'S' || hem === 'W') decimal = -decimal;

    parts.push({ value: decimal, hemisphere: hem });
  }

  if (parts.length !== 2) return null;

  // Determine which component is latitude (N/S) and which is longitude (E/W).
  // Accept them in either order so "88°W 42°N" works just as well.
  let lat, lng;
  for (const p of parts) {
    if (p.hemisphere === 'N' || p.hemisphere === 'S') lat = p.value;
    else lng = p.value;
  }

  // Both a lat and lng component must be present.
  if (lat == null || lng == null) return null;
  if (!isValidCoordinate(lat, lng)) return null;

  return { lat, lng, type: 'dms' };
}


// ---------------------------------------------------------------------------
// 3. Google Maps URL
// ---------------------------------------------------------------------------
// Google Maps uses several URL patterns that embed coordinates:
//
//   a) Query parameter:  google.com/maps?q=LAT,LNG
//   b) "At" notation:    google.com/maps/@LAT,LNG,ZOOM
//   c) Place pages:      google.com/maps/place/NAME/@LAT,LNG,ZOOM
//   d) Directions:       google.com/maps/dir/ORIGIN/LAT,LNG
//
// Strategy: first confirm the URL belongs to a Google Maps domain, then
// apply two regexes that cover the patterns above:
//   - /@(-?\d+\.\d+),(-?\d+\.\d+)   — catches @ notation (b, c)
//   - [?&]q=(-?\d+\.\d+),(-?\d+\.\d+) — catches query param (a)
//   - /dir/.../ fallback             — catches directions endpoint (d)
//
// Shortened URLs (maps.app.goo.gl/… , goo.gl/maps/…) are handled separately
// by resolveShortGoogleMapsUrl() which attempts to follow the redirect when
// the device is online.  parseGoogleMapsUrl() still returns null for them so
// that the sync parsing path does not silently swallow them.
// ---------------------------------------------------------------------------
const GMAPS_DOMAIN_RE = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
const GMAPS_SHORT_RE  = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\//i;
const GMAPS_AT_RE     = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
const GMAPS_QUERY_RE  = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;

/** Returns true if the string is a shortened Google Maps URL. */
function isShortGoogleMapsUrl(str) {
  return GMAPS_SHORT_RE.test(str.trim());
}

/**
 * Attempts to resolve a shortened Google Maps URL by following the redirect.
 * Requires an internet connection.
 *
 * Returns { parsed } on success, or { error: string } explaining the failure.
 * The fetch will be blocked by CORS on most browsers — that's expected.
 * When it fails we return an error string so the caller can guide the user.
 */
async function resolveShortGoogleMapsUrl(shortUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const resp = await fetch(shortUrl, {
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // The browser followed redirects; response.url is the final destination
    const finalUrl = resp.url;
    if (finalUrl && finalUrl !== shortUrl) {
      const parsed = parseGoogleMapsUrl(finalUrl);
      if (parsed) return { parsed };
    }

    // Fallback: scan the response body for coordinate patterns
    const text = await resp.text();
    const match = text.match(GMAPS_AT_RE) || text.match(GMAPS_QUERY_RE);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isValidCoordinate(lat, lng)) {
        return { parsed: { lat, lng, type: 'google_maps_url' } };
      }
    }

    return { error: 'no-coords' };
  } catch (e) {
    clearTimeout(timeout);
    // CORS or network failure — the most common case
    const isCors = e instanceof TypeError;
    return { error: isCors ? 'cors' : 'network' };
  }
}

function parseGoogleMapsUrl(str) {
  if (!GMAPS_DOMAIN_RE.test(str)) return null;

  // Shortened links are resolved asynchronously by the caller — skip here
  if (GMAPS_SHORT_RE.test(str)) return null;

  // Try the @ notation first (more common in copy-pasted URLs)
  let match = str.match(GMAPS_AT_RE);
  if (!match) {
    // Fall back to query-parameter form
    match = str.match(GMAPS_QUERY_RE);
  }
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (!isValidCoordinate(lat, lng)) return null;

  return { lat, lng, type: 'google_maps_url' };
}


// ---------------------------------------------------------------------------
// 4. Apple Maps URL
// ---------------------------------------------------------------------------
// Apple Maps links use the maps.apple.com domain with several query-parameter
// patterns that can embed coordinates:
//
//   a) Place:      maps.apple.com/place?coordinate=LAT,LNG
//   b) Center:     maps.apple.com/?ll=LAT,LNG
//   c) Search:     maps.apple.com/?q=LAT,LNG
//   d) Directions: maps.apple.com/?daddr=LAT,LNG  (or saddr for source)
//
// URLs that use only an `auid` parameter (Apple's unique place ID) contain no
// coordinates and cannot be resolved offline — those are treated identically
// to shortened Google Maps links.
// ---------------------------------------------------------------------------
const APPLE_MAPS_RE   = /^https?:\/\/maps\.apple\.com\b/i;
const APPLE_COORD_RE  = /[?&](?:coordinate|ll|q|daddr|saddr)=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
const APPLE_AUID_ONLY = /[?&]auid=\d/;

/**
 * Returns true if the string is an Apple Maps URL that has no extractable
 * coordinates (auid-only link).
 */
function isShortAppleMapsUrl(str) {
  return APPLE_MAPS_RE.test(str) && APPLE_AUID_ONLY.test(str) && !APPLE_COORD_RE.test(str);
}

function parseAppleMapsUrl(str) {
  if (!APPLE_MAPS_RE.test(str)) return null;

  // auid-only links need online resolution — skip in the sync parser
  if (isShortAppleMapsUrl(str)) return null;

  const match = str.match(APPLE_COORD_RE);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  if (!isValidCoordinate(lat, lng)) return null;

  return { lat, lng, type: 'apple_maps_url' };
}


// ---------------------------------------------------------------------------
// 5. Plus Code  (Open Location Code)
// ---------------------------------------------------------------------------
// Plus Codes are a geocoding system created by Google that encodes a location
// into a short alphanumeric string.  Example: "87G8Q2PQ+VX"
//
// Anatomy of a Plus Code:
//   - Uses a 20-character alphabet: "23456789CFGHJMPQRVWX"
//     (chosen to avoid ambiguous characters like 0/O, 1/I/L)
//   - Contains a '+' separator after the 8th character
//   - The first 8 characters (4 pairs) encode progressively finer lat/lng
//     grid cells, each pair narrowing by a factor of 20
//   - Characters after the '+' refine further using a 4×5 sub-grid
//
// Decoding algorithm (simplified):
//   1. Strip the '+' and pad to 15 characters with '2' (the zero-value char)
//   2. Walk through character pairs:
//      - Pairs 1-5 (positions 0-9): each character maps to a base-20 digit.
//        Odd positions (0,2,4,6,8) contribute to latitude,
//        even positions (1,3,5,7,9) contribute to longitude.
//        Each successive pair divides the previous cell by 20.
//      - Positions 11-14 (the refinement characters after the separator):
//        each character indexes into a 4-row × 5-column sub-grid,
//        providing ~3 m × 3 m precision.
//   3. The final lat/lng is the center of the smallest resolved cell.
//
// The implementation below handles full 10+ character codes.
// Short (relative) codes like "Q2PQ+VX" require a reference location and
// are not supported here — the user should provide a full code.
// ---------------------------------------------------------------------------
const OLC_ALPHABET = '23456789CFGHJMPQRVWX';
const PLUS_CODE_RE = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,}$/i;

function parsePlusCode(str) {
  const upper = str.toUpperCase();
  if (!PLUS_CODE_RE.test(upper)) return null;

  const decoded = decodePlusCode(upper);
  if (!decoded) return null;

  return { lat: decoded.lat, lng: decoded.lng, type: 'plus_code' };
}

/**
 * Decodes a full Open Location Code into a lat/lng center point.
 *
 * @param {string} code — uppercase Plus Code with '+' included
 * @returns {{ lat: number, lng: number } | null}
 */
function decodePlusCode(code) {
  // Strip the '+' separator to get a flat sequence of code characters
  const stripped = code.replace('+', '');

  // Pad to 15 characters so the refinement section is always present.
  // '2' is the zero-value character in the OLC alphabet.
  const padded = stripped.padEnd(15, '2');

  // --- Decode the first 10 characters (5 pairs) ---
  // Starting resolution: latitude spans 20 degrees, longitude spans 20 degrees.
  // Each pair narrows by ÷20, giving resolutions of:
  //   Pair 1: 20°    → Pair 2: 1°    → Pair 3: 0.05° (≈5.5 km)
  //   Pair 4: 0.0025° (≈275 m)       → Pair 5: 0.000125° (≈14 m)
  let lat = 0;
  let lng = 0;
  let latRes = 20;   // degrees per step for latitude
  let lngRes = 20;   // degrees per step for longitude

  for (let i = 0; i < 10; i += 2) {
    const latIdx = OLC_ALPHABET.indexOf(padded[i]);
    const lngIdx = OLC_ALPHABET.indexOf(padded[i + 1]);
    if (latIdx < 0 || lngIdx < 0) return null;

    lat += latIdx * latRes;
    lng += lngIdx * lngRes;

    // Narrow the resolution for the next pair
    latRes /= 20;
    lngRes /= 20;
  }

  // --- Decode refinement characters (positions 10-14) ---
  // Each refinement character indexes into a 4-row × 5-column sub-grid,
  // providing ~3 m precision at full length.
  for (let i = 10; i < padded.length; i++) {
    const idx = OLC_ALPHABET.indexOf(padded[i]);
    if (idx < 0) return null;

    const row = Math.floor(idx / 5); // 4 rows  (lat dimension)
    const col = idx % 5;             // 5 cols  (lng dimension)

    latRes /= 4;
    lngRes /= 5;

    lat += row * latRes;
    lng += col * lngRes;
  }

  // Return the center of the final cell rather than the south-west corner
  lat += latRes / 2;
  lng += lngRes / 2;

  // OLC grid is offset: latitude starts at -90, longitude at -180
  lat -= 90;
  lng -= 180;

  if (!isValidCoordinate(lat, lng)) return null;

  return { lat, lng };
}


// ---------------------------------------------------------------------------
// Shared validation helper
// ---------------------------------------------------------------------------
function isValidCoordinate(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng)
      && lat >= -90 && lat <= 90
      && lng >= -180 && lng <= 180;
}


// ===== Destination Management =====

const DEST_STORAGE_KEY = 'compass_destination';

/**
 * Parses the input string, stores the destination, and persists it to
 * localStorage so it survives page reloads and offline restarts.
 *
 * @param {string} input — raw user input (coordinates, URL, or Plus Code)
 * @returns {boolean} true if the input was valid and saved
 */
function setDestination(input) {
  const parsed = parseDestinationInput(input);
  if (!parsed) return false;

  // Calculate initial distance from current GPS if available
  let initialDistance = 0;
  if (state.position) {
    initialDistance = calculateDistance(
      state.position.lat, state.position.lng,
      parsed.lat, parsed.lng
    );
  }

  state.destination = {
    lat: parsed.lat, lng: parsed.lng,
    source: 'input', initialDistance,
  };
  state.arrivedAtCurrent = false;
  localStorage.setItem(DEST_STORAGE_KEY, JSON.stringify(state.destination));

  dom.destInfo.textContent =
    `Destination: ${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)} (${parsed.type})`;
  dom.destInfo.classList.remove('hidden');

  return true;
}

/**
 * Sets the destination directly from coordinates (bypasses string parsing).
 * Used by the cast feature when projecting a point.
 */
function setDestinationFromCoords(lat, lng, distance, bearing) {
  if (!isValidCoordinate(lat, lng)) return false;

  state.destination = {
    lat, lng,
    source: 'cast', initialDistance: distance,
  };
  state.arrivedAtCurrent = false;
  localStorage.setItem(DEST_STORAGE_KEY, JSON.stringify(state.destination));

  const info = `Cast: ${lat.toFixed(5)}, ${lng.toFixed(5)} `
    + `(${formatDistance(distance)} at ${Math.round(bearing)}\u00B0)`;
  dom.destInfo.textContent = info;
  dom.destInfo.classList.remove('hidden');

  return true;
}

/**
 * Restores a previously saved destination from localStorage on startup.
 */
function loadDestination() {
  try {
    const saved = localStorage.getItem(DEST_STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    const { lat, lng } = data;
    if (isValidCoordinate(lat, lng)) {
      state.destination = {
        lat, lng,
        source: data.source || 'input',
        initialDistance: data.initialDistance || 0,
      };
      state.arrivedAtCurrent = !!data.arrivedAtCurrent;
      dom.destInfo.textContent = `Destination: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      dom.destInfo.classList.remove('hidden');
    }
  } catch {
    // Corrupt data in storage — silently ignore
  }
}

/** Persists the arrivedAtCurrent flag into the stored destination so it survives reloads. */
function persistArrivedFlag() {
  try {
    const saved = localStorage.getItem(DEST_STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);
    data.arrivedAtCurrent = state.arrivedAtCurrent;
    localStorage.setItem(DEST_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ===== Achievements =====

const TUTORIAL_KEY     = 'compass_tutorial_done';
const ACHIEVEMENTS_KEY = 'compass_achievements';

/**
 * Loads the achievement save file from localStorage.
 * Returns { unlocked: { id: timestamp, ... }, stats: { totalDistance: meters } }
 */
function loadAchievements() {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return {
        unlocked: data.unlocked || {},
        stats: { totalDistance: 0, totalArrivals: 0, castArrivals: 0, ...data.stats },
      };
    }
  } catch { /* corrupt data — start fresh */ }
  return { unlocked: {}, stats: { totalDistance: 0, totalArrivals: 0, castArrivals: 0 } };
}

function saveAchievements(data) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(data));
}

/**
 * Checks all achievements against the current context.
 * Called on arrival transitions and after importing data.
 *
 * @param {'arrival'} event — the trigger event type
 * @param {object} [dataOverride] — pre-loaded achievement data (used by import
 *        to check against freshly-merged stats without re-accumulating distance)
 */
function checkAchievements(event, dataOverride) {
  const data = dataOverride || loadAchievements();

  const source = state.destination ? state.destination.source : null;

  // Accumulate stats on arrival (skip when checking imported data —
  // the imported stats already contain the correct totals)
  if (!dataOverride && event === 'arrival') {
    data.stats.totalArrivals++;
    if (source === 'cast') data.stats.castArrivals++;
    if (state.destination && state.destination.initialDistance) {
      data.stats.totalDistance += state.destination.initialDistance;
    }
  }

  const ctx = {
    event,
    source,
    initialDistance: state.destination ? state.destination.initialDistance : 0,
    totalDistance: data.stats.totalDistance,
    totalArrivals: data.stats.totalArrivals,
    castArrivals: data.stats.castArrivals,
  };

  const newlyUnlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (data.unlocked[achievement.id]) continue;
    if (achievement.check(ctx)) {
      data.unlocked[achievement.id] = Date.now();
      newlyUnlocked.push(achievement);
    }
  }

  // Always save — stats may have changed even if no new achievement
  saveAchievements(data);

  if (newlyUnlocked.length > 0) {
    updateAchievementButton();
    for (const a of newlyUnlocked) {
      showAchievementToast(a);
    }
  }
}

/**
 * Shows or hides the trophy button based on whether any achievements are unlocked.
 */
function updateAchievementButton() {
  const data = loadAchievements();
  const count = Object.keys(data.unlocked).length;
  if (count > 0) {
    dom.achievementBtn.textContent = `\uD83C\uDFC6 ${count}`;
    dom.achievementBtn.classList.remove('hidden');
  } else {
    dom.achievementBtn.classList.add('hidden');
  }
}

/**
 * Shows a brief toast notification when an achievement unlocks.
 */
let toastTimeout = null;
function showAchievementToast(achievement) {
  dom.achievementToast.textContent = `\uD83C\uDFC6 ${achievement.name}`;
  dom.achievementToast.classList.add('visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    dom.achievementToast.classList.remove('visible');
  }, 3000);
}

/**
 * Opens the achievement panel overlay showing all achievements.
 */
function showAchievementPanel() {
  const data = loadAchievements();
  const list = dom.achievementPanel.querySelector('.achievement-list');
  list.innerHTML = '';

  for (const a of ACHIEVEMENTS) {
    const unlockTime = data.unlocked[a.id];
    const item = document.createElement('div');
    item.className = 'achievement-item' + (unlockTime ? '' : ' locked');

    const name = document.createElement('div');
    name.className = 'achievement-name';
    name.textContent = a.name;

    const desc = document.createElement('div');
    desc.className = 'achievement-desc';
    desc.textContent = a.description;

    item.appendChild(name);
    item.appendChild(desc);

    if (unlockTime) {
      const date = document.createElement('div');
      date.className = 'achievement-date';
      date.textContent = new Date(unlockTime).toLocaleDateString();
      item.appendChild(date);
    }

    list.appendChild(item);
  }

  // Show stats
  const statsEl = dom.achievementPanel.querySelector('.achievement-stats');
  statsEl.textContent = `${data.stats.totalArrivals} arrivals \u00B7 ${formatDistance(data.stats.totalDistance)} traveled`;

  dom.achievementPanel.classList.add('visible');
}

function hideAchievementPanel() {
  dom.achievementPanel.classList.remove('visible');
  // Hide import area if it was open
  const importArea = dom.achievementPanel.querySelector('.import-area');
  if (importArea) importArea.classList.add('hidden');
}

/**
 * Simple checksum for tamper detection.  Not cryptographic — just enough
 * to prevent casual editing of exported achievement strings.
 */
function achievementChecksum(str) {
  let h = 0x811c9dc5;                       // FNV-1a offset basis
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);           // FNV-1a prime
  }
  return (h >>> 0).toString(36);             // unsigned, base-36
}

/**
 * Exports achievement data to clipboard as an encoded string.
 */
function exportAchievements() {
  const data = loadAchievements();
  const json = JSON.stringify(data);
  const check = achievementChecksum(json);
  const encoded = btoa(check + '.' + json);
  const btn = dom.achievementPanel.querySelector('.export-btn');
  const original = btn.textContent;

  navigator.clipboard.writeText(encoded).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 1200);
  });
}

/**
 * Decodes and validates an achievement export string.
 * Returns the parsed object or throws on invalid/tampered data.
 */
function decodeAchievementString(str) {
  const decoded = atob(str);
  const dotIdx = decoded.indexOf('.');
  if (dotIdx === -1) throw new Error('Invalid format');
  const check = decoded.slice(0, dotIdx);
  const json = decoded.slice(dotIdx + 1);
  if (achievementChecksum(json) !== check) throw new Error('Checksum mismatch');
  const obj = JSON.parse(json);
  if (!obj.unlocked || !obj.stats) throw new Error('Invalid data');
  return obj;
}

/**
 * Imports achievement data from an encoded string, merging with existing progress.
 */
function importAchievements(encodedStr) {
  try {
    const imported = decodeAchievementString(encodedStr);

    const current = loadAchievements();

    // Merge unlocked: keep the earlier timestamp for each achievement
    for (const [id, timestamp] of Object.entries(imported.unlocked)) {
      if (!current.unlocked[id] || timestamp < current.unlocked[id]) {
        current.unlocked[id] = timestamp;
      }
    }

    // Merge stats: take the higher value for each
    current.stats.totalDistance = Math.max(
      current.stats.totalDistance,
      imported.stats.totalDistance || 0
    );
    current.stats.totalArrivals = Math.max(
      current.stats.totalArrivals,
      imported.stats.totalArrivals || 0
    );
    current.stats.castArrivals = Math.max(
      current.stats.castArrivals,
      imported.stats.castArrivals || 0
    );

    saveAchievements(current);

    // Check if the imported stats unlock any new achievements immediately
    // (e.g., totalDistance crossing 500 km from the merged data)
    checkAchievements('arrival', current);

    showAchievementPanel(); // refresh the panel

    return true;
  } catch {
    return false;
  }
}

// ===== Help Panel =====

function showHelpPanel() {
  dom.helpPanel.classList.add('visible');
}

function hideHelpPanel() {
  dom.helpPanel.classList.remove('visible');
}

// ===== Tutorial =====

function getTutorialSteps(platform) {
  let installText;
  if (platform.isSafari) {
    installText = 'Tap <strong>Share</strong> (square with arrow) then <strong>Add to Home Screen</strong> in Safari.';
  } else if (platform.isChrome || !platform.isMobile) {
    installText = 'Tap the browser menu and select <strong>Add to Home Screen</strong>.';
  } else {
    installText = 'Open in Chrome or Safari and add to your home screen.';
  }

  return [
    {
      title: 'Welcome',
      body: 'Compass Quest points you toward your destination &mdash; no turn-by-turn, no fixed route. '
          + 'Pick a bearing, choose your own path, find adventure along the way.',
    },
    {
      title: 'Set a Destination',
      body: 'Paste coordinates, a Google Maps URL, or a Plus Code into the input at the bottom and tap <strong>Set</strong>. '
          + 'The arrow starts pointing immediately.',
    },
    {
      title: 'Share Coordinates',
      body: 'Tap the coordinate text at the bottom of the screen to copy your location or destination to the clipboard. '
          + 'Easy to share with comrades.',
    },
    {
      title: 'Cast a Point',
      body: 'No specific destination in mind? Swipe up 3&times to enter cast mode. '
          + 'Aim your phone, pick a distance, tap <strong>Cast</strong>. Great for wandering somewhere new or "to that thing on the horizon".',
    },
    {
      title: 'Install Locally',
      body: installText + ' The app works fully offline once installed. ',
    },
    {
      title: 'Help',
      body: 'Tap the <strong>?</strong> in the upper right corner for help anytime.',
    },
  ];
}

function shouldShowTutorial() {
  try { return !localStorage.getItem(TUTORIAL_KEY); }
  catch { return false; }
}

function markTutorialDone() {
  try { localStorage.setItem(TUTORIAL_KEY, '1'); } catch (_) {}
}

function showTutorial(platform) {
  tutorialSteps = getTutorialSteps(platform);
  tutorialStep = 0;
  renderTutorialStep();
  dom.tutorialPanel.classList.add('visible');
}

function hideTutorial() {
  dom.tutorialPanel.classList.remove('visible');
  markTutorialDone();
}

function renderTutorialStep() {
  const step = tutorialSteps[tutorialStep];
  dom.tutorialTitle.textContent = step.title;
  dom.tutorialBody.innerHTML = step.body;

  // Rebuild dot indicators
  dom.tutorialDots.innerHTML = '';
  for (let i = 0; i < tutorialSteps.length; i++) {
    const dot = document.createElement('span');
    dot.className = 'tutorial-dot' + (i === tutorialStep ? ' active' : '');
    dom.tutorialDots.appendChild(dot);
  }

  // Last step: "Start" button, no Skip
  const isLast = tutorialStep === tutorialSteps.length - 1;
  dom.tutorialNext.textContent = isLast ? 'Start' : 'Next';
  dom.tutorialSkip.style.display = isLast ? 'none' : '';
}

function onTutorialNext() {
  if (tutorialStep < tutorialSteps.length - 1) {
    tutorialStep++;
    renderTutorialStep();
  } else {
    hideTutorial();
  }
}

// ===== Clipboard =====

/**
 * Copies coordinates to the clipboard and briefly flashes "Copied!" feedback.
 * @param {'position'|'destination'} which — which coordinate pair to copy
 */
function copyCoords(which) {
  const source = which === 'position' ? state.position : state.destination;
  if (!source) return;

  const text = `${source.lat.toFixed(6)}, ${source.lng.toFixed(6)}`;
  const el = which === 'position' ? dom.currentCoords : dom.destInfo;
  const original = el.textContent;

  navigator.clipboard.writeText(text).then(() => {
    el.textContent = 'Copied!';
    setTimeout(() => { el.textContent = original; }, 1200);
  });
}

// ===== Initialization =====

async function init() {
  cacheDom();
  loadDestination();

  // Detect platform and adapt UI (desktop warning, install instructions)
  const platform = detectPlatform();
  applyPlatformAdaptations(platform);
  initViewportResize();

  // Wire up destination controls
  dom.setDestBtn.addEventListener('click', onSetDestination);
  dom.destInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onSetDestination();
  });

  // After the keyboard finishes opening, nudge the input into view in case
  // the viewport resize alone didn't fully clear it.
  dom.destInput.addEventListener('focus', () => {
    setTimeout(() => {
      dom.destInput.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 350);
  });

  // Start GPS — the browser will prompt for permission automatically
  startGps();

  // Start compass sensors.  On Android this succeeds immediately.
  // On iOS it may fail because requestPermission() requires a user gesture;
  // in that case we surface a button the user can tap.
  //
  // Edge case: Chrome/Firefox on iOS use WebKit but may not expose
  // requestPermission(), so listeners attach successfully yet events never
  // fire because iOS still withholds sensor data.  A 3-second timeout
  // catches this and shows the permission button as a recovery path.
  const compassStarted = await startHeadingUpdates();

  const showPermissionButton = () => {
    dom.permissionBtn.classList.remove('hidden');
    dom.permissionBtn.addEventListener('click', async () => {
      const ok = await startHeadingUpdates();
      if (ok) dom.permissionBtn.classList.add('hidden');
    }, { once: true });
  };

  if (!compassStarted && typeof DeviceOrientationEvent.requestPermission === 'function') {
    showPermissionButton();
  } else if (compassStarted && platform.isIOS) {
    // Listeners attached but on iOS — events may be silently blocked.
    // If no heading arrives within 3s, surface the permission button.
    setTimeout(() => {
      if (headingSource === 'unavailable') showPermissionButton();
    }, 3000);
  }

  // Tap-to-copy on coordinate displays
  dom.currentCoords.addEventListener('click', () => copyCoords('position'));
  dom.destInfo.addEventListener('click', () => copyCoords('destination'));

  // Wire up cast-a-point gesture (3 upward swipes over compass area)
  const container = document.getElementById('compass-container');
  container.addEventListener('touchstart', onSwipeTouchStart);
  container.addEventListener('touchend',   onSwipeTouchEnd);

  // Wire up cast controls
  dom.castBtn.addEventListener('click', onCast);
  dom.castCancelBtn.addEventListener('click', onCastCancel);

  // Wire up help panel
  dom.helpBtn.addEventListener('click', showHelpPanel);
  dom.helpPanel.querySelector('.panel-close').addEventListener('click', hideHelpPanel);
  dom.helpPanel.querySelector('.panel-backdrop').addEventListener('click', hideHelpPanel);

  // Wire up achievement panel
  dom.achievementBtn.addEventListener('click', showAchievementPanel);
  dom.achievementPanel.querySelector('.panel-close').addEventListener('click', hideAchievementPanel);
  dom.achievementPanel.querySelector('.panel-backdrop').addEventListener('click', hideAchievementPanel);
  dom.achievementPanel.querySelector('.export-btn').addEventListener('click', exportAchievements);
  dom.achievementPanel.querySelector('.import-toggle').addEventListener('click', () => {
    const area = dom.achievementPanel.querySelector('.import-area');
    area.classList.toggle('hidden');
  });
  dom.achievementPanel.querySelector('.import-btn').addEventListener('click', () => {
    const input = dom.achievementPanel.querySelector('.import-input');
    const ok = importAchievements(input.value.trim());
    if (ok) {
      input.value = '';
    } else {
      input.style.borderColor = '#e94560';
      setTimeout(() => { input.style.borderColor = ''; }, 1500);
    }
  });
  updateAchievementButton();

  // Wire up tutorial panel
  dom.tutorialNext.addEventListener('click', onTutorialNext);
  dom.tutorialSkip.addEventListener('click', hideTutorial);
  dom.tutorialPanel.querySelector('.panel-close').addEventListener('click', hideTutorial);
  dom.tutorialPanel.querySelector('.panel-backdrop').addEventListener('click', hideTutorial);

  // "Show welcome tutorial" link in help panel
  dom.replayTutorial.addEventListener('click', (e) => {
    e.preventDefault();
    hideHelpPanel();
    showTutorial(platform);
  });

  // Show tutorial on first launch
  if (shouldShowTutorial()) {
    showTutorial(platform);
  }

  // Kick off the render loop
  requestAnimationFrame(render);
}

/**
 * Shows a brief error state on the destination input.
 * If a message is provided, it is displayed in the dest-info element.
 */
function showDestinationError(message) {
  dom.destInput.style.borderColor = '#e94560';
  setTimeout(() => { dom.destInput.style.borderColor = ''; }, 2500);
  if (message) {
    dom.destInfo.textContent = message;
    dom.destInfo.classList.remove('hidden');
    dom.destInfo.style.color = '#e94560';
    setTimeout(() => {
      dom.destInfo.style.color = '';
      if (dom.destInfo.textContent === message) dom.destInfo.classList.add('hidden');
    }, 5000);
  }
}

/**
 * Applies a resolved coordinate object as the destination.
 * @param {{ lat: number, lng: number, type: string }} parsed
 */
function applyParsedDestination(parsed) {
  let initialDistance = 0;
  if (state.position) {
    initialDistance = calculateDistance(
      state.position.lat, state.position.lng,
      parsed.lat, parsed.lng
    );
  }

  state.destination = {
    lat: parsed.lat, lng: parsed.lng,
    source: 'input', initialDistance,
  };
  state.arrivedAtCurrent = false;
  localStorage.setItem(DEST_STORAGE_KEY, JSON.stringify(state.destination));

  dom.destInfo.textContent =
    `Destination: ${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)} (${parsed.type})`;
  dom.destInfo.style.color = '';
  dom.destInfo.classList.remove('hidden');
}

/**
 * Handler for the "Set" button and Enter key in the destination input.
 */
async function onSetDestination() {
  const input = dom.destInput.value;
  if (!input.trim()) return;

  // --- Shortened / unresolvable map URLs (Google or Apple) ---
  const isShortGoogle = isShortGoogleMapsUrl(input);
  const isShortApple  = isShortAppleMapsUrl(input);
  if (isShortGoogle || isShortApple) {
    const service = isShortApple ? 'Apple Maps' : 'Google Maps';
    showDestinationError(
      'This ' + service + ' link doesn\u2019t contain coordinates. '
      + 'Open the link in your browser, copy the full URL from the address bar, and paste it here.'
    );
    return;
  }

  // --- Normal synchronous path ---
  const ok = setDestination(input);
  if (ok) {
    dom.destInput.value = '';
    dom.destInput.blur();
  } else {
    showDestinationError();
  }
}

document.addEventListener('DOMContentLoaded', init);
