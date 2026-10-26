# YouTube Intent Gate

Personal-use Safari Web Extension (primary) and Chrome Manifest V3 extension, built from one `extension-src/` tree. Modes: **Intention Gate** (default), **No Doomscroll**, **Watch Later**, and **Off**. Only `mode` is saved in extension-local storage; intention text is never stored. No telemetry, backend, remote code, or YouTube API access.

## Requirements observed on this Mac

- macOS 27.0.1, Safari 27.0.1, Chrome 154.0.8037.95, Xcode 27.1, Node 26.10.0.
- Tested on these installed versions only. Other versions are not claimed.

## Build / test

```sh
npm ci
npm test
npm run package
```

`extension-src/` is the sole editable WebExtension source. `chrome/` and `safari/staged/` are generated copies; **do not edit those copies**. Re-run `npm run package` after source edits. The Safari Xcode project under `safari/generated/YouTube Intent Gate/` references `safari/staged/` resources, so rebuild the app after packaging.

## Safari local install (primary)

1. `npm run package`.
2. Open `safari/generated/YouTube Intent Gate/YouTube Intent Gate.xcodeproj`, choose the **YouTube Intent Gate** scheme and **My Mac**. Set a signing team if Xcode asks, then Run. The generated app bundle ID is `com.maghizhan.youtubeintentgate`; extension ID is `com.maghizhan.youtubeintentgate.Extension`.
3. In Safari → Settings → Extensions, enable **YouTube Intent Gate** and grant access to `youtube.com` when prompted. This is a user-facing browser permission; a successful Xcode build alone does not enable it.
4. Reload the YouTube tab after rebuilding. The wrapper app has a shortcut to Safari's extension preferences.

Command-line build verified on this Mac (substitute a valid local code-signing identity and team where appropriate):

```sh
xcodebuild -project 'safari/generated/YouTube Intent Gate/YouTube Intent Gate.xcodeproj' \
  -scheme 'YouTube Intent Gate' -configuration Debug -destination 'platform=macOS' \
  -derivedDataPath './safari/DerivedData' build \
  CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='<certificate SHA-1>' DEVELOPMENT_TEAM='<team ID>'
```

The converter command used to generate the project was:

```sh
xcrun safari-web-extension-converter ./safari/staged \
  --project-location ./safari/generated --app-name 'YouTube Intent Gate' \
  --bundle-identifier com.maghizhan.youtubeintentgate --macos-only --no-open --no-prompt
```

The converter generated the host bundle ID as `com.maghizhan.YouTube-Intent-Gate` while the extension used `com.maghizhan.youtubeintentgate.Extension`; that fails Xcode's embedded-binary prefix validation. The tracked Xcode project corrects the host ID to `com.maghizhan.youtubeintentgate`. **If regenerating from scratch, reapply that one host-ID fix before building.**

Signing validity/renewal is controlled by your actual certificate/provisioning and is not assumed to be seven days. Check Xcode and Safari if the extension stops running.

## Chrome local install (secondary)

1. `npm run package`.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, select this repository's `chrome/` directory.
3. Reload the extension card and the YouTube tab after source changes. The manifest contains a stable public `key` (not a private key); observed extension ID: `cgjjklmfjlifmahkljcchkopjjlpcnnc`. Moving the folder should retain the ID, but back up important browser profile data before relocating.

## Safety and verification

The content script starts at `document_start`. An opaque Home curtain prevents the feed from appearing until mode resolution/overlay mount; the 3-second fail-open timer removes the curtain if that work stalls. If a broken build still blocks YouTube, disable the extension in Safari Settings → Extensions or `chrome://extensions`. On signed-out Watch Later, YouTube handles sign-in; the extension only redirects exact Home and never intercepts the playlist/sign-in page.

Automated tests use Node's test runner and jsdom; they do not substitute for Safari/Chrome runtime QA. The icon is Marvel-character-inspired and intended for private unpacked/local use only. The separate `extension-src/icons/hooded-original.svg` is an original alternative for any later public-release discussion; public release is out of scope.
