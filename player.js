/**
 * @fileoverview VideoPlayer API - A robust, responsive, and customizable Vanilla JS Video Player.
 * @version 1.0.0
 * @author JPROJECT-1
 * @license MIT
 *
 * Features:
 * - Multi-quality playback with "Auto" resolution mapping.
 * - Precision scrubbing and timeline dragging.
 * - Live video preview on timeline hover.
 * - LRC-formatted synced subtitle engine.
 * - Dynamic and responsive UI scaling down to mobile resolutions.
 * - Customizable progress bar colors (supports Hex, RGB, names, and CSS Gradients).
 * - Comprehensive error handling for DOM and Playback API edge cases.
 */

class VideoPlayer {
  /**
   * Constructs a new VideoPlayer instance.
   *
   * @param {Object} config - The configuration object for the player.
   * @param {string} config.container - CSS selector for the DOM element where the player will be mounted.
   * @param {string} [config.title=""] - Video title displayed on the top gradient header.
   * @param {Object} config.src - Key-value pair of available resolutions and their source URLs (e.g., {"720p": "url"}).
   * @param {string} [config.cover=""] - URL for the video's poster/thumbnail image.
   * @param {string|boolean} [config.logo=false] - URL for the watermark logo, or false to omit.
   * @param {Object|boolean} [config.subtitle=false] - Subtitle mapping using LRC format ([mm:ss.ms] text).
   * @param {string|boolean} [config.defaultSubtitle=false] - The default active language key for subtitles.
   * @param {string} [config.width="100%"] - CSS width attribute for the player wrapper.
   * @param {string} [config.height="auto"] - CSS height attribute for the player wrapper.
   * @param {boolean} [config.autoplay=false] - Determines if the video plays automatically on load.
   * @param {boolean} [config.muted=false] - Determines if the video starts muted.
   * @param {boolean} [config.loop=false] - Determines if the video loops upon completion.
   * @param {boolean} [config.controls=true] - Toggles visibility of the bottom control bar.
   * @param {string} [config.progressColor="#ff0000"] - CSS background value for the timeline progress (hex, rgb, or gradient).
   * @param {Object} [config.settings] - Determines which modules to display in the gear icon settings menu.
   */
  constructor(config) {
    this.config = Object.assign(
      {
        container: "#player-root",
        title: "",
        src: {},
        cover: "",
        logo: false,
        subtitle: false,
        defaultSubtitle: false,
        width: "100%",
        height: "auto",
        autoplay: false,
        muted: false,
        loop: false,
        controls: true,
        progressColor: "#ff0000", // Default is YouTube Red
        settings: { quality: true, speed: true, loop: true, subtitle: false },
      },
      config,
    );

    this.container = document.querySelector(this.config.container);
    if (!this.container)
      throw new Error(
        "VideoPlayer Error: Container element not found in the DOM.",
      );

    this.qualityKeys = Object.keys(this.config.src);
    if (this.qualityKeys.length === 0)
      throw new Error(
        "VideoPlayer Error: Source (src) object cannot be empty.",
      );

    // Internal States
    this.isPlaying = false;
    this.isScrubbing = false;
    this.hideTimer = null;
    this.currentSpeed = 1;
    this.currentQualityKey = "Auto";
    this.activeSubtitleLang = this.config.defaultSubtitle;
    this.parsedSubtitles = {};
    this.wasPlayingBeforeScrub = false;

    this.init();
  }

  /**
   * Bootstraps the player by injecting CSS, building the DOM, caching elements, and binding events.
   * @private
   */
  init() {
    this.injectCSS();
    this.buildUI();
    this.cacheDOM();
    this.parseSubtitles();
    this.applyInitialSettings();
    this.bindEvents();
    this.loadSource(this.currentQualityKey);
  }

