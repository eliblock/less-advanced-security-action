import * as core from '@actions/core'
import * as fs from 'fs'
import * as io from '@actions/io'
import * as path from 'path'

const keyDirectoryPath = path.join(process.env.RUNNER_TEMP || '/tmp')
const keyFileName = 'app_key.pem'
const keyFileFullPath = path.join(keyDirectoryPath, keyFileName)

interface LessAdvancedSecurityArgs {
  app_id: string
  install_id: string
  key_path: string
  sha: string
  repo: string
  pr: number
  sarif_path: string
  filter_annotations: boolean
}

export async function getArgs(): Promise<LessAdvancedSecurityArgs> {
  return {
    app_id: getArg('github_app_id'),
    install_id: getArg('github_app_install_id'),
    key_path: await getKeyPath(),
    sha: getSHA(),
    repo: getOwnerRepo(),
    pr: getPRNumber(),
    sarif_path: getSarifPath(),
    filter_annotations: core.getBooleanInput('filter_annotations')
  }
}

export function convertToCliArgs(args: LessAdvancedSecurityArgs): string[] {
  return [
    `--app_id=${args.app_id}`,
    `--install_id=${args.install_id}`,
    `--key_path=${args.key_path}`,

    `--repo=${args.repo}`,
    `--pr=${args.pr}`,
    `--sha=${args.sha}`,

    `--sarif_path=${args.sarif_path}`,
    `--filter_annotations=${args.filter_annotations}`
  ]
}

export async function cleanKey(): Promise<void> {
  await io.rmRF(keyFileFullPath)
}

function getArg(key: string): string {
  const arg = core.getInput(key)
  if (!arg) {
    throw new Error(`'${key}' not found in action input`)
  }
  return arg
}

async function getKeyPath(): Promise<string> {
  await io.mkdirP(keyDirectoryPath)

  core.debug(`Writing key to '${keyFileFullPath}'.`)
  await fs.promises.writeFile(keyFileFullPath, getArg('github_app_key'))

  return keyFileFullPath
}

function getPRNumber(): number {
  if (
    !process.env.GITHUB_EVENT_PATH ||
    !fs.existsSync(process.env.GITHUB_EVENT_PATH)
  ) {
    throw new Error('GITHUB_EVENT_PATH is null or the file does not exist')
  }
  const githubEvent = JSON.parse(
    fs.readFileSync(process.env.GITHUB_EVENT_PATH, {encoding: 'utf8'})
  )
  if (!githubEvent || !githubEvent.pull_request) {
    throw new Error(`github event was empty or had no pull request`)
  }

  core.debug(`Found PR number ${githubEvent.pull_request.number}'.`)
  return githubEvent.pull_request.number
}

function getSHA(): string {
  const sha = process.env.GITHUB_SHA
  if (!sha) {
    throw new Error('GITHUB_SHA is not set')
  }

  core.debug(`Found SHA ${sha}'.`)
  return sha
}

function getOwnerRepo(): string {
  const ownerRepo = process.env.GITHUB_REPOSITORY
  if (!ownerRepo) {
    throw new Error('GITHUB_REPOSITORY is not set')
  }

  core.debug(`Found repo number ${ownerRepo}'.`)
  return ownerRepo
}

function getSarifPath(): string {
  const sarifPath = getArg('sarif_path')
  if (!fs.existsSync(sarifPath)) {
    throw new Error(`"sarif_path" ${sarifPath} has no file`)
  }

  core.debug(`Found sarif path ${sarifPath} and confirmed some file is there.`)
  return sarifPath
}
