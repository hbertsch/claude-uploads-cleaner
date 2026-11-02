# Maintainer guide

This is the checklist for the owner of the repository. The first store submissions are done by hand. The release workflow only uploads later versions, and only after you approve. This file never contains secret values. Keep them in your password manager or in the GitHub settings.

## 1. Firefox (addons.mozilla.org)

1. Create a developer account at https://addons.mozilla.org/developers/.
2. Build the zips: `npm ci && npm run build`. The Firefox package is `dist/uploads-cleaner-<version>-firefox.zip`.
3. In the developer hub choose "Submit a New Add-on" and "On this site" (listed). Upload the Firefox zip.
4. Fill in the listing from [store/firefox.md](../store/firefox.md) (name, summary, description, categories, support address) and add the screenshots from `store/screenshots/`.
5. When the form asks about data collection, answer that the extension collects no data. The add-on id is `uploads-cleaner@henningbertsch.com` (set in the Firefox manifest by the build). It is the value for the repository variable `ADDON_GUID`.
6. Create the API credentials at https://addons.mozilla.org/developers/addon/api/key/. You get a JWT issuer and a JWT secret. Copy the secret at once, it is shown only one time.

## 2. Microsoft Edge (Partner Center)

1. Create a developer account in the Microsoft Partner Center and register for the Edge program (https://partner.microsoft.com/dashboard/microsoftedge/overview).
2. Create a new extension and upload the Chrome zip (`dist/uploads-cleaner-<version>-chrome.zip`). It is the same package for Chrome, Brave and Edge.
3. Fill in the listing from [store/edge.md](../store/edge.md) and add the screenshots from `store/screenshots/`.
4. In "Publish API" create the API credentials. You get a Client ID and an API key. The Product ID is shown in the product's overview.

## 3. GitHub secrets, variables and environment

Run these in the repository folder, logged in with `gh` as the owner. `gh secret set` asks for the value, so it does not end up in your shell history.

```
gh secret set AMO_JWT_ISSUER
gh secret set AMO_JWT_SECRET
gh secret set EDGE_API_KEY
gh secret set EDGE_CLIENT_ID

gh variable set ADDON_GUID --body "uploads-cleaner@henningbertsch.com"
gh variable set EDGE_PRODUCT_ID --body "<product id from Partner Center>"
gh variable set EDGE_UPLOAD_ONLY --body "true"
gh variable set PUBLISH_FIREFOX --body "true"
gh variable set PUBLISH_EDGE --body "true"
```

- `EDGE_UPLOAD_ONLY=true` makes the Edge job upload the package without submitting it. Use it for the first run, check the draft in Partner Center, then set it to `false`.
- `PUBLISH_FIREFOX` and `PUBLISH_EDGE` switch the store jobs on. Without them a release only creates the GitHub release.
- Create the environment `store-publish` under Settings > Environments, add yourself as required reviewer. Both store jobs run in this environment, so nothing is uploaded without your approval.

## 4. How a release flows

1. Update the version in `package.json` and `src/manifest.json`, and put the changelog entries under the new version in `CHANGELOG.md`, with the release date in the heading.
2. Run the checks from [CONTRIBUTING.md](../CONTRIBUTING.md).
3. Tag the commit `v<version>` and push the tag.
4. The release workflow (`.github/workflows/release.yml`) checks that the tag matches the version, builds both zips, runs the tests and writes `SHA256SUMS.txt`. It then creates the GitHub release with both zips, the checksums and the changelog section as notes.
5. If `PUBLISH_FIREFOX` or `PUBLISH_EDGE` is `true`, GitHub waits for your approval in the `store-publish` environment, then uploads the Firefox zip to addons.mozilla.org and the Chrome zip to Microsoft Edge Add-ons. A store job needs a listing that you created by hand with the first version (sections 1 and 2).
6. Chrome Web Store is not part of the pipeline. Chrome, Brave and Edge users can load the Chrome zip from the release as described in the README.

To test the build without a release, start the workflow by hand: Actions > Release > Run workflow, with "dry-run" ticked. It builds and tests and keeps the zips as a workflow artifact, but creates no release and uploads nothing to a store.