  /**
   * Injects the isolated component CSS into the document's head.
   * Prevents global style pollution and ensures the player looks correct across environments.
   * @private
   */
  injectCSS() {
    if (document.getElementById("vp-styles")) return;
    const style = document.createElement("style");
    style.id = "vp-styles";
    style.innerHTML = `
            .vp-wrapper { position: relative; width: ${this.config.width}; height: ${this.config.height}; background: #000; overflow: hidden; font-family: 'Roboto', sans-serif; user-select: none; display: flex; aspect-ratio: 16/9; border-radius: 12px; }
            .vp-video { width: 100%; height: 100%; object-fit: contain; cursor: pointer; }
            
            /* UI Transition Layers */
            .vp-ui { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; pointer-events: none; overflow: hidden; }
            .vp-header-container, .vp-controls-wrapper { opacity: 0; transition: opacity 0.4s ease, transform 0.4s ease; pointer-events: auto; }
            .vp-header-container { padding: 20px; background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%); transform: translateY(-10px); }
            .vp-controls-wrapper { background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%); padding: 0 15px 15px; transform: translateY(10px); }
            .vp-wrapper.active .vp-header-container, .vp-wrapper.active .vp-controls-wrapper { opacity: 1; transform: translateY(0); }
            
            .vp-header { color: #fff; font-size: clamp(14px, 3vw, 18px); font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            
            /* Floating Logo */
            .vp-logo-container { position: absolute; right: 15px; bottom: 15px; z-index: 10; pointer-events: auto; opacity: 0.55; transition: bottom 0.4s ease, opacity 0.3s ease; }
            .vp-logo-container:hover { opacity: 0.85; }
            .vp-logo { max-height: 30px; max-width: 80px; object-fit: contain; }
            .vp-wrapper.active .vp-logo-container { bottom: 85px; }

            /* Dynamic Subtitle Display */
            .vp-subtitle-display { position: absolute; bottom: 25px; width: 90%; max-width: 600px; left: 50%; transform: translateX(-50%); text-align: center; color: #fff; font-size: clamp(14px, 3.5vw, 20px); text-shadow: 0px 0px 4px rgba(0,0,0,0.9); pointer-events: none; z-index: 5; transition: bottom 0.4s ease; }
            .vp-subtitle-text { background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 4px; display: inline-block; font-weight: 500; }
            .vp-wrapper.active .vp-subtitle-display { bottom: 95px; } 

            .vp-controls-hidden { display: none !important; }
            
            /* Timeline & Scrubbing Area */
            .vp-progress-area { position: relative; width: 100%; padding-bottom: 12px; cursor: pointer; }
            .vp-preview-tooltip { position: absolute; bottom: 25px; left: 0; transform: translateX(-50%); opacity: 0; pointer-events: none; display: flex; flex-direction: column; align-items: center; transition: opacity 0.2s; z-index: 15; }
            .vp-progress-area:hover .vp-preview-tooltip { opacity: 1; }
            .vp-preview-video { width: 140px; height: 78px; background: #000; border: 2px solid #fff; border-radius: 6px; object-fit: contain; box-shadow: 0 4px 10px rgba(0,0,0,0.7); }
            .vp-preview-time-txt { background: rgba(0,0,0,0.8); color: #fff; font-size: 12px; padding: 3px 6px; border-radius: 4px; margin-top: 5px; }
            
            .vp-progress { width: 100%; height: 4px; background: rgba(255,255,255,0.3); position: relative; display: flex; align-items: flex-end; border-radius: 2px; transition: height 0.1s; }
            .vp-progress-area:hover .vp-progress { height: 6px; }
            
            /* Progress Customization Injection */
            .vp-progress-filled { height: 100%; background: ${this.config.progressColor}; position: absolute; top: 0; left: 0; pointer-events: none; border-radius: 2px; }
            .vp-progress-filled::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%) scale(1); width: 12px; height: 12px; border-radius: 50%; background: ${this.config.progressColor}; box-shadow: 0 0 4px rgba(0,0,0,0.6); transition: transform 0.1s; }
            .vp-progress-area:hover .vp-progress-filled::after { transform: translateY(-50%) scale(1.3); }

            /* Action Buttons */
            .vp-controls { display: flex; justify-content: space-between; align-items: center; color: #fff; gap: 8px; }
            .vp-left, .vp-right { display: flex; align-items: center; gap: 6px; }
            
            .vp-btn, .vp-time, .vp-volume-container {
                background: rgba(0, 0, 0, 0.6);
                border: none; color: #fff; font-size: clamp(12px, 2vw, 14px); 
                padding: 8px 12px; border-radius: 6px;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: background 0.2s, transform 0.1s; backdrop-filter: blur(4px);
            }
            .vp-btn:hover, .vp-volume-container:hover { background: rgba(40, 40, 40, 0.9); }
            .vp-time { cursor: default; }
            
            /* Interactive Volume Control */
            .vp-volume-container { padding: 0 4px; }
            .vp-volume-btn { background: none; border: none; color: #fff; padding: 8px; font-size: clamp(12px, 2vw, 14px); cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .vp-volume-slider { width: 0; opacity: 0; transition: width 0.3s ease, opacity 0.3s ease; -webkit-appearance: none; height: 4px; border-radius: 2px; margin-right: 4px; cursor: pointer; outline: none; background: rgba(255,255,255,0.3); }
            .vp-volume-container:hover .vp-volume-slider, .vp-volume-slider:active { width: 60px; opacity: 1; margin-left: 4px; margin-right: 8px; }
            .vp-volume-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #fff; border-radius: 50%; cursor: pointer; }
            
            /* Responsive Settings Panel */
            .vp-settings-panel { position: absolute; bottom: 70px; right: 15px; background: rgba(18,18,18,0.95); border-radius: 10px; color: #eee; display: none; flex-direction: column; padding: 6px 0; font-size: 13px; backdrop-filter: blur(10px); box-shadow: 0 8px 25px rgba(0,0,0,0.8); z-index: 20; width: 240px; max-width: calc(100% - 30px); max-height: calc(100% - 90px); overflow-y: auto; pointer-events: auto; }
            .vp-settings-panel::-webkit-scrollbar { width: 4px; }
            .vp-settings-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
            .vp-settings-panel.open { display: flex; }
            .vp-setting-item { padding: 12px 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
            .vp-setting-item:hover { background: rgba(255,255,255,0.1); }
            .vp-setting-header { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 8px; }

            /* Mobile Specific Queries (< 400px) */
            @media (max-width: 400px) {
                /* Hide secondary elements to save space, but keep FULLSCREEN */
                .vp-time, .vp-volume-slider, .vp-cc, .vp-settings-btn { display: none !important; }
                .vp-volume-container { background: transparent; padding: 0; }
                .vp-volume-container:hover { background: transparent; }
                .vp-btn, .vp-volume-btn { background: rgba(0,0,0,0.6); padding: 8px 12px; }
                .vp-controls-wrapper { padding: 0 10px 10px; }
                .vp-wrapper.active .vp-logo-container { bottom: 65px; }
                .vp-wrapper.active .vp-subtitle-display { bottom: 75px; }
                .vp-logo { max-width: 50px; }
                .vp-preview-video { width: 100px; height: 56px; }
            }
        `;
    document.head.appendChild(style);
  }

