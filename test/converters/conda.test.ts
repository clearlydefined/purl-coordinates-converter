// (c) Copyright 2026, SAP SE and ClearlyDefined contributors. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { PackageURL } from 'packageurl-js'
import { converter, toCoordinates, toPurl } from '../../src/converters/conda.ts'
import type { ConverterModule } from '../../src/types.ts'

describe('conda converter', () => {
  describe('toCoordinates', () => {
    it('converts conda purl with channel=main to anaconda-main', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/absl-py@0.4.1?build=py36h06a4308_0&channel=main&subdir=linux-64'
      )
      const c = await toCoordinates(p)
      assert.deepStrictEqual(c, {
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'linux-64',
        name: 'absl-py',
        revision: '0.4.1-py36h06a4308_0'
      })
    })

    it('converts conda purl with channel=r to anaconda-r', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/r-base@4.3.1?build=h2b0e59c_6&channel=r&subdir=linux-64'
      )
      const c = await toCoordinates(p)
      assert.deepStrictEqual(c, {
        type: 'conda',
        provider: 'anaconda-r',
        namespace: 'linux-64',
        name: 'r-base',
        revision: '4.3.1-h2b0e59c_6'
      })
    })

    it('converts conda purl with channel=conda-forge to conda-forge', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/numpy@1.16.6?build=py36hdc1b780_0&channel=conda-forge&subdir=linux-aarch64'
      )
      const c = await toCoordinates(p)
      assert.deepStrictEqual(c, {
        type: 'conda',
        provider: 'conda-forge',
        namespace: 'linux-aarch64',
        name: 'numpy',
        revision: '1.16.6-py36hdc1b780_0'
      })
    })

    it('converts conda purl with noarch subdir', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/six@1.16.0?build=pyhd3eb1b0_0&channel=main&subdir=noarch'
      )
      const c = await toCoordinates(p)
      assert.deepStrictEqual(c, {
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'noarch',
        name: 'six',
        revision: '1.16.0-pyhd3eb1b0_0'
      })
    })

    it('converts conda purl without build qualifier (version only revision)', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/six@1.16.0?channel=main&subdir=noarch'
      )
      const c = await toCoordinates(p)
      assert.deepStrictEqual(c, {
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'noarch',
        name: 'six',
        revision: '1.16.0'
      })
    })

    it('converts conda purl without version (undefined revision)', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/six?channel=main&subdir=noarch'
      )
      const c = await toCoordinates(p)
      assert.deepStrictEqual(c, {
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'noarch',
        name: 'six',
        revision: undefined
      })
    })

    it('throws when channel qualifier is absent', async () => {
      const p = PackageURL.fromString('pkg:conda/absl-py@0.4.1?subdir=linux-64')
      await assert.rejects(toCoordinates(p), /channel/i)
    })

    it('throws when channel qualifier is unrecognised', async () => {
      const p = PackageURL.fromString('pkg:conda/absl-py@0.4.1?channel=unknown&subdir=linux-64')
      await assert.rejects(toCoordinates(p), /channel/i)
    })

    it('throws when subdir qualifier is absent', async () => {
      const p = PackageURL.fromString('pkg:conda/absl-py@0.4.1?channel=main')
      await assert.rejects(toCoordinates(p), /subdir/i)
    })

    it('throws when type qualifier is present', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/absl-py@0.4.1?build=py36h06a4308_0&channel=main&subdir=linux-64&type=tar.bz2'
      )
      await assert.rejects(toCoordinates(p), /type/i)
    })

    it('throws when unknown qualifier is present', async () => {
      const p = PackageURL.fromString(
        'pkg:conda/absl-py@0.4.1?channel=main&subdir=linux-64&foo=bar'
      )
      await assert.rejects(toCoordinates(p), /qualifier/i)
    })
  })

  describe('toPurl', () => {
    it('converts anaconda-main coordinates to purl with channel=main', () => {
      const purl = toPurl({
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'linux-64',
        name: 'absl-py',
        revision: '0.4.1-py36h06a4308_0'
      })
      assert.strictEqual(
        purl.toString(),
        'pkg:conda/absl-py@0.4.1?build=py36h06a4308_0&channel=main&subdir=linux-64'
      )
    })

    it('converts anaconda-r coordinates to purl with channel=r', () => {
      const purl = toPurl({
        type: 'conda',
        provider: 'anaconda-r',
        namespace: 'linux-64',
        name: 'r-base',
        revision: '4.3.1-h2b0e59c_6'
      })
      assert.strictEqual(
        purl.toString(),
        'pkg:conda/r-base@4.3.1?build=h2b0e59c_6&channel=r&subdir=linux-64'
      )
    })

    it('converts conda-forge coordinates to purl with channel=conda-forge', () => {
      const purl = toPurl({
        type: 'conda',
        provider: 'conda-forge',
        namespace: 'linux-aarch64',
        name: 'numpy',
        revision: '1.16.6-py36hdc1b780_0'
      })
      assert.strictEqual(
        purl.toString(),
        'pkg:conda/numpy@1.16.6?build=py36hdc1b780_0&channel=conda-forge&subdir=linux-aarch64'
      )
    })

    it('converts coordinates with version-only revision (no build)', () => {
      const purl = toPurl({
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'noarch',
        name: 'six',
        revision: '1.16.0'
      })
      assert.strictEqual(
        purl.toString(),
        'pkg:conda/six@1.16.0?channel=main&subdir=noarch'
      )
    })

    it('converts coordinates with undefined revision', () => {
      const purl = toPurl({
        type: 'conda',
        provider: 'anaconda-main',
        namespace: 'noarch',
        name: 'six',
        revision: undefined
      })
      assert.strictEqual(
        purl.toString(),
        'pkg:conda/six?channel=main&subdir=noarch'
      )
    })

    it('handles build string containing hyphens correctly (split on first hyphen only)', () => {
      // revision: '0.1-conda_forge' → version='0.1', build='conda_forge'
      const purl = toPurl({
        type: 'conda',
        provider: 'conda-forge',
        namespace: 'linux-64',
        name: '_libgcc_mutex',
        revision: '0.1-conda_forge'
      })
      assert.strictEqual(
        purl.toString(),
        'pkg:conda/_libgcc_mutex@0.1?build=conda_forge&channel=conda-forge&subdir=linux-64'
      )
    })
  })
})

describe('conda converter module', () => {
  it('implements ConverterModule interface', () => {
    const m: ConverterModule = converter
    assert.deepStrictEqual(m.supportedPurlTypes, ['conda'])
    assert.deepStrictEqual(m.supportedTypeProviderPairs, [
      'conda:anaconda-main',
      'conda:anaconda-r',
      'conda:conda-forge'
    ])
    assert.strictEqual(typeof m.toCoordinates, 'function')
    assert.strictEqual(typeof m.toPurl, 'function')
  })
})
