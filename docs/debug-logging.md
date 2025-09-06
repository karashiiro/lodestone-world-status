# Debug Logging

The library uses the [debug](https://www.npmjs.com/package/debug) package for detailed logging. This is helpful for troubleshooting or understanding library behavior.

## Enabling Debug Logging

### Unix/Linux/macOS

```bash
DEBUG="lodestone-world-status*" node your-script.js
```

### Windows (Command Prompt)

```cmd
set DEBUG=lodestone-world-status* && node your-script.js
```

### Windows (PowerShell)

```powershell
$env:DEBUG="lodestone-world-status*"; node your-script.js
```

### Programmatically

```javascript
// Set before importing the library
process.env.DEBUG = "lodestone-world-status*";

import { LodestoneWorldStatus } from "lodestone-world-status";
```

## Debug Namespaces

- `lodestone-world-status` - Main class operations (cache hits/misses, world lookups)
- `lodestone-world-status:scraper` - HTML fetching and parsing operations

## Selective Debugging

```bash
# Only main class operations
DEBUG="lodestone-world-status" node your-script.js

# Only scraper operations
DEBUG="lodestone-world-status:scraper" node your-script.js
```

## Example Debug Output

```
lodestone-world-status Looking up world status for: Adamantoise (normalized: adamantoise) +0ms
lodestone-world-status Cache miss - fetching fresh data from https://na.finalfantasyxiv.com/lodestone/worldstatus/ +1ms
lodestone-world-status:scraper Fetching HTML from: https://na.finalfantasyxiv.com/lodestone/worldstatus/ +0ms
lodestone-world-status:scraper Successfully fetched HTML (123456 characters) +987ms
lodestone-world-status Attempting to parse with specific selectors +0ms
lodestone-world-status:scraper No world status containers found with specific selectors +12ms
lodestone-world-status Falling back to generic parsing +1ms
lodestone-world-status:scraper Found 25 headings to check for data centers +8ms
lodestone-world-status Successfully parsed with generic selectors: 4 data centers +45ms
lodestone-world-status Cached 4 data centers with 32 total worlds +1ms
lodestone-world-status Found world Adamantoise in data center Aether: congested (online) +2ms
```

This shows:

1. A world lookup request
2. Cache miss triggering a fresh fetch
3. HTML being fetched from Lodestone
4. Specific selector parsing failing and falling back to generic parsing
5. Successful parsing finding multiple data centers
6. The requested world being found

## What Gets Logged

### Main Class (`lodestone-world-status`)

- World lookup requests with normalized names
- Cache hits/misses with cache age
- API call initiation with target URL
- Parsing strategy selection and results
- Cache updates with statistics
- World search results (found/not found)
- Cache clearing events
- Error conditions

### Scraper (`lodestone-world-status:scraper`)

- HTTP requests with URLs and response sizes
- HTML parsing initiation with strategy
- Data center discovery and processing
- World pattern matching and extraction
- Parsing completion statistics
- HTTP error details
