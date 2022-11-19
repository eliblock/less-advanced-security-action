import * as cache from '@actions/cache'
import * as core from '@actions/core'
import * as os from 'os'
import * as path from 'path'
import * as tool_cache from '@actions/tool-cache'

const supportedPlatforms = ['darwin', 'linux']
const supportedArchs = ['arm', 'arm64', 'x64']

const lessAdvancedSecurityOwner = 'eliblock'
const lessAdvancedSecurityRepo = 'less-advanced-security'
const lessAdvancedSecurityBinary = lessAdvancedSecurityRepo

export function downloadDirectory(
  tag: string,
  platform: string,
  arch: string
): string {
  const cacheDirectory = process.env['RUNNER_TOOL_CACHE'] || ''
  if (cacheDirectory === '') {
    core.warning('Expected RUNNER_TOOL_CACHE to be defined')
  }
  return path.join(
    cacheDirectory,
    lessAdvancedSecurityOwner,
    lessAdvancedSecurityRepo,
    tag,
    `${platform}-${arch}`
  )
}

export async function saveCache(
  executablePath: string,
  tag: string
): Promise<undefined> {
  const key = cacheKey(tag)
  const cacheId = await cache.saveCache([executablePath], key)
  if (cacheId !== -1) {
    core.info(`saved '${executablePath}' to cache with key '${key}'`)
    return
  }
  core.warning(`failed to save '${executablePath}' to cache with key '${key}'`)
  return
}

export async function restoreCache(
  executablePath: string,
  tag: string
): Promise<Boolean> {
  const key = cacheKey(tag)
  const foundKey = await cache.restoreCache([executablePath], key)
  if (foundKey) {
    core.info(`loaded ${executablePath} from cache with key ${foundKey}`)
    return true
  }
  core.debug(`did not find ${executablePath} in cache with key ${key}`)
  return false
}

export function cacheKey(tag: string): string {
  return `${lessAdvancedSecurityRepo}-${tag}`
}

export async function downloadAndUnpack(version: string): Promise<string> {
  const platform = getPlatform()
  const arch = getArchitecture(platform)
  core.debug(`Detected platform '${platform}' and architecture '${arch}'.`)

  const lessAdvancedSecurityTag = `v${version}`
  core.debug(`Using version tag '${lessAdvancedSecurityTag}'.`)

  const destination = downloadDirectory(lessAdvancedSecurityTag, platform, arch)
  const executablePath = path.join(destination, lessAdvancedSecurityBinary)

  // Attempt to load from the cache
  const found = await restoreCache(executablePath, lessAdvancedSecurityTag)
  if (found) {
    core.info(
      `${lessAdvancedSecurityBinary} found in cache and restored to ${executablePath}`
    )
    core.addPath(destination)
    return executablePath
  }

  // Download
  core.debug(
    `${lessAdvancedSecurityBinary} not found in cache. Downloading instead.`
  )
  const url = `https://github.com/${lessAdvancedSecurityOwner}/${lessAdvancedSecurityRepo}/releases/download/${lessAdvancedSecurityTag}/${lessAdvancedSecurityBinary}_${version}_${platform}_${arch}.tar.gz`
  core.info(
    `Downloading and unpacking ${lessAdvancedSecurityBinary} from ${url}`
  )
  const binPath = await tool_cache.downloadTool(url)

  // Unpack
  core.debug(`Extracting ${binPath} into ${destination}`)
  await tool_cache.extractTar(binPath, destination)

  // Cache
  core.debug(`Attempting to save ${executablePath} to the cache`)
  await saveCache(executablePath, lessAdvancedSecurityTag)

  // Return
  core.addPath(destination)
  core.info(`${lessAdvancedSecurityBinary} installed at ${executablePath}`)
  return executablePath
}

function getPlatform(): NodeJS.Platform {
  const platform = os.platform()
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(
      `Platform '${platform}' is not supported. Supported platforms are ${supportedPlatforms
        .map(p => `'${p}'`)
        .join(', ')}`
    )
  }
  return platform
}

function getArchitecture(platform: NodeJS.Platform): string {
  let arch = os.arch()
  if (!supportedArchs.includes(arch)) {
    throw new Error(
      `Architecture '${arch}' is not supported. Supported architectures are ${supportedArchs
        .map(p => `'${p}'`)
        .join(', ')}`
    )
  }

  switch (arch) {
    case 'arm':
      arch = 'arm64'
      break
    case 'x64':
      arch = 'amd64'
      break
  }

  if (platform === 'darwin') {
    arch = 'all'
  }
  return arch
}
