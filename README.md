# VideoPlayer

**A responsive, customizable, YouTube-inspired HTML5 video player built with Vanilla JavaScript.**

VideoPlayer adds a modern video-watching interface to your website without requiring a frontend framework or a backend server. It supports direct video sources, quality selection, playback-speed controls, a seekable timeline, hover previews, synchronized LRC-style subtitles, fullscreen playback, and customizable branding.

> **Live Demo:** https://jproject-1.github.io/videoplayer/

VideoPlayer is an independent project inspired by familiar video-player interfaces. It is **not affiliated with, sponsored by, or endorsed by YouTube or Google**.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Subtitles](#subtitles)
- [Customization Examples](#customization-examples)
- [Browser Compatibility and Limitations](#browser-compatibility-and-limitations)
- [Usage Guidelines](#usage-guidelines)
- [Privacy and Security](#privacy-and-security)
- [License](#license)
- [Credits and Links](#credits-and-links)

## Features

- **Responsive interface** — adapts to different container widths, including smaller screens.
- **HTML5 video playback** — plays browser-supported media files from direct URLs.
- **Video quality menu** — lets viewers switch between the source resolutions you provide.
- **Auto quality option** — selects the last entry in the configured `src` object. Put the highest-quality source last.
- **Playback speed controls** — offers 0.25x, 0.5x, 0.75x, Normal, 1.25x, 1.5x, and 2x speeds.
- **Interactive timeline** — seek by clicking or dragging the progress bar.
- **Timeline preview** — displays a video-frame preview while hovering over the timeline when the browser can render the preview source.
- **LRC-style synchronized subtitles** — display timestamped subtitle lines and support multiple named subtitle tracks.
- **Fullscreen mode** — expands the player using the browser Fullscreen API.
- **Volume controls** — adjust volume and mute or unmute playback.
- **Cover image** — display a poster image before or during playback, as supported by the browser.
- **Optional logo** — show a small watermark or brand logo in the player.
- **Loop, autoplay, and muted options** — configure the initial playback behavior.
- **Custom progress color** — accepts CSS color values, including hex, RGB, named colors, and gradients.
- **Configurable settings menu** — show or hide quality, speed, loop, and subtitle options.
- **Vanilla JavaScript** — no React, Vue, or other frontend framework is required.

## How It Works

VideoPlayer creates its own player interface inside a container element on your page. You configure it with one or more direct media URLs, then initialize it with JavaScript.

The player uses the browser's native HTML5 `<video>` element. It does **not** extract or play video from a regular YouTube watch-page URL. If your content is hosted by a video platform, use that platform's permitted embed method instead. For VideoPlayer, supply direct video-file URLs that the browser is allowed to access.

The `Auto` quality option is a simple source selection, not adaptive bitrate streaming. It chooses the final source entry from `src`; it does not automatically change quality in response to network conditions.

## Requirements

- A modern browser with HTML5 video support.
- The VideoPlayer JavaScript source file, included in your project.
- Direct video-file URLs that are reachable by the viewer's browser.
- Font Awesome CSS for the interface icons. The player creates its layout and styles, but the icon classes are provided by Font Awesome.

No Node.js installation, build step, database, or backend server is required for basic use.

## Quick Start

### 1. Add a player container

Add an empty element where the player should appear:

```html
<div id="player-root"></div>
```

### 2. Include Font Awesome and the player script

Add Font Awesome CSS so the player icons are visible. Then load the VideoPlayer source file. In this example, the source file is named `videoplayer.js`; replace that name with the filename you actually use.

```html
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
/>

<script src="./videoplayer.js"></script>
```

### 3. Initialize the player

Place the initialization script after the player script and the container element:

```html
<script>
  const player = new VideoPlayer({
    container: "#player-root",
    title: "My Demo Video",
    src: {
      "360p": "./media/video-360.mp4",
      "720p": "./media/video-720.mp4",
      "1080p": "./media/video-1080.mp4"
    },
    cover: "./media/poster.jpg",
    logo: false,
    width: "100%",
    height: "auto",
    autoplay: false,
    muted: false,
    loop: false,
    controls: true,
    progressColor: "#ff0000",
    subtitle: false,
    defaultSubtitle: false,
    settings: {
      quality: true,
      speed: true,
      loop: true,
      subtitle: false
    }
  });
</script>
```

Replace the example media paths with your own hosted files. The `src` object must contain at least one source; otherwise, initialization throws an error. The example quality labels are names shown in the menu, so use labels that match the files you provide.

### 4. Open your page

Serve the page through your usual local development server or hosting provider. Check that the media URLs work directly in the browser and that the browser supports the files' formats and codecs.

## Configuration

Pass a configuration object to `new VideoPlayer(config)`.

| Option | Type | Default | Description |
|---|---|---|---|
| `container` | `string` | `"#player-root"` | CSS selector for the element that will contain the player. The element must already exist. |
| `title` | `string` | `""` | Video title displayed in the player's header. |
| `src` | `object` | `{}` | Required mapping of quality labels to direct video URLs. Must contain at least one entry. |
| `cover` | `string` | `""` | URL or path to the video's poster image. |
| `logo` | `string \| false` | `false` | URL or path to an optional watermark logo, or `false` to omit it. |
| `subtitle` | `object \| false` | `false` | Subtitle tracks, mapped by language/name to arrays of timestamped LRC-style lines. |
| `defaultSubtitle` | `string \| false` | `false` | Key of the subtitle track to activate initially, or `false` to start with subtitles off. |
| `width` | `string` | `"100%"` | CSS width for the player wrapper, such as `"100%"` or `"800px"`. |
| `height` | `string` | `"auto"` | CSS height for the player wrapper. The layout also uses a 16:9 aspect ratio. |
| `autoplay` | `boolean` | `false` | Ask the browser to start playback automatically. Browser autoplay policies may prevent this. |
| `muted` | `boolean` | `false` | Start playback muted. |
| `loop` | `boolean` | `false` | Replay the video automatically when it reaches the end. |
| `controls` | `boolean` | `true` | Show or hide the bottom control bar. |
| `progressColor` | `string` | `"#ff0000"` | CSS background value used for the timeline progress and its handle. Gradients are supported. |
| `settings` | `object` | See below | Controls which options are available in the settings menu. |

Default settings:

```js
{
  quality: true,
  speed: true,
  loop: true,
  subtitle: false
}
```

`settings.subtitle` can be an array of subtitle-track names, for example `["English", "Indonesian"]`. Use the same names as the keys in the `subtitle` object. Set it to `false` when you do not want subtitle controls.

**Important:** `settings` is merged at the top configuration level. If you provide your own `settings` object, include every setting you want to keep; do not assume missing nested settings will automatically inherit their defaults.

### Video source ordering

The player uses the last key in `src` for the `Auto` option. List sources from lowest to highest quality:

```js
src: {
  "360p": "/media/video-360.mp4",
  "480p": "/media/video-480.mp4",
  "720p": "/media/video-720.mp4",
  "1080p": "/media/video-1080.mp4"
}
```

In this example, `Auto` selects `1080p`. Make sure each label points to a valid, compatible video URL.

## Subtitles

VideoPlayer supports timestamped subtitle lines using an LRC-style format. Each line must contain a timestamp followed by the text to display:

```text
[00:01.00]Welcome to the video.
[00:04.50]This is the next subtitle line.
[00:08.25]Thanks for watching.
```

Configure subtitle tracks as an object whose values are arrays of lines:

```js
const player = new VideoPlayer({
  container: "#player-root",
  title: "A Video With Subtitles",
  src: {
    "720p": "./media/video-720.mp4"
  },
  subtitle: {
    English: [
      "[00:01.00]Welcome to the video.",
      "[00:04.50]This is the next subtitle line."
    ],
    Indonesian: [
      "[00:01.00]Selamat datang di video.",
      "[00:04.50]Ini adalah baris subtitle berikutnya."
    ]
  },
  defaultSubtitle: "English",
  settings: {
    quality: true,
    speed: true,
    loop: true,
    subtitle: ["English", "Indonesian"]
  }
});
```

The timestamp format accepted by the parser is `[mm:ss.xx]` or `[mm:ss.xxx]`, where the numbers represent minutes, seconds, and hundredths or thousandths of a second. Use two-digit minutes and seconds, and make sure each timestamp matches the media. Lines without a valid timestamp are ignored.

## Customization Examples

### Change the progress bar color

A solid color:

```js
progressColor: "#7c3aed"
```

An RGB color:

```js
progressColor: "rgb(0, 180, 120)"
```

A CSS gradient:

```js
progressColor: "linear-gradient(90deg, #7c3aed, #06b6d4)"
```

### Add a logo and poster

```js
cover: "./assets/video-poster.webp",
logo: "./assets/site-logo.svg"
```

### Hide the control bar

```js
controls: false
```

When controls are hidden, the video element remains in the player, but the custom bottom control bar is not displayed. Make sure viewers still have an appropriate way to control playback for your use case.

### Enable looping and start muted

```js
autoplay: true,
muted: true,
loop: true
```

Autoplay is controlled by the browser and may be blocked. Starting muted can improve compatibility with autoplay policies, but it does not guarantee playback will start automatically.

## Browser Compatibility and Limitations

- Supported video formats and codecs depend on the viewer's browser and operating system. MP4 with broadly supported codecs is often a practical default, but test your own media.
- The player needs direct, browser-accessible media URLs. A normal YouTube watch-page URL is not a direct video file and cannot be used as a `src` value here.
- The `Auto` option selects the last configured source; it is not network-aware adaptive streaming.
- Autoplay and fullscreen requests are subject to browser permissions and policies.
- Timeline preview depends on whether the browser can load and seek the preview media successfully.
- For remote files, hosting and cross-origin configuration can affect whether media loads or seeks correctly.
- Font Awesome CSS is used for icons. If it is not loaded, the controls may appear without their expected icons.
- The supplied implementation injects its CSS once per page. If you need several player instances with different CSS-level options on the same page, test that setup carefully or adapt the style-injection logic for per-instance styling.

## Usage Guidelines

VideoPlayer is intended for embedding video playback into websites, portfolios, project pages, documentation, and other lawful web experiences.

1. **Use media you have permission to publish.** You are responsible for obtaining the required rights for videos, music, images, logos, subtitles, and other content you use.
2. **Respect hosting-provider rules.** Make sure your media host allows the intended embedding, bandwidth usage, and public access. Do not attempt to bypass access controls or digital-rights restrictions.
3. **Do not misrepresent the project.** VideoPlayer is inspired by common video-player patterns, including the familiar experience offered by YouTube, but it is an independent implementation. Do not imply that it is an official YouTube product or that Google endorses it.
4. **Preserve license notices when redistributing.** If you share or redistribute copies of the software, include the original MIT copyright and permission notice.
5. **Respect third-party licenses.** Fonts, icon libraries, media, and other third-party assets may have separate license terms. Check and follow those terms independently.
6. **Test your deployment.** Verify media URLs, mobile behavior, playback controls, subtitles, and source permissions before publishing the player on a public website.

These guidelines are practical recommendations, not additional restrictions on the rights granted by the MIT License. The MIT License terms below govern use of the software.

## Privacy and Security

VideoPlayer is a client-side player and does not require its own account system, database, or application backend. It requests media and image resources from the URLs configured by the website owner. The remote hosts you use may receive normal connection information when a visitor's browser requests those resources.

- Only configure media and asset URLs you trust.
- Do not place private or access-controlled media at publicly accessible URLs unless you intend to make it public.
- Use HTTPS for your site and hosted media when available.
- Keep any third-party assets and scripts you add to the page up to date.
- If you accept title text, URLs, or other configuration from untrusted users, validate and sanitize those values before passing them into a player implementation that builds HTML dynamically.

The project does not by itself guarantee content availability, copyright compliance, security of third-party hosts, or compatibility with every browser.

## License

This project is licensed under the **MIT License**. You may use, copy, modify, merge, publish, distribute, sublicense, and sell copies of the software, subject to the license conditions. The copyright and permission notice must be included in copies or substantial portions of the software.

Copyright (c) 2026 JPROJECT-1

```text
MIT License

Copyright (c) 2026 JPROJECT-1

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Credits and Links

- **Developer:** [JPROJECT-1](https://github.com/JPROJECT-1/)
- **Personal website:** [jasonpw.web.id](https://jasonpw.web.id/)
- **Studio:** [YCYL STUDIO](https://ycylstudio.web.id/)
- **Live demo:** [VideoPlayer](https://jproject-1.github.io/videoplayer/)

If you use VideoPlayer in your project, feedback, bug reports, and improvements are welcome through the project's available communication channels.
