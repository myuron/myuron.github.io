---
name: sync-zenn-blog
description: Sync the BLOG section of index.html with published articles from zenn.dev/myuron. Use when the user wants to update, refresh, or add Zenn blog links to the site.
---

# Sync Zenn Blog Links

Update the `<h2>BLOG</h2>` section in `index.html` so it links to every published
article on https://zenn.dev/myuron, ordered newest first.

## Why a script, not scraping the page

`https://zenn.dev/myuron` is client-rendered — fetching the HTML does NOT return the
article list. Always use the JSON API instead:

```
https://zenn.dev/api/articles?username=myuron&order=latest
```

## Steps

1. Fetch the article list from the API:

   ```
   https://zenn.dev/api/articles?username=myuron&order=latest
   ```

   Each entry has `title` and `slug`. The article URL is
   `https://zenn.dev/myuron/articles/<slug>`. Results are already newest-first.

   Note: the API paginates. If `next_page` is non-null, fetch
   `...&order=latest&page=<n>` and merge until exhausted.

2. Open `index.html` and locate the `<ul>` inside the `<div>` containing `<h2>BLOG</h2>`.

3. Replace that `<ul>` with one `<li>` per article, in API order (newest first),
   matching the existing indentation:

   ```html
   <ul>
     <li>
       <a href="https://zenn.dev/myuron/articles/<slug>"><title></a>
     </li>
     ...
   </ul>
   ```

4. Report which articles were added or removed compared to the previous list.

## Notes

- Keep titles verbatim from the API (do not translate or shorten).
- Only touch the BLOG `<ul>`; leave the rest of `index.html` unchanged.
- Don't commit or push unless the user asks.
