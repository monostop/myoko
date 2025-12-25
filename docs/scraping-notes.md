# Resort Scraping Notes

*Last updated: 2025-12-25*

## Overview

This document summarizes the technical findings from implementing automated scraping for Madarao and Lotte Arai ski resorts.

| Resort | Status | Lift/Slope Data |
|--------|--------|-----------------|
| Madarao | ✅ Fully working | ✅ Accurate |
| Lotte Arai | ✅ Fully working | ✅ Accurate |

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

**Status: Fully working**

### What Works

| Data Point | Source Page | Reliability |
|------------|-------------|-------------|
| Total snowfall | Main page `/en` | High |
| Temperature | Main page `/en` | High |
| Lifts open | Slopes guide `/en/snow/slopes-guide` | High |
| Courses open | Slopes guide `/en/snow/slopes-guide` | High |

### Solution: aria-label Attributes

The main conditions page (`/en/ski/conditions.html`) renders status indicators as CSS/images, making them unreadable via `innerText`. However, the slopes guide page (`/en/snow/slopes-guide`) uses **aria-label attributes** for accessibility:

```html
<span class="ico ico-arai-open" aria-label="Open"></span>
<span class="ico ico-arai-closed" aria-label="Close"></span>
```

The scraper queries these attributes to count open/closed lifts and courses:

```javascript
document.querySelectorAll('[aria-label="Open"], [aria-label="Close"]')
  .forEach((el) => {
    const row = el.closest("li, tr, div");
    const text = row?.textContent || "";
    const isOpen = el.getAttribute("aria-label") === "Open";

    if (text.includes("Lift") || text.includes("Gondola")) {
      if (isOpen) liftsOpen++;
      else liftsClosed++;
    } else {
      if (isOpen) coursesOpen++;
      else coursesClosed++;
    }
  });
```

### Previous Challenges (Now Solved)

The original conditions page (`/en/ski/conditions.html`) had these issues:
- Status symbols (● and ×) rendered via CSS pseudo-elements
- `document.body.innerText` couldn't capture these visual indicators
- All lifts showed schedule times regardless of actual status

---

## Recommendations

1. **Both scrapers are production-ready** - Madarao and Lotte Arai fully automated

2. **Future improvements**:
   - Add more resorts (Akakura Kanko, Suginohara, etc.)
   - Implement retry logic for transient failures
   - Add Slack/Discord notifications on scrape errors
