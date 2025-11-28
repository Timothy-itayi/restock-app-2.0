# Restock 2.0 — TestFlight Readiness Plan

## 0. Context Check
- **Architecture**: Expo-managed React Native app (prebuild) with native iOS project checked in, offline-first state via AsyncStorage + Zustand. Two Cloudflare Workers (`parse-doc`, `send-email`) provide OCR + email delivery.
- **Goal**: Ship a stable TestFlight build that exercises the entire Walk → Log → Send loop under real-world conditions before rolling to production.
- **Constraints**: Client-heavy, no user auth, camera-only ingestion, Resend + Groq credentials stored locally. Build artifacts must survive prebuild churn, and Workers need deterministic staged configs.

## 1. Release Scope & Success Criteria
| Area | Success Metric | Notes |
| --- | --- | --- |
| App stability | <1% crash rate during beta, no blocking native exceptions | Monitor via Xcode + Sentry |
| OCR accuracy | 95%+ of sampled items parsed correctly | Use curated photo set (handwritten + printed) |
| Email dispatch | 100% emails delivered with correct grouping/layout | Validate via Mailosaur or Resend logs |
| Offline resilience | No data loss or stuck sessions when toggling airplane mode | Include background termination cases |
| Store compliance | App Store metadata + icon set + privacy files pass App Review checks | Already added multi-size icons; verify privacy strings |

## 2. Environment & Config Readiness
1. **Versioning**: Increment `expo.version`, `ios.buildNumber`, and native `MARKETING_VERSION` in Xcode; document mapping.
2. **Secrets**: Create `.env.beta` with Groq + Resend keys scoped to staging accounts; wire through Expo config plugin or native plist.
3. **Feature Flags**: Add `BETA_CHANNEL` flag in Zustand stores to gate experimental UI (analytics banners, debug toasts).
4. **Data Reset**: Implement a hidden settings action to nuke AsyncStorage to unblock testers without reinstall.
5. **Permissions Copy**: Re-run `plutil` validation for camera/microphone usage strings; ensure `PrivacyInfo.xcprivacy` matches actual data collection.

## 3. Build Pipeline Hardening
1. **Deterministic Assets**: Lock `app.json` icon + splash definitions so future `expo prebuild` regenerates assets correctly.
2. **Native Sync Script**: Add `scripts/sync-ios.sh` that runs `expo prebuild --no-install`, applies patches (icons, entitlements), then `pod install`. Run before every release.
3. **CI Configuration**: Use GitHub Actions (macOS) or EAS Build:
   - `npm ci`
   - `npx expo prebuild --platform ios --clean`
   - `cd ios && RCT_NO_LAUNCH_PACKAGER=1 xcodebuild -workspace restock.xcworkspace -scheme restock -configuration Release -archivePath build/restock.xcarchive archive`
   - `xcodebuild -exportArchive ...` with distribution certs.
4. **Provisioning**: Refresh distribution certificates + profiles in App Store Connect, share via Apple Developer account + `fastlane match` or manual download.
5. **Artifacts**: Store `.ipa`, symbol files, and dSYM upload script for Sentry.

## 4. QA Strategy & Test Matrix
1. **Functional Smoke (Daily)**:
   - Onboarding, supplier CRUD, session creation, photo capture, parsing review, email send.
2. **Offline/Online Matrix**:
   - Capture while offline → sync.
   - Mid-upload drop.
   - Worker timeout / retry surfaces.
3. **Device Coverage**:
   - iPhone 12/13/14 physical, iPad mini for split-view behavior.
   - iOS 17.0, 17.4, 18 beta.
4. **Accessibility**:
   - Dynamic type, VoiceOver, reduced motion.
5. **Localization**:
   - Even if English-only, verify non-ASCII supplier names survive parsing/email.
6. **Regression Packs**:
   - AsyncStorage migrations, Zustand selectors, navigation deep links.
7. **Automation**:
   - Detox smoke suite for onboarding + session flow (parallelizable on CI).

## 5. Backend & Integration Verification
1. **Staging Workers**: Deploy beta-specific versions of `parse-doc` and `send-email` with rate limiting + logging enabled.
2. **Load Test**: Replay 100 sample documents through Groq endpoint; ensure cost + latency within budget (<4s).
3. **Email Rendering**: Snapshot HTML output across major clients (Gmail, Outlook, iOS Mail) using existing preview harness.
4. **Error Contracts**: Ensure Workers always return structured errors consumed by client to avoid toasts with raw JSON.
5. **Monitoring**: Enable Cloudflare Analytics + log push to R2/Sentry breadcrumbs for cross-correlation.

## 6. Observability & Crash Handling
1. Integrate Sentry (React Native + native) with release health and attach sourcemaps/dSYMs.
2. Add lightweight in-app diagnostics screen (tap gesture) showing build number, Worker status, last sync.
3. Instrument network failures with retry counters + breadcrumbs.
4. Capture performance spans around photo upload, Groq response, email send to baseline success path.

## 7. Security & Privacy Checklist
1. Verify no PII leaves device except via Resend payload (name/email). Mask logs.
2. Ensure HTTPS pinned endpoints (optional) or at least TLS validation.
3. Run MobSF static scan on release IPA.
4. Confirm App Privacy details in App Store Connect align with actual data flow (no tracking).

## 8. Deployment Procedure
1. Tag release branch `release/ios-testflight-<date>`.
2. Run CI build, notarize IPA, upload via `xcrun altool` or Transporter.
3. Create TestFlight group (internal + pilot retailers), attach release notes, link to feedback form.
4. Post-upload checklist: verify build processing, assign testers, send onboarding instructions.

## 9. Risk Register & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Groq latency spikes | Sessions block | Add exponential backoff + background processing |
| Resend outages | Emails stuck | Queue payload locally + retry, provide export CSV fallback |
| AsyncStorage corruption | Data loss | Nightly backup to JSON export + import flow |
| Expo prebuild drift | Build failures | Freeze Expo SDK version, document diff, add CI guard |
| Camera permission denial | Blocked onboarding | Detect early, show blocking modal with rationale |

## 10. Deliverables & Owners
- **Plan Owner**: Mobile lead (Jarvis) updates doc each release.
- **Due Diligence Checklist**: Convert sections into GitHub issue template for release readiness.
- **Beta Feedback Loop**: Create Linear project “TestFlight Beta 1” with SLA: severity-1 fix before next build, severity-2 within 72h, severity-3 in backlog grooming.

## 11. Timeline (Proposed)
1. **Week 1**: Config hardening, CI setup, observability instrumentation.
2. **Week 2**: QA matrix execution, Worker load test, accessibility fixes.
3. **Week 3**: Release branch cut, RC build, internal TestFlight (team).
4. **Week 4**: External pilot testers, feedback triage, prepare App Review submission.

> Keep this document living; update after each beta cycle with findings, crash stats, and checklist deltas.

