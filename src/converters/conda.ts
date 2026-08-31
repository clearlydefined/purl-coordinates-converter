// (c) Copyright 2026, SAP SE and ClearlyDefined contributors. Licensed under the MIT license.
// SPDX-License-Identifier: MIT

import { PackageURL } from 'packageurl-js'
import type { ConverterModule, CoordinatesProvider, CoordinatesSpec } from '../types.ts'

const supportedPurlTypes = ['conda']
const supportedTypeProviderPairs = ['conda:anaconda-main', 'conda:anaconda-r', 'conda:conda-forge']

const CHANNEL_TO_PROVIDER: Record<string, CoordinatesProvider> = {
  main: 'anaconda-main',
  r: 'anaconda-r',
  'conda-forge': 'conda-forge'
}

const PROVIDER_TO_CHANNEL: Record<string, string> = {
  'anaconda-main': 'main',
  'anaconda-r': 'r',
  'conda-forge': 'conda-forge'
}

const ALLOWED_QUALIFIERS = new Set(['build', 'channel', 'subdir', 'type'])

export async function toCoordinates(p: PackageURL): Promise<CoordinatesSpec> {
  const qualifierKeys = p.qualifiers ? Object.keys(p.qualifiers) : []
  const unknown = qualifierKeys.filter(k => !ALLOWED_QUALIFIERS.has(k))
  if (unknown.length > 0) throw new Error(`Unsupported PURL qualifiers for type conda: ${unknown.join(', ')}`)

  if (p.qualifiers && 'type' in p.qualifiers)
    throw new Error(`Qualifier "type" is not supported for conda coordinates (reserved for future condasrc)`)

  const channel = p.qualifiers && 'channel' in p.qualifiers ? p.qualifiers.channel : undefined
  if (!channel) throw new Error(`conda PURL requires a channel qualifier: ${p.toString()}`)
  const provider = CHANNEL_TO_PROVIDER[channel]
  if (!provider) throw new Error(`Unsupported channel qualifier "${channel}": must be main, r, or conda-forge`)

  const subdir = p.qualifiers && 'subdir' in p.qualifiers ? p.qualifiers.subdir : undefined
  if (!subdir) throw new Error(`conda PURL requires a subdir qualifier: ${p.toString()}`)

  const build = p.qualifiers && 'build' in p.qualifiers ? p.qualifiers.build : undefined
  const revision = p.version ? (build ? `${p.version}-${build}` : p.version) : undefined

  return { type: 'conda', provider, namespace: subdir, name: p.name, revision }
}

export function toPurl(c: CoordinatesSpec): PackageURL {
  const channel = PROVIDER_TO_CHANNEL[c.provider as string]
  if (!channel) throw new Error(`Unsupported provider for conda toPurl: ${c.provider}`)
  const qualifiers: Record<string, string> = { channel, subdir: c.namespace }

  if (c.revision) {
    const dashIndex = c.revision.indexOf('-')
    if (dashIndex !== -1) {
      const version = c.revision.slice(0, dashIndex)
      const build = c.revision.slice(dashIndex + 1)
      if (build) qualifiers.build = build
      return new PackageURL('conda', null, c.name, version, qualifiers, null)
    }
    return new PackageURL('conda', null, c.name, c.revision, qualifiers, null)
  }

  return new PackageURL('conda', null, c.name, undefined, qualifiers, null)
}

export const converter: ConverterModule = {
  supportedPurlTypes,
  supportedTypeProviderPairs,
  toCoordinates,
  toPurl
}
