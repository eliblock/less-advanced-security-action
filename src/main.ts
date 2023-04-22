import * as core from '@actions/core'
import * as exec from '@actions/exec'

import {cleanKey, convertToCliArgs, getArgs} from './args'
import {downloadAndUnpack} from './install'

const lessAdvancedSecurityVersion = '0.2.0'

async function run(): Promise<void> {
  try {
    const [args, toolLocation] = await Promise.all([
      getArgs(),
      downloadAndUnpack(lessAdvancedSecurityVersion)
    ])

    await exec.exec(toolLocation, ['--version'])
    await exec.exec(toolLocation, convertToCliArgs(args))

    await cleanKey()
  } catch (error) {
    await cleanKey()
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
