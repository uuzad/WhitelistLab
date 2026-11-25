# WhitelistLab

WhitelistLab is a privacy-friendly network diagnostics tool designed for iPhone/iPad and desktop browsers.

It helps determine whether a URL is reachable and where a failure is likely happening: local connectivity, browser access, HTTP response, redirect, timeout, or an application/server problem.

> Important: WhitelistLab is a diagnostic tool. It does not bypass school/workplace/router restrictions, proxy policies, parental controls, or other access controls.

## Features

- iPhone-first responsive interface
- URL reachability test
- Request timing
- Online/offline status
- HTTP status visibility when the browser permits it
- Human-readable diagnostic report
- Copy report to clipboard
- iOS share sheet support
- Light/dark appearance
- No account or telemetry in the project
- GitHub Pages deployment

## iPhone

Open the deployed GitHub Pages site in Safari.

To install it like an app:

1. Open the site in Safari.
2. Tap Share.
3. Choose Add to Home Screen.
4. Launch WhitelistLab from the Home Screen.

## Browser limitations

A normal web page cannot perform arbitrary low-level network operations. Browsers restrict cross-origin requests, raw TCP/UDP sockets, DNS inspection, and certificate inspection.

Therefore a failed browser request does not automatically mean that a domain is blocked. The report explains common causes and what to test next.

## Local development

This is a static site. For example:

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## GitHub Pages

The repository includes a GitHub Actions workflow that publishes the static site to GitHub Pages.

## License

MIT. See LICENSE.
