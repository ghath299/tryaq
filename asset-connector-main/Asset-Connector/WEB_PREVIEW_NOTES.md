# Web Preview Stability

- `expo:web` now runs with `EXPO_OFFLINE=1`.
- This prevents Expo CLI from remote dependency-version fetches that were failing in this environment with `TypeError: fetch failed`.
- Behavior of app features and APIs is unchanged; this only stabilizes startup in Web Preview environments with restricted/proxied outbound network.
