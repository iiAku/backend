<h1 align="center">Welcome to bob-api 👋</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-12.x-blue.svg" />
  <a href="http://bob-api-documentation.vercel.app/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="#" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> Bob's REST API

### 🏠 [Homepage](https://github.com/Bob-france/backend)

## Prerequisites for local testing

- docker
- docker-compose (https://docs.docker.com/compose/install/)
- node 12.x (https://nodejs.org/en/)

## Live API

endpoint: https://dev-bob-api.herokuapp.com

## Install

```sh
yarn install
```

## Usage

This repository is being directly deployed on Heroku at every commit being pushed or PR being merged into `master` branch

If you want to run this locally, you can do it with docker-compose it will setup the following:

- Database
- Redis (not being used for now)

```sh
cd infra
docker-compose up -d

Make sure everything is running with docker ps/docker ps -a
```

Your app should be automatically wired to above resources

Build and watch for changes with `yarn run watch`

Run dev with `yarn run dev`

See scripts from `package.json` file for scripts

## Author

👤 **Yoann Gendrey**

- Website: https://yoann.gendrey.fr
- Github: [@iiAku](https://github.com/iiAku)

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
