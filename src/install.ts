import * as core from '@actions/core'
import * as os from 'os'
import * as path from 'path'
import * as tool_cache from '@actions/tool-cache'

const supportedPlatforms = ['darwin', 'linux']
const supportedArchs = ['arm', 'arm64', 'x64']

const lessAdvancedSecurityOwner = 'eliblock'
const lessAdvancedSecurityRepo = 'less-advanced-security'
const lessAdvancedSecurityBinary = lessAdvancedSecurityRepo

export function loadFromCache(version: string): string {
  const foundPath = tool_cache.find(lessAdvancedSecurityRepo, version)
  if (foundPath !== '') {
    core.debug(`Found directory in tool cache at '${foundPath}'`)
    return path.join(foundPath, lessAdvancedSecurityBinary)
  }

  return ''
}

export async function downloadAndUnpack(version: string): Promise<string> {
  const cachedPath = loadFromCache(version)
  if (cachedPath !== '') {
    return cachedPath
  }

  const platform = getPlatform()
  const arch = getArchitecture(platform)
  core.debug(`Detected platform '${platform}' and architecture '${arch}'.`)

  const lessAdvancedSecurityTag = `v${version}`
  core.debug(`Using version tag '${lessAdvancedSecurityTag}'.`)

  const url = `https://github.com/${lessAdvancedSecurityOwner}/${lessAdvancedSecurityRepo}/releases/download/${lessAdvancedSecurityTag}/${lessAdvancedSecurityBinary}_${version}_${platform}_${arch}.tar.gz`
  core.info(
    `Downloading and unpacking ${lessAdvancedSecurityBinary} from ${url}`
  )
  const binPath = await tool_cache.downloadTool(url)

  const cacheDirectory = process.env['RUNNER_TOOL_CACHE'] || ''
  if (cacheDirectory === '') {
    core.warning('Expected RUNNER_TOOL_CACHE to be defined')
  }

  const destination = path.join(
    cacheDirectory,
    lessAdvancedSecurityOwner,
    lessAdvancedSecurityRepo,
    lessAdvancedSecurityTag,
    `${platform}-${arch}`
  )

  core.debug(`Extracting ${binPath} into ${destination}`)
  const extractedFolder = await tool_cache.extractTar(binPath, destination)
  const cachedFolderPath = await tool_cache.cacheDir(
    extractedFolder,
    lessAdvancedSecurityRepo,
    version
  )

  const installedPath = path.join(cachedFolderPath, lessAdvancedSecurityBinary)
  core.info(`${lessAdvancedSecurityBinary} installed at ${installedPath}`)
  return installedPath
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
