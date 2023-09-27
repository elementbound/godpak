# godpak

A dependency manager for Godot.

## Problem statement

Godot has a very useful and simple addon mechanism. Basically each project has
an *addons* directory where addons can be added. Installing an addon is as
simple as unpacking a zip or copying a directory to the right place. This has
spawned a really nice ecosystem around itself, with the likes of the [Godot
Asset Library] or the [Godot Asset Store].

While this works well for individual assets / plugins / scripts, this can have
its issues when *an addon wants to extend the functionality of another*. For
example, let's have an addon that wants to write logs, and instead of
implementing its own, it would like to use a [logger addon]. It would either
have to include the addon in its own assets, or instruct the user to install
that addon as well.

Both approaches can work for a single dependency, but for more complex
projects, neither approach is expected to scale.

The other issue is version management. Which version do we depend on? When and
how do we upgrade? How do we know if there's anything to upgrade? Managing all
these questions manually can be tedious.

These two cases are where a dependency manager can be useful.

[Godot Asset Library]: https://godotengine.org/asset-library/
[Godot Asset Store]: https://godotassetstore.org/
[logger addon]: https://godotengine.org/asset-library/asset?filter=logger&category=&godot_version=&cost=&sort=updated

## Considerations

* Adaptive system
  * Doesn't require self-hosting
  * Can gather packages from multiple places
* Fit into the Godot ecosystem
  * Parse existing plugin INI's
  * If possible, use a similar INI for dependency management
* Support existing addon distribution places
  * git ( and GitHub )
  * Godot Asset Library?
* Simple CLI interface

## The project file

At the center of a godpak-enabled project is a descriptor file, similar to
npm's `package.json`. Keeping similarity with Godot's addons, it's a cfg:

```
[dependencies]
godotenv=https://github.com/godotessentials/godotenv@master
logger=https://github.com/DawnGroveStudios/GodotLogger@master

[exports]
netfox
```

### Dependencies

Dependencies are parsed from the project file. Each dependency has an address
and a version specifier, e.g.:

```
https://github.com/godotessentials/godotenv@master

```

The two are separated by an `@` sign. The version may or may not be a semver,
with an optional `v` prefix. The address and version are handled by the
specific *adapter*.

### Git Adapter

Clones the repository and extracts the right addon from the addons folder. The
version can be any branch or tag that exists within the git repo.

Picks up any valid URL address as a fallback option.

### GitHub Adapter

Specific to dependencies downloaded from GitHub. The base behavior is the same
as the Git adapter, with potential for future specialization ( e.g. creating
instead of cloning the repo, downloading the release ).

Picks up any GitHub URL, with precedence over the Git adapter.

## Commands

### setup

Sets the project up as a godpak project by creating an empty project file.

```sh
gdpk setup

# Short form
gdpk s
```

### install

Ensures all dependencies are present in the project's `addons/` directory.

```sh
gdpk install

# Short form
gdpk i
```

### add

Adds a dependency to the project. Requires at least an address, optionally with
a version specifier and addon name:

```sh
# Add default addon as dependency with latest version
gdpk add https://github.com/DawnGroveStudios/GodotLogger

# Add default addon with speficif version
gdpk add https://github.com/DawnGroveStudios/GodotLogger@v1.0.8

# Add specific addon
gdpk add https://github.com/DawnGroveStudios/GodotLogger logger

# Add specific addon with specific version
gdpk add https://github.com/DawnGroveStudios/GodotLogger@v1.0.8 logger
```

#### Addon specification

A dependency may contain one or more addons. For a single addon, godpak can
assume that the dependency is that single addon. 

Howver, for multiple addon, godpak has no way to determine which one the
project depends on. In these cases, the addon itself must be specified. This
addon name will be used to pick the right entry from the dependency's `addons/`
directory.

### remove

Removes a dependency from the project, by updating the project file and removing its associated files. Takes the addon name as input.

```sh
gdpk remove logger

gdpk rm logger
```

> May also take the same params as `add` in the future, for easier use
