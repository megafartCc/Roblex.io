# Admin Panel Skeleton

This folder keeps admin-only surfaces out of the public landing page bundle. The current structure maps cleanly to routes such as `domain/management/login`:

```
AdminPanel/
  management/
    login/
      index.html
      styles.css
      scripts/
        auth.js
```

Nothing here is imported by the main landing page; deploy it separately or map your web server so `/management/login` serves `AdminPanel/management/login/index.html`.
