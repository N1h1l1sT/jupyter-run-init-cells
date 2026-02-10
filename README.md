# run_init_cells

[![Github Actions Status](https://github.com/N1h1l1sT/jupyter-run-init-cells/workflows/Build/badge.svg)](https://github.com/N1h1l1sT/jupyter-run-init-cells/actions/workflows/build.yml)

Run all cells marked as 'init' with 1 click

## Requirements

- JupyterLab >= 4.5.0

## Install

To install the extension, execute:

```bash
pip install run_init_cells
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall run_init_cells
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the run_init_cells directory

# Set up a virtual environment and install package in development mode
python -m venv .venv
source .venv/bin/activate
pip install --editable "."

# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite

# Rebuild extension Typescript source after making changes
# IMPORTANT: Unlike the steps above which are performed only once, do this step
# every time you make a change.
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall run_init_cells
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `run-init-cells` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
