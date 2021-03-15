# Contributing

Contributions, in the form of issues (bug reports or feature ideas) and PRs are very welcome.

As usual, you should open an issue for discussion before making any large PR.

## Development Process

### Quick Start

1. Ensure you have Yarn installed.
2. After cloning the repository, run `yarn install` in the root of the repository.
3. Run `yarn build-watch` to build the `dist` dir and rebuild it on changes to source files.
4. (In another terminal) Run `yarn test-watch` to run Jest unit & integration tests and rerun them on changes to relevant files.
5. Make changes to source and or test files and wait for tests to pass or fail.

### Tips

You can also do one-off build with `yarn build` and a one-off test run with `yarn test-only`.

Unit tests depend directly on the source (in `./src/`)
while integration tests depend on the build (in `./dist/`),
so make sure the build is up-to-date when running the integration tests.

If your changes affect the composite service's console output, you will need to update test snapshots.
Do this by adding the `--updateSnapshot` flag (alias `-u`) to either `yarn test-watch` (e.g. `yarn test-watch -u`) or `yarn test-only` (e.g. `yarn test-only -u`).

The `yarn test` command will perform all checks that need to pass before merging.
In addition to `yarn build` & `yarn test-only`, this includes:
- `yarn lint` - Checks source code for mistakes using [ESLint](https://eslint.org/)

Automatically fix lint errors by running `yarn lint-fix`.
