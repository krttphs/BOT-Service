**# Bank of Thailand (BOT) API Project**

Bank of Thailand (BOT) API project. NestJS backend + Next.js frontend in a single project.

**## Project setup**

Install project dependencies:

```bash

$ npm install

```

**## Environment Variables**

Create a `.env` file in the project root before starting the application.

The `.env` file contains configuration required by the backend, including the MongoDB connection and BOT API credentials.

Do not commit the `.env` file to the repository.

**## Compile and run the project**

**### Backend**

Run the NestJS backend in development mode:

```bash

# backend API on [http://localhost:3000/api](http://localhost:3000/api)

# NestJS, watch mode

$ npm run start:dev

```

The backend API is available at:

```text

[http://localhost:3000/api](http://localhost:3000/api)

```

**### Frontend**

Open a second terminal and run:

```bash

# frontend on [http://localhost:3001](http://localhost:3001)

# Next.js, development server

$ npm run dev

```

The frontend is available at:

```text

[http://localhost:3001](http://localhost:3001)

```

**## Docker**

The `Dockerfile` is multi-stage and builds both applications.

It exposes three targets:

| Target | Contents | Command |

| ------ | -------- | ------- |

| `api` | `dist/` + production dependencies | `node dist/main.js` |

| `web` | `.next/standalone` + static/public files | `node server.js` |

| `linter` | Project source + development dependencies | `npm run lint` |

**### Build and start the Docker stack**

Build both images and start the containers in the background:

```bash

$ docker compose up -d --build

```

**### Check container status**

```bash

$ docker compose ps

```

Expected services:

```text

API:      [http://localhost:3000](http://localhost:3000)

Frontend: [http://localhost:3001](http://localhost:3001)

```

**### Follow container logs**

```bash

$ docker compose logs -f

```

To view only the API logs:

```bash

$ docker compose logs -f api

```

**### Stop and remove containers**

```bash

$ docker compose down

```

**### Rebuild after code changes**

```bash

$ docker compose up -d --build

```

Configuration comes from the local `.env` file, which is passed to the `api`

container with `env_file` and is ****not**** baked into either image.

The `.env` file is excluded through `.dockerignore`.

The `web` container does not require secrets. The frontend proxies `/api/*`

to `http://api:3000` over the Docker Compose network.

Therefore, the frontend can be accessed through:

```text

[http://localhost:3001](http://localhost:3001)

```

while the API is also published on port `3000` for direct access and debugging.

**### API_INTERNAL_URL**

`next build` bakes rewrites into `.next/routes-manifest.json`, so

`API_INTERNAL_URL` is a ****build-time**** argument rather than only a runtime variable.

The default value in `docker-compose.yml` is:

```text

http://api:3000

```

If the `api` service name is changed, pass a matching value when building:

```bash

$ docker compose build --build-arg API_INTERNAL_URL=http://<host>:3000

```

**## Linter**

This project uses ****Oxlint**** for static code analysis.

Run the linter with:

```bash

$ npm run lint

```

The current project passes the lint check with:

```text

Found 0 warnings and 0 errors.

```

The linter can also be run using Docker:

```bash

$ docker compose run --rm linter

```

**## OWASP Dependency-Check**

This project uses ****OWASP Dependency-Check**** to scan third-party dependencies

for known security vulnerabilities.

Dependency-Check is currently run locally using version ****12.1.0****.

Before running the scan, make sure OWASP Dependency-Check 12.1.0 is installed.

Update the executable path in the command if Dependency-Check is installed in a different location.

The scan can be run locally using:

```bash

C:\dependency-check\bin\dependency-check.bat ^
--project "BOT-System" ^
--scan "." ^
--out "dependency-check-report-final" ^
--format HTML ^
--disableOssIndex ^
--disableRetireJS ^
--suppression "dependency-check-suppression.xml"

```

The scan uses the ****NVD vulnerability data source**** and the project's suppression file for confirmed false positives.

The HTML report is generated in:

```text

dependency-check-report-final/dependency-check-report.html

```

The suppression file is:

```text

dependency-check-suppression.xml

```

**## API Testing**

After starting the backend, the API can be tested using `curl`, Thunder Client,

or another HTTP client.

**### Test the API**

```bash

$ curl [http://localhost:3000/api](http://localhost:3000/api)

```

Expected response:

```text

Hello World!

```

**## Project Services**

The project consists of the following main services:

- ****NestJS**** — Backend API

- ****Next.js**** — Frontend

- ****MongoDB Atlas**** — Database

- ****Bank of Thailand (BOT) API**** — External data source

- ****Oxlint**** — Static code analysis

- ****Docker / Docker Compose**** — Application containerization

- ****OWASP Dependency-Check**** — Dependency vulnerability scanning

**## Available npm scripts**

| Command | Description |

| ------- | ----------- |

| `npm install` | Install project dependencies |

| `npm run build` | Build the NestJS backend |

| `npm run start` | Start the NestJS backend |

| `npm run start:dev` | Start the NestJS backend in watch mode |

| `npm run start:prod` | Start the production NestJS backend |

| `npm run dev` | Start the Next.js development server |

| `npm run build:web` | Build the Next.js frontend |

| `npm run start:web` | Start the Next.js production frontend |

| `npm run lint` | Run Oxlint |

| `npm test` | Run Jest tests |

| `npm run test:watch` | Run Jest in watch mode |

| `npm run test:cov` | Run Jest with coverage |

| `npm run format` | Format source files with Prettier |


ตอนนี้ dependency check แล้วเจอ
- braces:3.0.3 รอตัวใหม่มา patch (ไม่ควร downgrade)
- mongodb:7.6.0 false positive