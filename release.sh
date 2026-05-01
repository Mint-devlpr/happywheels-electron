#!/usr/bin/env bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./release.sh <version>  (e.g. ./release.sh 1.0.1)"
  exit 1
fi

echo "==> Building Linux (deb + AppImage)..."
npm run dist:linux

echo "==> Building Windows (portable exe)..."
npm run dist:win

echo "==> Committing and tagging v$VERSION..."
git add -A
git commit -m "Release v$VERSION" || echo "Nothing new to commit"
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "==> Creating GitHub release and uploading builds..."
gh release create "v$VERSION" \
  --title "Happy Wheels v$VERSION" \
  --notes "Release v$VERSION" \
  dist/*.exe \
  dist/*.AppImage \
  dist/*.deb

echo "==> Done! macOS build will appear on the release once GitHub Actions finishes."
