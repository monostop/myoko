# Resort Scraping Notes

## Overview

This document summarizes the technical findings from implementing automated scraping for Madarao and Lotte Arai ski resorts.

## Madarao (madarao.jp/ski)

**Status: Fully working**

The Madarao website uses simple HTML with text-based status indicators. All data points can be reliably extracted:

| Data Point | Extraction Method | Reliability |
|------------|-------------------|-------------|
| Snow depth | Text after "積雪" | High |
| Temperature | Text after "気温" | High |
| Weather | Text after "天候" | High |
| Lifts open | Parse "リフトX基" pattern | High |
| Courses open | Parse "Xコース滑走可能" pattern | High |

The page updates daily around 7:28 AM JST.

---

## Lotte Arai (lottehotel.com/arai-resort)

**Status: Partially working**

### What Works

| Data Point | Source Page | Reliability |
|------------|-------------|-------------|
| Total snowfall | Main page `/en` | High |
| Temperature | Main page `/en` | High |
| Resort status | Snow season page (inferred) | Medium |

### What Doesn't Work

**Lift and slope counts cannot be reliably scraped.**

#### Root Cause

The Lotte Arai website renders status indicators as **images or CSS-generated content**, not as text characters:

```
Expected in DOM:    "Zendana Lift ● 8:15-15:30"
Actual in DOM:      "Zendana Lift 8:15-15:30" (no status symbol)
```

The status indicators (● for running, × for suspended) are rendered via:
1. Image elements with alt text
2. CSS pseudo-elements (::before/::after)
3. Icon fonts

When using `document.body.innerText`, these visual indicators are not captured.

#### What Was Tried

1. **Text pattern matching** - Looking for ● and × symbols in innerText
   - Result: Symbols not present in text output

2. **Operating hours detection** - Assuming lifts with times are running
   - Result: All lifts show schedule times regardless of status

3. **Legend text detection** - Looking for "Running" or "Service suspended" text
   - Result: Only legend labels found, not per-lift status

### Potential Solutions (Not Implemented)

1. **Query image alt attributes**
   ```javascript
   document.querySelectorAll('img[alt="Running"]').length
   ```

2. **Check CSS classes on status elements**
   ```javascript
   document.querySelectorAll('.lift-status.open').length
   ```

3. **Parse aria-labels for accessibility data**
   ```javascript
   element.getAttribute('aria-label')
   ```

4. **Screenshot-based OCR** - Take screenshots and use image recognition
   - Overkill for this use case

### Current Workaround

- Lift/slope counts return `null` from scraper
- Manual entry via the app UI still works
- Status is inferred from presence of "Running" text (PARTIAL if both Running and Suspended text found)

---

## Recommendations

1. **For Madarao**: Current scraper is production-ready

2. **For Lotte Arai**:
   - Accept partial automation (weather data only)
   - Use manual entry for lift/slope counts
   - Consider revisiting if the resort updates their website

3. **Future improvements**:
   - Add more resorts (Akakura Kanko, Suginohara, etc.)
   - Implement retry logic for transient failures
   - Add Slack/Discord notifications on scrape errors
