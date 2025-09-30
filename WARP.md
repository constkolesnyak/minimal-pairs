# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a static web application for Japanese pitch accent minimal pairs perception testing. It's a rewritten version of the original [コツ minimal pairs test](https://kotu.io/tests/pitchAccent/perception/minimalPairs) optimized for static hosting with improved performance and additional features.

## Development Commands

### Server Management
- **Start local development server**: `python -m http.server --bind localhost`
  - Alternative scripts: `./run.sh` or `run.bat` on Windows
  - Server typically runs on port 8000

### Data Validation and Processing
- **Validate data integrity**: `python pairs_validator.py`
  - Checks for consistency in rawPronunciation, moraCount, silencedMoras across pairs
  - Validates base64 encoding of audio data
  - Reports mismatches with colored output (red for failures, green for passes)

- **Generate pairs index**: `python pairs_index_generator.py`
  - Processes all JSON files in the `data/` directory
  - Creates `js/pairs_index.js` with pitch accent categorizations
  - Categorizes pairs by pitch patterns (pitch0-pitch4) and devoicing

### Code Quality
- **JavaScript linting**: ESLint configuration exists (`eslint.config.mjs`) but requires installation
  - Install: `npm install eslint @eslint/js globals`
  - Run: `npx eslint js/`

## Code Architecture

### Frontend Structure
- **Entry point**: `index.html` - Main application interface with test controls and options
- **JavaScript**: `js/minimal_pairs.js` - Core application logic for the pitch accent test
- **Styles**: `css/styles.css` and `css/styles_override.css` - Custom styling
- **Data index**: `js/pairs_index.js` - Generated index of all audio pairs by category

### Data Organization
- **Audio pairs**: `data/` directory contains numbered JSON files (e.g., "0", "1", "1a", etc.)
- **JSON structure**: Each file contains metadata for a minimal pair:
  - `kana`: Japanese characters
  - `pairs`: Array of two audio variants with different pitch accents
  - Each pair includes: `accentedMora`, `moraCount`, `pitchAccent`, `rawPronunciation`, `silencedMoras`, `soundData` (base64 audio)

### Key Features
- **Pitch accent patterns**: Supports Heiban/Odaka (pitch 0), Atamadaka (pitch 1), and three Nakadaka patterns (pitch 2-4)
- **Devoicing detection**: Algorithm identifies words containing Japanese consonant devoicing patterns
- **Audio prefetching**: Optimized loading with one-pair-ahead prefetching
- **Customizable shortcuts**: User-configurable keyboard shortcuts for test interaction

### Build Process
The application requires two Python utilities to be run after data changes:
1. `pairs_validator.py` - Ensures data consistency
2. `pairs_index_generator.py` - Rebuilds the search index

### Notable Implementation Details
- **Static hosting optimization**: Fully client-side application with no backend dependencies
- **Performance focus**: <50kb page load, <14kb typical audio payload
- **Audio format**: Base64-encoded audio data embedded directly in JSON files
- **Pitch accent notation**: Uses ＼ symbol after accented mora to indicate pitch drops