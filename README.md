# Less Advanced Security (Action)

A GitHub action to download and run [`less-advanced-security`](https://github.com/eliblock/less-advanced-security): bring-your-own PR annotations to any tool which outputs sarif.

## Usage

### Setup

1. Follow the setup steps from [`less-advanced-security`](https://github.com/eliblock/less-advanced-security#setup) capturing the app id, install id, and app key.
1. Add the app id, install id, and app key as secrets in the repo being configured. Additionally, store these in a secure place for later use with other repos.
1. Create a GitHub Workflow which:
   - runs a linting tool of your choosing, outputting the results to a known place on disk in `sarif` format
   - uses `less-advanced-security-action`, configured as shown below

### Sample Workflow

```yml
name: semgrep
on:
  workflow_dispatch: ~
  pull_request: ~
permissions:
  contents: read

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: mkdir -p tmp
      - name: 🔎 scan repo
        uses: docker://returntocorp/semgrep:0.121.0 # update as needed
        with:
          entrypoint: semgrep
          args: --sarif --output tmp/sarif.json
      - uses: eliblock/less-advanced-security-action@v0.1.0 # update as needed
        with:
          github_app_id: ${{ secrets.APP_ID }}
          github_app_install_id: ${{ secrets.APP_INSTALL_ID }}
          github_app_key: ${{ secrets.APP_KEY }}
          sarif_path: tmp/sarif.json
```

### Configurations

##### `github_app_id`

**Required**. String. App id from [`less-advanced-security`](https://github.com/eliblock/less-advanced-security#setup) setup.

##### `github_app_install_id`

**Required**. String. Install id from [`less-advanced-security`](https://github.com/eliblock/less-advanced-security#setup) setup.

##### `github_app_key`

**Required**. String. App key from [`less-advanced-security`](https://github.com/eliblock/less-advanced-security#setup) setup.

##### `sarif_path`

**Required**. String. Path to your sarif file.

##### `filter_annotations`

_Optional_, defaulting to `true`. Boolean. Whether or not annotations should be filtered to the `patch` in the PR being analyzed.

##### `filter_annotations`

_Optional_, defaulting to the tool driver name found in the sarif. String. Overrides the name of the check. Use this if you run the same tool multiple times on a PR (and need the checks to not collide).

## Development

### Environment

```sh
nvm use
npm install
```

### Package

```sh
npm build && npm package
```
