<h2 align="center">🧹 Prettify Action ✨</h2>

<p align="center">
  <a href="https://github.com/TAKANOME-DEV/prettify-action">
    <img alt="Licence Badge" src="https://img.shields.io/github/license/TAKANOME-DEV/prettify-action?color=%2330C151" />
  </a>
  <a href="https://github.com/TAKANOME-DEV/prettify-action">
    <img alt="Licence Badge" src="https://img.shields.io/github/release/TAKANOME-DEV/prettify-action?color=%2330C151">
  </a>
</p>

---

:robot: A GitHub action that suggests formatting changes with Prettier on pull requests, making it easier to maintain consistent code style sparkles and readability :sparkles: :rocket:

The initial idea for this action was taken from [JoshuaKGoldberg/template-typescript-node-package](https://github.com/JoshuaKGoldberg/template-typescript-node-package/issues/139) opened by @JoshuaKGoldberg. We wanted to make it easier for non-coding contributors to contribute to open source projects, and we thought that this would be a great way to do it.

## :construction: Status

This action is currently _early_ in the development cycle. This action is not yet functional but is being actively developed. Please "watch" the project and leave a star and help us build this action.
We welcome contributions of all sizes, from small bug fixes to new features, ideas, and suggestions.

## :bulb: Motivation

This GitHub action was created to streamline the contribution process for non-coding contributors. We understand that running formatting checks and pushing changes can be tedious, and we want to make it easier for everyone to contribute to open source projects. By using this action, contributors can focus on the content of their contributions, while we take care of the formatting. With automatic suggestions for Prettier formatting changes, we can help maintain consistent code style and readability, without adding extra work for contributors.

## :rocket: Usage

### :zap: Quick Start

1. Create a new workflow file in your repository at `.github/workflows/prettify.yml` with the following contents:

```yaml
name: Prettify Action

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  prettify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          ref: ${{ github.event.pull_request.head.ref }}
          repository: ${{ github.event.pull_request.head.repo.full_name }}
          fetch-depth: 0

      - name: Prettify
        uses: takanome-dev/prettify-action@beta
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## ⚖️ License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
