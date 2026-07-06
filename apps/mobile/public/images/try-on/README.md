# Demo try-on reference photo

Drop the demo account's reference photo here as `demo-user.jpg`, then set in `.env`:

```
EXPO_PUBLIC_DEMO_TRYON_PHOTO_URI=/images/try-on/demo-user.jpg
```

This pre-seeds the demo account with an already-consented active try-on photo
(the state a real user reaches after the consent + upload flow), so the
Compare screen's "Try it on" toggle works immediately in a scripted demo.

This photo is the account holder's own reference image. Do not commit
photos of anyone who hasn't consented, and prefer keeping the file
untracked (see .gitignore) for a public repo.
