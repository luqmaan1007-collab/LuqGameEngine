# ELG plugin package format

An `.elg` package is UTF-8 JSON with the following top-level fields:

- `format`: fixed value `ELG/1`
- `id`: reverse-domain plugin identifier
- `name`, `version`, optional `description`
- `entrypoint`: path to the plugin's declared entry file
- `permissions`: explicit capabilities requested by the package
- `files`: map of relative paths to UTF-8 source strings

Current permissions are `project.read`, `project.write`, `scene.read`, `scene.write`, `assets.read`, `assets.write`, and `ui.notify`.

The current editor can import and validate package metadata and requested permissions. It does not execute plugin code yet. Future execution must use a sandboxed capability API, user approval, signature checks and an undoable project API; do not load ELG entrypoints with `eval` or unrestricted dynamic imports.
