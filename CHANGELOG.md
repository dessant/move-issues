# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="0.6.1"></a>
## [0.6.1](https://github.com/dessant/move-issues/compare/v0.6.0...v0.6.1) (2018-10-03)


### Bug Fixes

* allow newer versions of node ([58da18b](https://github.com/dessant/move-issues/commit/58da18b))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/dessant/move-issues/compare/v0.5.0...v0.6.0) (2018-09-19)


### Features

* move labels that also exist on the target repository ([cb979f6](https://github.com/dessant/move-issues/commit/cb979f6)), closes [#5](https://github.com/dessant/move-issues/issues/5)


### BREAKING CHANGES

* labels are also applied for the target issue



<a name="0.5.0"></a>
# [0.5.0](https://github.com/dessant/move-issues/compare/v0.4.0...v0.5.0) (2018-07-23)


### Features

* notify maintainers about configuration errors ([ac5ab41](https://github.com/dessant/move-issues/commit/ac5ab41))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/dessant/move-issues/compare/v0.3.4...v0.4.0) (2018-06-29)


### Bug Fixes

* also check owner when determining if source and target are the same ([07912e5](https://github.com/dessant/move-issues/commit/07912e5))
* avoid fetching config for ignored events ([1f88e2b](https://github.com/dessant/move-issues/commit/1f88e2b))
* explicitly link issues ([94e13ca](https://github.com/dessant/move-issues/commit/94e13ca)), closes [#6](https://github.com/dessant/move-issues/issues/6)
* move issues between private repositories ([b63f555](https://github.com/dessant/move-issues/commit/b63f555))
* pass more info to logger ([728b525](https://github.com/dessant/move-issues/commit/728b525))


### Features

* extend settings from a different repository ([103963d](https://github.com/dessant/move-issues/commit/103963d))
* mention teams in issue content ([1d316e1](https://github.com/dessant/move-issues/commit/1d316e1))


### BREAKING CHANGES

* team mentions need read access to Organization members
* read-only access to repo metadata is required for
moving issues between private repositories



<a name="0.3.4"></a>
## [0.3.4](https://github.com/dessant/move-issues/compare/v0.3.3...v0.3.4) (2018-06-06)


### Bug Fixes

* correct variable name ([30a93b8](https://github.com/dessant/move-issues/commit/30a93b8))



<a name="0.3.3"></a>
## [0.3.3](https://github.com/dessant/move-issues/compare/v0.3.2...v0.3.3) (2018-06-06)


### Bug Fixes

* relax target repo access restrictions ([2a48466](https://github.com/dessant/move-issues/commit/2a48466)), closes [#3](https://github.com/dessant/move-issues/issues/3)



<a name="0.3.2"></a>
## [0.3.2](https://github.com/dessant/move-issues/compare/v0.3.1...v0.3.2) (2018-06-01)


### Bug Fixes

* explicitly set main module path ([57bb2b6](https://github.com/dessant/move-issues/commit/57bb2b6))



<a name="0.3.1"></a>
## [0.3.1](https://github.com/dessant/move-issues/compare/v0.3.0...v0.3.1) (2018-05-29)


### Bug Fixes

* expose src/index.js to enable bundled deployment ([#2](https://github.com/dessant/move-issues/issues/2)) ([b1a9dd1](https://github.com/dessant/move-issues/commit/b1a9dd1))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/dessant/move-issues/compare/v0.2.1...v0.3.0) (2018-05-06)


### Features

* validate config options ([a878c13](https://github.com/dessant/move-issues/commit/a878c13))



<a name="0.2.1"></a>
## [0.2.1](https://github.com/dessant/move-issues/compare/v0.2.0...v0.2.1) (2018-04-23)


### Bug Fixes

* don't mention command author ([31992c5](https://github.com/dessant/move-issues/commit/31992c5))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/dessant/move-issues/compare/v0.1.3...v0.2.0) (2018-04-22)


### Bug Fixes

* link to app page when author is a bot ([49cf4e7](https://github.com/dessant/move-issues/commit/49cf4e7))


### Features

* add config options for controlling mentions ([d561ee2](https://github.com/dessant/move-issues/commit/d561ee2)), closes [#1](https://github.com/dessant/move-issues/issues/1)



<a name="0.1.3"></a>
## [0.1.3](https://github.com/dessant/move-issues/compare/v0.1.2...v0.1.3) (2018-04-17)


### Bug Fixes

* link to correct app instance in error messages ([8352b68](https://github.com/dessant/move-issues/commit/8352b68))
* use correct auth context for target repository ([60a0085](https://github.com/dessant/move-issues/commit/60a0085))



<a name="0.1.2"></a>
## [0.1.2](https://github.com/dessant/move-issues/compare/v0.1.1...v0.1.2) (2018-01-16)


### Bug Fixes

* comment for missing app installation ([f9a4a90](https://github.com/dessant/move-issues/commit/f9a4a90))



<a name="0.1.1"></a>
## [0.1.1](https://github.com/dessant/move-issues/compare/v0.1.0...v0.1.1) (2017-12-13)


### Bug Fixes

* remove command validation ([40bd75b](https://github.com/dessant/move-issues/commit/40bd75b))



<a name="0.1.0"></a>
# 0.1.0 (2017-11-19)
