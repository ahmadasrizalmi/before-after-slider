# Before/After Slider Chrome Extension

Create interactive before/after photo comparison sliders. Export as shareable HTML.

## Features

- Upload before + after photos (drag-drop)
- Live interactive preview with draggable divider
- Customizable slider color
- Generate self-contained HTML gallery page
- Touch-friendly (mobile support)
- Keyboard accessible (arrow keys)
- Export as downloadable HTML file
- Multiple project support
- Brand name customization
- Apple-style UI (light theme, no AI slop)

## Install

1. Clone this repo
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `before-after-slider` folder

## Usage

1. Click extension icon → Side panel opens
2. Click "+ New" to create project
3. Enter title, description, brand name
4. Upload BEFORE photo (drag-drop or click)
5. Upload AFTER photo (drag-drop or click)
6. Drag divider to preview comparison
7. Click "Export HTML" to download
8. Share HTML file with clients

## Generated HTML

The exported HTML file features:
- Interactive slider (drag to compare)
- Touch support (works on mobile)
- Keyboard navigation (arrow keys)
- Responsive design
- Self-contained (all photos embedded as base64)
- No external dependencies

## Use Cases

- Interior renovation comparison
- Before/after cleaning
- Furniture replacement
- Lighting upgrade
- Staging comparison

## Tech

- Chrome Extension Manifest V3
- Canvas API for image resizing
- Touch events for mobile support
- ARIA accessibility
- No external dependencies
