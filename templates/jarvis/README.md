# Jarvis template

iOS-Home-inspired premium dashboard for Home Assistant.

> **Closed source.** The Jarvis template ships built artifacts only.
> Source lives in a private repository; only the compiled bundle is
> distributed under a commercial license. The directory you see here in the
> public repo holds metadata + preview only.

## What you get

- Multi-room layout (RoomColumn) with grouped tiles
- HeroTile + entity tile system
- Energy view: live W, PF, daily/weekly aggregation
- Weather card with multi-day forecast
- Animated transitions, OKLCH-tuned theming
- Designed for portrait wall tablets and PWA install on iPad/iPhone

## Install

```yaml
# Developer Tools → Services
service: glasshopper.install_template
data:
  url: https://gumroad.com/.../jarvis-v0.1.0.zip
```

Then go to **Settings → Devices → Add Integration → Glasshopper** and select
**Jarvis** as the template.

## License

Single license: 49 €. Team (up to 5 seats): 199 €. Lifetime: 299 €.

Buy at <https://jarvis.salvatorecolopi.com>.
