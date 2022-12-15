# alias-imports

Create [bare](https://2ality.com/2022/01/esm-specifiers.html#:~:text=same%20code%20base.-,bare%20specifiers,-are%20paths%20%28without) aliases in the [`imports` map](https://nodejs.org/api/packages.html#imports) in `package.json`.

### Features
- Supports both ESM `import` and CommonJS `require()`
- [Subpath patterns](https://nodejs.org/api/packages.html#subpath-patterns) support
- [Conditions](https://nodejs.org/api/packages.html#resolving-user-conditions) support
- Overwrite `import`/`require()`s in dependencies

<sub>Support this project by ⭐️ starring and sharing it. [Follow me](https://github.com/privatenumber) to see what other cool projects I'm working on! ❤️</sub>

## Usage

Declare aliases in the `imports` map in `package.json`:

```json5
{
    "imports": {
        // Aliases
        "lodash": "./custom-lodash.js"
    }
}
```

Then, run your script with the `alias-imports` loader:
```sh
node --loader alias-imports ./file.js
```

Whenever `lodash` is imported, `./custom-lodash.js` will be loaded.

### Subpath patterns
Like Node.js, `alias-imports` supports [subpath patterns](https://nodejs.org/api/packages.html#subpath-patterns).

With this configuration, all `lodash/*` imports will be aliased to `./custom-lodash/*`:

```json5
{
    "imports": {
        "lodash/*": "./custom-lodash/*"
    }
}
```


### Conditions
Like Node.js, `alias-imports` supports [conditions](https://nodejs.org/api/packages.html#resolving-user-conditions).

With this configuration, `lodash` will be aliased to `./custom-lodash.js` by default. But when `--conditions underscore` is passed in, it will resolve to `underscore` instead:

```json5
{
    "imports": {
        "lodash": {
            "underscore": "underscore",
            "default": "./custom-lodash.js"
        }
    }
}
```

Pass in a condition:
```sh
node --loader alias-imports --conditions underscore ./file.js
```

## Examples

### Toggle between Webpack 4 & 5

_package.json_
```json5
{
    // Setup imports to load webpack4 by default
    // and webpack 5 when the webpack5 condition is specified
    "imports": {
        "webpack": {
            "webpack5": "webpack5",
            "default": "webpack4"
        },

        // This entry maps webpack subpaths to webpack4 or webpack5
        "webpack/*": {
            "webpack5": "webpack5/*",
            "default": "webpack4/*"
        }
    },

    // Install Webpack 4 & 5 to webpack4 & webpack5 respectively
    "devDependencies": {
        "webpack4": "npm:webpack@4.42.0",
        "webpack5": "npm:webpack@5.10.1"
    }
}
```

#### Load Webpack 4 (default)
```sh
node --loader alias-imports ./file.js
```

#### Load Webpack 5
Specify the `webpack5` condition via the [`--conditions, -C` flag](https://nodejs.org/api/cli.html#-ccondition---conditionscondition).
```sh
node --loader alias-imports -C webpack5 ./file.js
```

## API

### Loader

Pass in `alias-import/loader` to `--loader` to load the import hook. This will only add alias support to ESM `import`s.


```sh
node --loader alias-imports/loader ./file.js
```

### Require hook

Pass in `alias-import/require` to `--require` to load the require hook. This will only add alias support to `require()` calls.

```sh
node --require alias-import/require ./file.js
```

### Both

Passing in `alias-imports` loads both the loader and the require hook:

```sh
node --loader alias-imports ./file.js
```

### Debugging
Set the `DEBUG_ALIAS_IMPORTS` environment variable to see which `imports` aliases are being resolved by whom.

```sh
DEBUG_ALIAS_IMPORTS=1 node --loader alias-imports ./file.js
```

## Dependencies

### [resolve-pkg-maps](https://github.com/privatenumber/resolve-pkg-maps)
Used to resolve `imports` in `package.json`.


## FAQ

### How is it different from native `imports`?

- Native aliases in `imports` must be prefixed with `#`, whereas aliases with `alias-imports` don't.

- Because this loader allows you to create unprefixed aliases, they can be used to overwrite import paths (e.g. `lodash` can point to `underscore`).

- Affects dependency packages as well, not just the current package

### When should I use this instead of native `imports`?
In general, you should use native `imports` when possible. If you're creating a new alias, prefer to use the `#` prefix.

However, if you're trying to overwrite an import path in a dependency package (e.g. `lodash` to `underscore`), you can use this package to achieve that.

### Can I use this in published packages?

Published packages _should not_ use this because it relies on the consumer to start the Node.js process with the `alias-imports` loader.

However, it can be used in application codebases to overwrite import paths in dependencies.
