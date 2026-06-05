# Jarvis — premium template

iOS-Home-inspired premium dashboard for Home Assistant. The reference build of
what Glasshopper can produce — multi-room, energy view, weather, all on one
bundle.

![Jarvis preview](https://jarvis.salvatorecolopi.com/preview.png)

## Features

- Multi-room layout with grouped entity tiles.
- Hero tile for the room you're currently in (motion-aware).
- Energy view: live W, power factor, daily / weekly aggregation, cost
  estimate.
- Weather card: current conditions, multi-day forecast, alerts.
- OKLCH-tuned theming, animated state transitions.
- Designed for portrait wall tablets and PWA install on iOS.

## Install

1. Buy a license at <https://jarvis.salvatorecolopi.com>. You'll receive a
   zip download URL.
2. In HA: **Developer Tools → Services**:

   ```yaml
   service: glasshopper.install_template
   data:
     url: <your private download URL>
   ```

3. **Settings → Devices → Add Integration → Glasshopper** and pick
   **Jarvis** as the template.

## License

Single seat: 49 €. Team (up to 5): 199 €. Lifetime + future updates: 299 €.

License is per HA install. Source is not distributed — the bundle ships as a
built artifact only.

## Support

- Bug reports: <https://github.com/colopisalvatore/glasshopper/issues> (tag with `template:jarvis`).
- Updates: announced on the [release page](https://jarvis.salvatorecolopi.com/releases).
- Feature requests: PRs not accepted (closed source), but issues are welcome.
