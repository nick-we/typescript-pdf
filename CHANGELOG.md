# 1.0.0 (2025-08-05)


### Bug Fixes

* ajdust release.yml with the same fix as it was done for ci.yml ([8900749](https://github.com/nick-we/typescript-pdf/commit/890074997708a0178b6a40fd712e2170a0ac8eec))
* correct centering of text in containers (with alignment.center) and container background color is fixed ([28c5fba](https://github.com/nick-we/typescript-pdf/commit/28c5fbab8b4c0c0e5c0cabb84cd067cc2f5e2418))
* Eliminated cache: pnpm from all setup-node@v4 actions ([398e004](https://github.com/nick-we/typescript-pdf/commit/398e0044e92e7323531d23093f9bf995db7149ab))
* fixed columns reversed ordering for its chilren and migrated to Flutters coordinate system (only in the rendering the pdf coordinate system will be used) ([3c2f3bb](https://github.com/nick-we/typescript-pdf/commit/3c2f3bbc6d69514e52a48b76a9c7523f202c27ea))
* fixed compatibility issues with the macos pdf viewer ([00b0816](https://github.com/nick-we/typescript-pdf/commit/00b0816c07c8aa95c71701108c029d1da603a0c6))
* prevent npm publish ([0c48ab7](https://github.com/nick-we/typescript-pdf/commit/0c48ab7a05c73f3b42f860f52090017e1a75f96c))
* resolve CI workflow failures ([9ccbdb5](https://github.com/nick-we/typescript-pdf/commit/9ccbdb5a778db1f27bdea65a5a9b2963a013b0b6))
* resolved type issues + some cleanups + bumped npm version to 0.3.0 ([e01ce9c](https://github.com/nick-we/typescript-pdf/commit/e01ce9c5e0e8f4b77f7cb5d75810b2962ff3f965))
* small import fixes ([9390e6e](https://github.com/nick-we/typescript-pdf/commit/9390e6e564410c7bbe3af596585dd69e4e802bc3))
* some more adjustments to ci.yml ([eeffeb0](https://github.com/nick-we/typescript-pdf/commit/eeffeb01d41d14c9f6af8f42209a0ee3a3ee5ca4))
* **table:** resolve text rendering issues and standardize Matrix4 API ([61f19be](https://github.com/nick-we/typescript-pdf/commit/61f19bed5360a3375bb41567f64ef53575b1ff8b))


### Features

* added table widget + improving internal code of text styling ([253a6ec](https://github.com/nick-we/typescript-pdf/commit/253a6ecc549fa27a5062ccdba7de0e85878bc70c))
* Advanced Text Rendering ([a05d575](https://github.com/nick-we/typescript-pdf/commit/a05d57575ec70ac1ecfc10e8f3dfff72a0a9c865))
* extensive typography and font system ([a6275e9](https://github.com/nick-we/typescript-pdf/commit/a6275e9f06f787781bcecee8cef96ca68c6d6199))
* Layout Engine & Essential Widgets (done) ([a9d1149](https://github.com/nick-we/typescript-pdf/commit/a9d1149c0cda11eb6c1aebf5cb050d39ee2cbf13))
* support theming ([17aac31](https://github.com/nick-we/typescript-pdf/commit/17aac310e896270213af9012d21999758ce9fb21))
