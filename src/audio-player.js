/**
 * @file audio-player.js
 * @version 1.0.0
 *
 * Accessible audio player web component that exposes a compact UI for
 * controlling playback, scrubbing, and volume without relying on the browser's
 * default controls. The component embraces progressive enhancement: pass a
 * `src` attribute or call the `src` property, and decorate the surface with
 * slots for artwork and metadata.
 */

(() => {
  if (customElements.get('wc-audio-player')) {
    return;
  }

  /**
   * Upgrade properties that may have been set on an instance before the class
   * definition was registered.
   *
   * @param {HTMLElement & Record<string, unknown>} element
   * @param {string} property
   */
  const upgradeProperty = (element, property) => {
    if (Object.prototype.hasOwnProperty.call(element, property)) {
      const value = element[property];
      delete element[property];
      element[property] = value;
    }
  };

  /**
   * Format time values in seconds as `m:ss` strings.
   *
   * @param {number} seconds
   * @returns {string}
   */
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }

    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60);
    const remainder = String(wholeSeconds % 60).padStart(2, '0');
    return `${minutes}:${remainder}`;
  };


  /**
   * Custom audio player element with keyboard-friendly controls.
   */
  class WcAudioPlayer extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'preload', 'autoplay', 'loop', 'track-title', 'track-subtitle'];
    }

    /** @type {ShadowRoot} */
    #root;
    /** @type {HTMLAudioElement} */
    #audio;
    /** @type {HTMLButtonElement} */
    #playButton;
    /** @type {HTMLButtonElement} */
    #muteButton;
    /** @type {HTMLInputElement} */
    #progressInput;
    /** @type {HTMLSpanElement} */
    #currentTimeEl;
    /** @type {HTMLSpanElement} */
    #durationEl;
    /** @type {HTMLDivElement} */
    #container;
    /** @type {HTMLSpanElement} */
    #titleFallback;
    /** @type {HTMLSpanElement} */
    #subtitleFallback;
    /** @type {HTMLSlotElement} */
    #titleSlot;
    /** @type {HTMLSlotElement} */
    #artworkSlot;
    /** @type {boolean} */
    #isPointerScrubbing = false;
    /** @type {boolean} */
    #isKeyboardScrubbing = false;

    constructor() {
      super();
      this.#root = this.attachShadow({ mode: 'open' });
      this.#root.innerHTML = `
        <style>
          :host {
            --wc-audio-player-background: rgba(15, 23, 42, 0.75);
            --wc-audio-player-foreground: #f8fafc;
            --wc-audio-player-accent: #38bdf8;
            --wc-audio-player-muted: rgba(241, 245, 249, 0.7);
            --wc-audio-player-radius: 1.25rem;
            --wc-audio-player-gap: 1.1rem;
            --wc-audio-player-track-height: 0.4rem;
            --wc-audio-player-progress-color: #38bdf8;
            --wc-audio-player-progress-background: rgba(148, 163, 184, 0.35);
            display: inline-flex;
            inline-size: 100%;
            max-inline-size: 34rem;
            color: var(--wc-audio-player-foreground);
          }

          :host([hidden]) {
            display: none !important;
          }

          .player {
            position: relative;
            display: grid;
            grid-template-columns: auto 1fr;
            gap: var(--wc-audio-player-gap);
            inline-size: 100%;
            padding: 1.25rem;
            border-radius: var(--wc-audio-player-radius);
            background: var(--wc-audio-player-background);
            box-shadow: 0 32px 64px -36px rgba(15, 23, 42, 0.45);
            align-items: center;
          }

          :host(:not([data-has-artwork])) .artwork {
            display: none;
          }

          .artwork {
            inline-size: 5.5rem;
            block-size: 5.5rem;
            border-radius: calc(var(--wc-audio-player-radius) * 0.6);
            overflow: hidden;
            background: rgba(15, 23, 42, 0.5);
            box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
          }

          .artwork ::slotted(img),
          .artwork ::slotted(video) {
            inline-size: 100%;
            block-size: 100%;
            object-fit: cover;
            display: block;
          }

          .body {
            display: grid;
            gap: 0.9rem;
          }

          .meta {
            display: grid;
            gap: 0.35rem;
          }

          .title {
            font-size: 1.15rem;
            font-weight: 600;
            line-height: 1.3;
            color: var(--wc-audio-player-foreground);
          }

          .subtitle {
            font-size: 0.9rem;
            color: var(--wc-audio-player-muted);
          }

          .controls {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: var(--wc-audio-player-gap);
          }

          button {
            appearance: none;
            border: none;
            padding: 0;
            margin: 0;
            inline-size: 3rem;
            block-size: 3rem;
            border-radius: 999px;
            background: rgba(15, 23, 42, 0.3);
            color: inherit;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 150ms ease, transform 150ms ease;
          }

          button:focus-visible {
            outline: 3px solid rgba(56, 189, 248, 0.6);
            outline-offset: 3px;
          }

          button:hover {
            background: rgba(15, 23, 42, 0.45);
          }

          .play {
            inline-size: 3.4rem;
            block-size: 3.4rem;
            background: linear-gradient(135deg, var(--wc-audio-player-accent), #2563eb);
            color: #0f172a;
          }

          .play:hover {
            transform: translateY(-2px);
          }

          .play svg {
            inline-size: 1.35rem;
            block-size: 1.35rem;
          }

          .mute svg {
            inline-size: 1.1rem;
            block-size: 1.1rem;
          }

          .progress-group {
            display: grid;
            gap: 0.5rem;
          }

          input[type="range"] {
            appearance: none;
            inline-size: 100%;
            background: transparent;
            cursor: pointer;
            block-size: var(--wc-audio-player-track-height);
          }

          input[type="range"]:focus-visible {
            outline: none;
          }

          input[type="range"]::-webkit-slider-runnable-track {
            block-size: var(--wc-audio-player-track-height);
            border-radius: 999px;
            background: var(--wc-audio-player-progress-background);
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            inline-size: 0.95rem;
            block-size: 0.95rem;
            border-radius: 999px;
            background: var(--wc-audio-player-progress-color);
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.25);
            margin-top: calc((var(--wc-audio-player-track-height) - 0.95rem) / 2);
          }

          input[type="range"]::-moz-range-track {
            block-size: var(--wc-audio-player-track-height);
            border-radius: 999px;
            background: var(--wc-audio-player-progress-background);
          }

          input[type="range"]::-moz-range-thumb {
            inline-size: 0.95rem;
            block-size: 0.95rem;
            border-radius: 999px;
            background: var(--wc-audio-player-progress-color);
            border: none;
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.25);
          }

          input[type="range"]:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }

          .time {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--wc-audio-player-muted);
            font-variant-numeric: tabular-nums;
          }

          .icon {
            display: grid;
          }

          .icon[data-state="pause"] {
            display: none;
          }

          :host([data-playing]) .icon[data-state="play"] {
            display: none;
          }

          :host([data-playing]) .icon[data-state="pause"] {
            display: grid;
          }

          .mute .icon[data-state="muted"] {
            display: none;
          }

          :host([data-muted]) .mute .icon[data-state="muted"] {
            display: grid;
          }

          :host([data-muted]) .mute .icon[data-state="unmuted"] {
            display: none;
          }

          audio {
            display: none;
          }

          @media (max-width: 640px) {
            .player {
              grid-template-columns: 1fr;
            }

            :host([data-has-artwork]) .artwork {
              inline-size: 100%;
              block-size: auto;
              aspect-ratio: 1 / 1;
            }

            .controls {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }

            .play,
            .mute {
              inline-size: 100%;
              block-size: 3.25rem;
            }

            .play {
              justify-self: stretch;
            }

            .controls {
              justify-items: stretch;
            }

            .controls button {
              inline-size: 100%;
            }

            .controls {
              grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
            }
          }
        </style>
        <div class="player" part="container">
          <div class="artwork" part="artwork" data-artwork>
            <slot name="artwork"></slot>
          </div>
          <div class="body">
            <div class="meta">
              <slot name="title" class="title" part="title">
                <span class="title" part="title" data-title-fallback>Now playing</span>
              </slot>
              <slot name="subtitle" class="subtitle" part="subtitle">
                <span class="subtitle" part="subtitle" data-subtitle-fallback>Use the controls to listen.</span>
              </slot>
            </div>
            <div class="controls">
              <button class="play" part="play-button" type="button" aria-label="Play">
                <span class="icon" data-state="play" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 5.14a1 1 0 0 1 1.53-.85l9.2 6.08a1 1 0 0 1 0 1.66l-9.2 6.08A1 1 0 0 1 8 17.26z" fill="currentColor"></path>
                  </svg>
                </span>
                <span class="icon" data-state="pause" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 6.75a.75.75 0 0 1 .75-.75H11A.75.75 0 0 1 11.75 6.75v10.5A.75.75 0 0 1 11 18h-1.25a.75.75 0 0 1-.75-.75zM13 6.75A.75.75 0 0 1 13.75 6H15a.75.75 0 0 1 .75.75v10.5A.75.75 0 0 1 15 18h-1.25a.75.75 0 0 1-.75-.75z" fill="currentColor"></path>
                  </svg>
                </span>
              </button>
              <div class="progress-group" part="progress-group">
                <input
                  part="progress"
                  type="range"
                  min="0"
                  max="0"
                  step="0.1"
                  value="0"
                  aria-label="Seek"
                  disabled
                />
                <div class="time" part="time">
                  <span part="current-time" data-current>0:00</span>
                  <span part="duration" data-duration>-:--</span>
                </div>
              </div>
              <button class="mute" part="mute-button" type="button" aria-label="Mute">
                <span class="icon" data-state="unmuted" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5.75 9.5a.75.75 0 0 1 .75-.75h2.19l3.4-2.72A.75.75 0 0 1 13.5 6.56v10.88a.75.75 0 0 1-1.21.58l-3.6-2.88H6.5a.75.75 0 0 1-.75-.75z" fill="currentColor"></path>
                    <path d="M15.75 8a3.75 3.75 0 0 1 0 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  </svg>
                </span>
                <span class="icon" data-state="muted" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5.75 9.5a.75.75 0 0 1 .75-.75h2.19l3.4-2.72A.75.75 0 0 1 13.5 6.56v10.88a.75.75 0 0 1-1.21.58l-3.6-2.88H6.5a.75.75 0 0 1-.75-.75z" fill="currentColor"></path>
                    <path d="m16.5 9.5 3 3m0 0 3-3m-3 3 3 3m-3-3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                  </svg>
                </span>
              </button>
            </div>
          </div>
          <audio part="media" preload="metadata"></audio>
        </div>
      `;

      this.#container = this.#root.querySelector('.player');
      this.#audio = this.#root.querySelector('audio');
      this.#playButton = this.#root.querySelector('.play');
      this.#muteButton = this.#root.querySelector('.mute');
      this.#progressInput = this.#root.querySelector('input[type="range"]');
      this.#currentTimeEl = this.#root.querySelector('[data-current]');
      this.#durationEl = this.#root.querySelector('[data-duration]');
      this.#titleFallback = this.#root.querySelector('[data-title-fallback]');
      this.#subtitleFallback = this.#root.querySelector('[data-subtitle-fallback]');
      this.#titleSlot = this.#root.querySelector('slot[name="title"]');
      this.#artworkSlot = this.#root.querySelector('slot[name="artwork"]');

      this.#titleSlot?.addEventListener('slotchange', this.#syncTrackTitle);
      const subtitleSlot = this.#root.querySelector('slot[name="subtitle"]');
      subtitleSlot?.addEventListener('slotchange', this.#syncTrackSubtitle);

      this.#artworkSlot.addEventListener('slotchange', this.#syncArtworkPresence);
      this.#syncArtworkPresence();

      this.#playButton.addEventListener('click', this.#togglePlay);
      this.#muteButton.addEventListener('click', this.#toggleMute);
      this.#progressInput.addEventListener('input', this.#handleScrubInput);
      this.#progressInput.addEventListener('change', this.#handleScrubChange);
      this.#progressInput.addEventListener('pointerdown', () => {
        this.#isPointerScrubbing = true;
      });
      this.#progressInput.addEventListener('pointerup', () => {
        this.#isPointerScrubbing = false;
      });
      this.#progressInput.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
          this.#isKeyboardScrubbing = true;
        }
      });
      this.#progressInput.addEventListener('keyup', () => {
        this.#isKeyboardScrubbing = false;
      });

      this.#audio.addEventListener('loadedmetadata', this.#syncMetadata);
      this.#audio.addEventListener('timeupdate', this.#syncTime);
      this.#audio.addEventListener('play', this.#handlePlay);
      this.#audio.addEventListener('pause', this.#handlePause);
      this.#audio.addEventListener('ended', this.#handleEnded);
      this.#audio.addEventListener('volumechange', this.#handleVolumeChange);

      this.setAttribute('role', 'group');
    }

    connectedCallback() {
      upgradeProperty(this, 'src');
      upgradeProperty(this, 'preload');
      upgradeProperty(this, 'autoplay');
      upgradeProperty(this, 'loop');
      upgradeProperty(this, 'trackTitle');
      upgradeProperty(this, 'trackSubtitle');

      if (!this.hasAttribute('preload')) {
        this.preload = 'metadata';
      }

      if (this.hasAttribute('src')) {
        this.#audio.src = this.getAttribute('src') ?? '';
      }

      this.#syncMetadata();
      this.#syncTime();
      this.#handleVolumeChange();
      this.#syncTrackTitle();
      this.#syncTrackSubtitle();
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
      switch (name) {
        case 'src': {
          if (this.#audio.src !== newValue) {
            this.#audio.src = newValue ?? '';
            this.#audio.load();
          }
          break;
        }
        case 'preload': {
          if (newValue == null) {
            this.#audio.removeAttribute('preload');
          } else {
            this.#audio.preload = newValue;
          }
          break;
        }
        case 'autoplay': {
          this.#audio.autoplay = newValue !== null;
          break;
        }
        case 'loop': {
          this.#audio.loop = newValue !== null;
          break;
        }
        case 'track-title': {
          this.#syncTrackTitle();
          break;
        }
        case 'track-subtitle': {
          this.#syncTrackSubtitle();
          break;
        }
        default:
          break;
      }
    }

    /**
     * The audio source URL.
     */
    get src() {
      return this.getAttribute('src') ?? '';
    }

    set src(value) {
      if (value == null) {
        this.removeAttribute('src');
      } else {
        this.setAttribute('src', value);
      }
    }

    /**
     * The preload strategy forwarded to the underlying `<audio>` element.
     */
    get preload() {
      return this.getAttribute('preload') ?? 'metadata';
    }

    set preload(value) {
      if (value == null) {
        this.removeAttribute('preload');
      } else {
        this.setAttribute('preload', value);
      }
    }

    /**
     * Whether the audio should autoplay on load.
     */
    get autoplay() {
      return this.hasAttribute('autoplay');
    }

    set autoplay(value) {
      if (value) {
        this.setAttribute('autoplay', '');
      } else {
        this.removeAttribute('autoplay');
      }
    }

    /**
     * Whether playback should loop.
     */
    get loop() {
      return this.hasAttribute('loop');
    }

    set loop(value) {
      if (value) {
        this.setAttribute('loop', '');
      } else {
        this.removeAttribute('loop');
      }
    }

    /**
     * Fallback track title used when no `slot="title"` is provided.
     */
    get trackTitle() {
      return this.getAttribute('track-title') ?? this.#titleFallback?.textContent ?? 'Now playing';
    }

    set trackTitle(value) {
      if (value == null) {
        this.removeAttribute('track-title');
      } else {
        this.setAttribute('track-title', value);
      }
    }

    /**
     * Fallback subtitle when the subtitle slot is empty.
     */
    get trackSubtitle() {
      return this.getAttribute('track-subtitle') ?? this.#subtitleFallback?.textContent ?? 'Use the controls to listen.';
    }

    set trackSubtitle(value) {
      if (value == null) {
        this.removeAttribute('track-subtitle');
      } else {
        this.setAttribute('track-subtitle', value);
      }
    }

    /**
     * Sync the visible duration and enable scrubbing when metadata arrives.
     */
    #syncMetadata = () => {
      const duration = this.#audio.duration;
      if (Number.isFinite(duration) && duration > 0) {
        this.#durationEl.textContent = formatTime(duration);
        this.#progressInput.max = String(duration);
        this.#progressInput.disabled = false;
        this.#syncTime();
      } else {
        this.#durationEl.textContent = '-:--';
        this.#progressInput.max = '0';
        this.#progressInput.value = '0';
        this.#progressInput.disabled = true;
      }
    };

    /**
     * Update the time labels and range input as playback progresses.
     */
    #syncTime = () => {
      if (!this.#isPointerScrubbing && !this.#isKeyboardScrubbing) {
        const current = this.#audio.currentTime;
        this.#progressInput.value = Number.isFinite(current) ? String(current) : '0';
      }
      this.#currentTimeEl.textContent = formatTime(this.#audio.currentTime);
    };

    /**
     * Toggle play/pause state.
     */
    #togglePlay = async () => {
      if (this.#audio.paused) {
        try {
          await this.#audio.play();
        } catch (error) {
          this.dispatchEvent(
            new CustomEvent('audio-play-error', {
              detail: { error },
            })
          );
        }
      } else {
        this.#audio.pause();
      }
    };

    /**
     * Toggle mute state.
     */
    #toggleMute = () => {
      this.#audio.muted = !this.#audio.muted;
    };

    /**
     * Handle scrubbing while the user drags the range input.
     */
    #handleScrubInput = () => {
      const value = Number.parseFloat(this.#progressInput.value);
      if (Number.isFinite(value)) {
        this.#currentTimeEl.textContent = formatTime(value);
        if (this.#isPointerScrubbing || this.#isKeyboardScrubbing) {
          this.dispatchEvent(
            new CustomEvent('audio-scrub', {
              detail: { time: value },
            })
          );
        }
      }
    };

    /**
     * Commit the scrub when the input value changes.
     */
    #handleScrubChange = () => {
      const value = Number.parseFloat(this.#progressInput.value);
      if (Number.isFinite(value)) {
        this.#audio.currentTime = value;
      }
      this.#isPointerScrubbing = false;
      this.#isKeyboardScrubbing = false;
    };

    /**
     * Reflect the playing state on the host for styling.
     */
    #handlePlay = () => {
      this.setAttribute('data-playing', '');
      this.#playButton.setAttribute('aria-label', 'Pause');
    };

    #handlePause = () => {
      this.removeAttribute('data-playing');
      this.#playButton.setAttribute('aria-label', 'Play');
    };

    #handleEnded = () => {
      this.#audio.currentTime = 0;
      this.#syncTime();
    };

    #handleVolumeChange = () => {
      if (this.#audio.muted || this.#audio.volume === 0) {
        this.setAttribute('data-muted', '');
        this.#muteButton.setAttribute('aria-label', 'Unmute');
      } else {
        this.removeAttribute('data-muted');
        this.#muteButton.setAttribute('aria-label', 'Mute');
      }
    };

    #syncArtworkPresence = () => {
      const hasArtwork = this.#artworkSlot.assignedElements({ flatten: true }).length > 0;
      if (hasArtwork) {
        this.setAttribute('data-has-artwork', '');
      } else {
        this.removeAttribute('data-has-artwork');
      }
    };

    #syncTrackTitle = () => {
      const fallback = this.getAttribute('track-title') ?? 'Now playing';
      if (this.#titleFallback) {
        this.#titleFallback.textContent = fallback;
      }
      const hasAssignedTitle = this.#titleSlot
        ?.assignedNodes({ flatten: true })
        .some((node) => (node.textContent ?? '').trim().length > 0);
      if (hasAssignedTitle) {
        this.#container.removeAttribute('aria-label');
      } else {
        this.#container.setAttribute('aria-label', fallback);
      }
    };

    #syncTrackSubtitle = () => {
      if (this.#subtitleFallback) {
        this.#subtitleFallback.textContent = this.getAttribute('track-subtitle') ?? 'Use the controls to listen.';
      }
    };

    /**
     * Begin playback. Mirrors the underlying `<audio>` API.
     *
     * @returns {Promise<void>}
     */
    play() {
      return this.#audio.play();
    }

    /** Pause playback. */
    pause() {
      this.#audio.pause();
    }

    /**
     * Current playback position in seconds.
     */
    get currentTime() {
      return this.#audio.currentTime;
    }

    set currentTime(value) {
      this.#audio.currentTime = value;
    }

    /**
     * The audio duration if known.
     */
    get duration() {
      return this.#audio.duration;
    }

    /** Whether the audio is currently paused. */
    get paused() {
      return this.#audio.paused;
    }
  }

  customElements.define('wc-audio-player', WcAudioPlayer);
})();