  /**
   * Constructs and injects the HTML layout into the configured root container.
   * @private
   */
  buildUI() {
    this.container.innerHTML = `
            <div class="vp-wrapper active">
                <video class="vp-video" poster="${this.config.cover}" playsinline></video>
                
                ${this.config.logo ? `<div class="vp-logo-container"><img class="vp-logo" src="${this.config.logo}" alt="Logo"></div>` : ""}
                
                <div class="vp-ui">
                    <div class="vp-header-container">
                        <div class="vp-header">${this.config.title}</div>
                    </div>
                    
                    <div class="vp-subtitle-display"><span class="vp-subtitle-text" style="display:none;"></span></div>
                    
                    <div class="vp-settings-panel"></div>

                    <div class="vp-controls-wrapper ${!this.config.controls ? "vp-controls-hidden" : ""}">
                        <div class="vp-progress-area">
                            <div class="vp-preview-tooltip">
                                <video class="vp-preview-video" muted preload="metadata" playsinline></video>
                                <span class="vp-preview-time-txt">0:00</span>
                            </div>
                            <div class="vp-progress"><div class="vp-progress-filled"></div></div>
                        </div>

                        <div class="vp-controls">
                            <div class="vp-left">
                                <button class="vp-btn vp-play"><i class="fas fa-play"></i></button>
                                <div class="vp-volume-container">
                                    <button class="vp-volume-btn vp-mute"><i class="fas fa-volume-high"></i></button>
                                    <input type="range" class="vp-volume-slider" min="0" max="1" step="0.01" value="1">
                                </div>
                                <div class="vp-time"><span class="vp-current">0:00</span>&nbsp;/&nbsp;<span class="vp-duration">0:00</span></div>
                            </div>
                            <div class="vp-right">
                                ${this.config.settings.subtitle ? `<button class="vp-btn vp-cc"><i class="fa-regular fa-closed-captioning"></i></button>` : ""}
                                <button class="vp-btn vp-settings-btn"><i class="fas fa-gear"></i></button>
                                <button class="vp-btn vp-fullscreen"><i class="fas fa-expand"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Scans the constructed UI and caches DOM elements into class properties for rapid access.
   * @private
   */
  cacheDOM() {
    this.wrapper = this.container.querySelector(".vp-wrapper");
    this.video = this.container.querySelector(".vp-video");
    this.playBtn = this.container.querySelector(".vp-play");
    this.muteBtn = this.container.querySelector(".vp-mute");
    this.volumeSlider = this.container.querySelector(".vp-volume-slider");
    this.timeCurrent = this.container.querySelector(".vp-current");
    this.timeDuration = this.container.querySelector(".vp-duration");
    this.progressArea = this.container.querySelector(".vp-progress-area");
    this.progressFilled = this.container.querySelector(".vp-progress-filled");
    this.previewTooltip = this.container.querySelector(".vp-preview-tooltip");
    this.previewVideo = this.container.querySelector(".vp-preview-video");
    this.previewTimeTxt = this.container.querySelector(".vp-preview-time-txt");
    this.fullscreenBtn = this.container.querySelector(".vp-fullscreen");
    this.settingsBtn = this.container.querySelector(".vp-settings-btn");
    this.settingsPanel = this.container.querySelector(".vp-settings-panel");
    this.ccBtn = this.container.querySelector(".vp-cc");
    this.subtitleDisplay = this.container.querySelector(".vp-subtitle-text");
  }

  /**
   * Propagates config parameters (autoplay, muted, loop) into the HTMLMediaElement natively.
   * @private
   */
  applyInitialSettings() {
    this.video.autoplay = this.config.autoplay;
    this.video.muted = this.config.muted;
    this.video.loop = this.config.loop;
    if (this.config.muted) {
      this.volumeSlider.value = 0;
      this.updateVolumeUI();
    }
  }

  /**
   * Interprets the raw LRC string array into an internal object format mapped by timestamp.
   * @private
   */
  parseSubtitles() {
    if (!this.config.subtitle) return;
    for (const [lang, lines] of Object.entries(this.config.subtitle)) {
      this.parsedSubtitles[lang] = lines
        .map((line) => {
          const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)/);
          if (match) {
            const time =
              parseInt(match[1]) * 60 +
              parseInt(match[2]) +
              parseFloat("0." + match[3]);
            return { time, text: match[4] };
          }
          return null;
        })
        .filter((i) => i !== null);
    }
  }

  /**
   * Binds mouse and touch events to interface components and handles core HTMLMediaElement events.
   * @private
   */
  bindEvents() {
    // Core Media Events
    this.playBtn.addEventListener("click", () => this.togglePlay());
    this.video.addEventListener("click", () => this.togglePlay());
    this.video.addEventListener(
      "play",
      () => (this.playBtn.innerHTML = '<i class="fas fa-pause"></i>'),
    );
    this.video.addEventListener(
      "pause",
      () => (this.playBtn.innerHTML = '<i class="fas fa-play"></i>'),
    );
    this.video.addEventListener("timeupdate", () => this.updateTime());
    this.video.addEventListener("loadedmetadata", () => {
      this.timeDuration.textContent = this.formatTime(this.video.duration);
    });

    // Custom Timeline Interaction (Scrubbing)
    this.progressArea.addEventListener("mousedown", (e) => this.startScrub(e));
    document.addEventListener("mousemove", (e) => this.handleDragScrub(e));
    document.addEventListener("mouseup", () => this.stopScrub());

    // Touch support for scrubbing
    this.progressArea.addEventListener("touchstart", (e) =>
      this.startScrub(e.touches[0]),
    );
    document.addEventListener("touchmove", (e) => {
      if (this.isScrubbing) this.handleDragScrub(e.touches[0]);
    });
    document.addEventListener("touchend", () => this.stopScrub());

    // Timeline Preview
    this.progressArea.addEventListener("mousemove", (e) =>
      this.handleHoverPreview(e),
    );

    // Volume Interaction
    this.volumeSlider.addEventListener("input", (e) => {
      this.video.volume = e.target.value;
      this.video.muted = e.target.value === "0";
      this.updateVolumeUI();
    });
    this.muteBtn.addEventListener("click", () => {
      this.video.muted = !this.video.muted;
      if (!this.video.muted && this.video.volume === 0) this.video.volume = 1;
      this.volumeSlider.value = this.video.muted ? 0 : this.video.volume;
      this.updateVolumeUI();
    });

    // Autohide UI logic
    this.fullscreenBtn.addEventListener("click", () => this.toggleFullscreen());
    this.wrapper.addEventListener("mousemove", () => this.handleMouseMove());
    this.wrapper.addEventListener("mouseleave", () => {
      if (!this.settingsPanel.classList.contains("open")) {
        this.wrapper.classList.remove("active");
      }
    });

    // Control Menus
    this.settingsBtn.addEventListener("click", () => this.openMainMenu());
    if (this.ccBtn) {
      this.ccBtn.addEventListener("click", () => {
        const keys = Object.keys(this.parsedSubtitles);
        this.activeSubtitleLang = this.activeSubtitleLang ? false : keys[0];
        this.updateCCIcon();
        this.subtitleDisplay.style.display = "none";
      });
      this.updateCCIcon();
    }
  }

  /**
   * Halts video playback and prepares the player for scrubbing manipulation.
   * @param {MouseEvent|TouchEvent} e - The triggering event.
   * @private
   */
  startScrub(e) {
    this.isScrubbing = true;
    this.wasPlayingBeforeScrub = !this.video.paused;
    this.video.pause();
    this.updateScrubPosition(e);
  }

  /**
   * Computes dragging mechanics across the timeline element.
   * @param {MouseEvent|TouchEvent} e - The triggering event.
   * @private
   */
  handleDragScrub(e) {
    if (!this.isScrubbing) return;
    this.updateScrubPosition(e);
  }

  /**
   * Resolves scrubbing logic and attempts to resume playback if the video was playing previously.
   * Mitigates AbortError natively thrown by browser's Play Promise interruptions.
   * @private
   */
  stopScrub() {
    if (!this.isScrubbing) return;
    this.isScrubbing = false;
    if (this.wasPlayingBeforeScrub) {
      const playPromise = this.video.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    }
  }

  /**
   * Math helper to pinpoint cursor location and convert it into video duration percentages.
   * @param {MouseEvent|TouchEvent} e - The triggering cursor/touch event.
   * @private
   */
  updateScrubPosition(e) {
    const rect = this.progressArea.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    this.video.currentTime = percent * this.video.duration;
    this.progressFilled.style.width = `${percent * 100}%`;
  }

  /**
   * Renders the floating video preview box directly above the timeline on hover.
   * @param {MouseEvent} e - Mouse movement event across the timeline.
   * @private
   */
  handleHoverPreview(e) {
    if (!this.video.duration) return;
    const rect = this.progressArea.getBoundingClientRect();
    let percent = (e.clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));

    const previewTime = percent * this.video.duration;
    const tooltipWidth = 140;
    let leftPx = percent * rect.width;

    // Constrain boundaries
    if (leftPx < tooltipWidth / 2) leftPx = tooltipWidth / 2;
    if (leftPx > rect.width - tooltipWidth / 2)
      leftPx = rect.width - tooltipWidth / 2;

    this.previewTooltip.style.left = `${leftPx}px`;
    this.previewTimeTxt.textContent = this.formatTime(previewTime);

    // Debounce currentTime assignments on the hidden `<video>` to prevent decoding lag/404 spam.
    if (Math.abs(this.previewVideo.currentTime - previewTime) > 1.5) {
      this.previewVideo.currentTime = previewTime;
    }
  }

  /**
   * Updates graphical UI icons corresponding to the numeric volume state.
   * @private
   */
  updateVolumeUI() {
    if (this.video.muted || this.video.volume === 0) {
      this.muteBtn.innerHTML = '<i class="fas fa-volume-xmark"></i>';
    } else if (this.video.volume < 0.5) {
      this.muteBtn.innerHTML = '<i class="fas fa-volume-low"></i>';
    } else {
      this.muteBtn.innerHTML = '<i class="fas fa-volume-high"></i>';
    }
    const val = this.volumeSlider.value * 100;
    this.volumeSlider.style.background = `linear-gradient(to right, #fff ${val}%, rgba(255,255,255,0.3) ${val}%)`;
  }

  /**
   * Dynamically swaps closed-captioning icons depending on activation status.
   * @private
   */
  updateCCIcon() {
    if (this.activeSubtitleLang) {
      this.ccBtn.innerHTML = '<i class="fa-solid fa-closed-captioning"></i>';
    } else {
      this.ccBtn.innerHTML = '<i class="fa-regular fa-closed-captioning"></i>';
    }
  }

  /**
   * Seamlessly manages source switching (resolution changes) while maintaining the current playhead time.
   * Interprets 'Auto' setting by natively grabbing the highest available resolution defined in the source config.
   *
   * @param {string} qualityKey - The object key mapping to the video URL string (e.g., '1080p' or 'Auto').
   * @private
   */
  loadSource(qualityKey) {
    const currentTime = this.video.currentTime;
    const isPaused = this.video.paused;

    let targetSrc = "";
    // Handling Auto Resolution (Defaults to the highest quality object key)
    if (qualityKey === "Auto") {
      const highestQualityKey = this.qualityKeys[this.qualityKeys.length - 1];
      targetSrc = this.config.src[highestQualityKey];
    } else {
      targetSrc = this.config.src[qualityKey];
    }

    this.video.src = targetSrc;

    // Assign preview source and suppress potential 404 console errors natively
    this.previewVideo.src = targetSrc;
    this.previewVideo.onerror = () => {
      this.previewTooltip.style.display = "none";
    };

    this.video.playbackRate = this.currentSpeed;
    this.currentQualityKey = qualityKey;

    this.video.addEventListener(
      "loadedmetadata",
      () => {
        this.video.currentTime = currentTime;
        if (!isPaused || this.config.autoplay) {
          const playPromise = this.video.play();
          if (playPromise !== undefined) playPromise.catch(() => {});
        }
      },
      { once: true },
    );
  }

  /**
   * Handles universal play/pause trigger requests.
   * @private
   */
  togglePlay() {
    if (this.video.paused) {
      const playPromise = this.video.play();
      if (playPromise !== undefined) playPromise.catch(() => {});
    } else {
      this.video.pause();
    }
  }

  /**
   * Lifecycle method triggered continually on video playback.
   * Recalculates progress width strings and processes real-time active subtitles array.
   * @private
   */
  updateTime() {
    this.timeCurrent.textContent = this.formatTime(this.video.currentTime);
    const percent = (this.video.currentTime / this.video.duration) * 100;

    if (!this.isScrubbing) {
      this.progressFilled.style.width = `${percent}%`;
    }

    if (
      this.activeSubtitleLang &&
      this.parsedSubtitles[this.activeSubtitleLang]
    ) {
      const subs = this.parsedSubtitles[this.activeSubtitleLang];
      const currentSub = subs
        .filter((s) => s.time <= this.video.currentTime)
        .pop();

      // Subtitle lifespan expires after 5 seconds of idle time without a next sequence block
      if (currentSub && this.video.currentTime - currentSub.time < 5) {
        this.subtitleDisplay.style.display = "inline-block";
        this.subtitleDisplay.textContent = currentSub.text;
      } else {
        this.subtitleDisplay.style.display = "none";
      }
    }
  }

  /**
   * Converts raw seconds integer to a readable mm:ss format.
   * @param {number} sec - Native seconds value.
   * @returns {string} Formatted output text.
   * @private
   */
  formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  /**
   * Prompts the browser's native fullscreen API wrapper.
   * @private
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.wrapper.requestFullscreen().catch(() => {});
      this.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
    } else {
      document.exitFullscreen();
      this.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    }
  }

  /**
   * Logic detector for UI autohiding functionality when mouse idle detected.
   * @private
   */
  handleMouseMove() {
    this.wrapper.classList.add("active");
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      if (
        !this.video.paused &&
        !this.settingsPanel.classList.contains("open")
      ) {
        this.wrapper.classList.remove("active");
      }
    }, 3000);
  }

  /**
   * Handles displaying the interactive settings dialog.
   * @private
   */
  openMainMenu() {
    this.settingsPanel.classList.toggle("open");
    if (!this.settingsPanel.classList.contains("open")) return;
    this.renderMainMenu();
  }

  /**
   * Generates HTML layout components mapped specifically to the master module arrays.
   * @private
   */
  renderMainMenu() {
    let html = "";
    if (this.config.settings.quality && this.qualityKeys.length > 0) {
      html += `<div class="vp-setting-item" data-menu="quality"><span><i class="fas fa-sliders-h" style="margin-right:12px; width:15px; opacity:0.8;"></i> Quality</span> <span>${this.currentQualityKey} <i class="fas fa-chevron-right" style="font-size:11px; margin-left:6px; opacity:0.6;"></i></span></div>`;
    }
    if (this.config.settings.speed) {
      html += `<div class="vp-setting-item" data-menu="speed"><span><i class="fas fa-tachometer-alt" style="margin-right:12px; width:15px; opacity:0.8;"></i> Speed</span> <span>${this.currentSpeed === 1 ? "Normal" : this.currentSpeed + "x"} <i class="fas fa-chevron-right" style="font-size:11px; margin-left:6px; opacity:0.6;"></i></span></div>`;
    }
    if (
      this.config.settings.subtitle &&
      this.config.settings.subtitle.length > 0
    ) {
      const subLabel = this.activeSubtitleLang || "Off";
      html += `<div class="vp-setting-item" data-menu="subtitle"><span><i class="fa-solid fa-closed-captioning" style="margin-right:12px; width:15px; opacity:0.8;"></i> Subtitles</span> <span>${subLabel} <i class="fas fa-chevron-right" style="font-size:11px; margin-left:6px; opacity:0.6;"></i></span></div>`;
    }
    if (this.config.settings.loop) {
      const loopStatus = this.video.loop ? "On" : "Off";
      html += `<div class="vp-setting-item" data-menu="loop"><span><i class="fas fa-repeat" style="margin-right:12px; width:15px; opacity:0.8;"></i> Loop</span> <span>${loopStatus}</span></div>`;
    }

    this.settingsPanel.innerHTML = html;

    this.settingsPanel.querySelectorAll(".vp-setting-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const menu = e.currentTarget.dataset.menu;
        if (menu === "loop") {
          this.video.loop = !this.video.loop;
          this.renderMainMenu();
        } else {
          this.openSubMenu(menu);
        }
      });
    });
  }

  /**
   * Mounts dynamically injected HTML layers parsing detailed child menu settings configurations.
   * @param {string} type - Differentiates specific setting panels (quality/speed/subtitle).
   * @private
   */
  openSubMenu(type) {
    const titles = {
      quality: "Quality",
      speed: "Playback Speed",
      subtitle: "Subtitles",
    };
    let html = `<div class="vp-setting-header" data-action="back"><i class="fas fa-arrow-left"></i> ${titles[type]}</div>`;

    if (type === "quality") {
      html += `<div class="vp-setting-item" data-quality="Auto"><span>Auto</span> ${this.currentQualityKey === "Auto" ? '<i class="fas fa-check"></i>' : ""}</div>`;
      this.qualityKeys
        .slice()
        .reverse()
        .forEach((q) => {
          html += `<div class="vp-setting-item" data-quality="${q}"><span>${q}</span> ${this.currentQualityKey === q ? '<i class="fas fa-check"></i>' : ""}</div>`;
        });
    } else if (type === "speed") {
      const speeds = [2, 1.5, 1.25, 1, 0.75, 0.5, 0.25];
      speeds.forEach((s) => {
        const label = s === 1 ? "Normal" : s + "x";
        html += `<div class="vp-setting-item" data-speed="${s}"><span>${label}</span> ${this.currentSpeed === s ? '<i class="fas fa-check"></i>' : ""}</div>`;
      });
    } else if (type === "subtitle") {
      html += `<div class="vp-setting-item" data-lang="false"><span>Off</span> ${!this.activeSubtitleLang ? '<i class="fas fa-check"></i>' : ""}</div>`;
      this.config.settings.subtitle.forEach((lang) => {
        html += `<div class="vp-setting-item" data-lang="${lang}"><span>${lang}</span> ${this.activeSubtitleLang === lang ? '<i class="fas fa-check"></i>' : ""}</div>`;
      });
    }

    this.settingsPanel.innerHTML = html;

    this.settingsPanel
      .querySelector('[data-action="back"]')
      .addEventListener("click", () => {
        this.renderMainMenu();
      });

    this.settingsPanel.querySelectorAll(".vp-setting-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (type === "quality") {
          this.loadSource(e.currentTarget.dataset.quality);
        } else if (type === "speed") {
          this.currentSpeed = parseFloat(e.currentTarget.dataset.speed);
          this.video.playbackRate = this.currentSpeed;
        } else if (type === "subtitle") {
          const lang = e.currentTarget.dataset.lang;
          this.activeSubtitleLang = lang === "false" ? false : lang;
          if (this.ccBtn) this.updateCCIcon();
        }
        this.settingsPanel.classList.remove("open");
      });
    });
  }
}
