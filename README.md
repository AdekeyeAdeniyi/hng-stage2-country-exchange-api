# Country Currency & Exchange API

A RESTful API that fetches country data from external APIs, matches currency exchange rates, computes estimated GDP, and caches everything in an Aiven PostgreSQL database.

## Features

- **POST /countries/refresh** — Fetch countries and exchange rates, compute values and cache in DB, generate summary image
- **GET /countries** — List all countries with optional filters and sorting
  - `?region=Africa` - Filter by region
  - `?currency=NGN` - Filter by currency code
  - `?sort=gdp_desc` - Sort by estimated GDP (descending)
- **GET /countries/:name** — Get a single country by name (case-insensitive)
- **DELETE /countries/:name** — Delete a country record
- **GET /status** — Show total countries and last refresh timestamp
- **GET /countries/image** — Serve the generated summary image

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Aiven PostgreSQL
- **Image Generation**: Jimp
- **External APIs**:
  - Countries: https://restcountries.com/v2/all
  - Exchange Rates: https://open.er-api.com/v6/latest/USD

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Aiven PostgreSQL database account
- Git

## Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Stage_2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Aiven PostgreSQL

1. Sign up at [Aiven](https://aiven.io) (free tier available)
2. Create a new **PostgreSQL** service
3. Wait for the service to start (takes 2-3 minutes)
4. Download the **CA certificate** (`ca.pem`) from the service overview page
5. Save `ca.pem` in the project root directory
6. Note your connection details:
   - Host
   - Port (usually 5432)
   - Username (usually `avnadmin`)
   - Password
   - Database name (usually `defaultdb`)

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Aiven PostgreSQL credentials:

```env
POSTGRES_HOST=your-postgres-host.aivencloud.com
POSTGRES_PORT=5432
POSTGRES_USER=avnadmin
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DATABASE=defaultdb
POSTGRES_SSL=true
PORT=3000
CACHE_DIR=cache
```

### 5. Initialize Database

The database table will be created automatically when you start the server. Alternatively, run the migration manually:

```bash
npm run migrate
```

### 6. Start the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

You should see:

```
Initializing database schema...
✓ Countries table created/verified
✓ Indexes created/verified
Database initialization complete!
Connected to Aiven PostgreSQL!
Server listening on port 3000
```

### 7. Test the API

**Refresh data from external APIs:**

```bash
curl -X POST http://localhost:3000/countries/refresh
```

**Get all countries:**

```bash
curl http://localhost:3000/countries
```

**Filter by region:**

```bash
curl http://localhost:3000/countries?region=Africa
```

**Get a specific country:**

```bash
curl http://localhost:3000/countries/Nigeria
```

**Get status:**

```bash
curl http://localhost:3000/status
```

**View summary image:**
Open in browser: http://localhost:3000/countries/image

## Docker Deployment

### Build the Docker Image

```bash
docker build -t country-api .
```

### Run the Container

```bash
docker run -p 3000:3000 \
  -e POSTGRES_HOST=your-host.aivencloud.com \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_USER=avnadmin \
  -e POSTGRES_PASSWORD=your-password \
  -e POSTGRES_DATABASE=defaultdb \
  -e POSTGRES_SSL=true \
  country-api
```

**Note:** Make sure `ca.pem` is in the project root before building the Docker image.

## Deployment Options

This API can be deployed to:

- **Railway** - https://railway.app
- **Heroku** - https://heroku.com
- **AWS EC2/ECS** - https://aws.amazon.com
- **DigitalOcean App Platform** - https://digitalocean.com
- **Fly.io** - https://fly.io
- **Google Cloud Run** - https://cloud.google.com/run

### Example: Railway Deployment

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

### Example: Heroku Deployment

```bash
heroku create your-app-name
heroku config:set POSTGRES_HOST=your-host.aivencloud.com
heroku config:set POSTGRES_PORT=5432
heroku config:set POSTGRES_USER=avnadmin
heroku config:set POSTGRES_PASSWORD=your-password
heroku config:set POSTGRES_DATABASE=defaultdb
heroku config:set POSTGRES_SSL=true
git push heroku main
```

## API Documentation

### POST /countries/refresh

Fetches country data and exchange rates, then stores/updates in the database.

**Response:**

```json
{
  "success": true,
  "total": 250
}
```

**Error (503):**

```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Countries API"
}
```

### GET /countries

Get all countries with optional filters.

**Query Parameters:**

- `region` - Filter by region (e.g., `Africa`, `Europe`)
- `currency` - Filter by currency code (e.g., `NGN`, `USD`)
- `sort` - Sort order (`gdp_desc` for descending GDP)

**Response:**

```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-10-22T18:00:00Z"
  }
]
```

### GET /countries/:name

Get a single country by name (case-insensitive).

**Response:**

```json
{
  "id": 1,
  "name": "Nigeria",
  "capital": "Abuja",
  ...
}
```

**Error (404):**

```json
{
  "error": "Country not found"
}
```

### DELETE /countries/:name

Delete a country record.

**Response:**

```json
{
  "success": true
}
```

**Error (404):**

```json
{
  "error": "Country not found"
}
```

### GET /status

Get total countries and last refresh timestamp.

**Response:**

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-10-22T18:00:00Z"
}
```

### GET /countries/image

Serve the generated summary image (PNG).

**Success:** Returns image file

**Error (404):**

```json
{
  "error": "Summary image not found"
}
```

## Project Structure

```
Stage_2/
├── src/
│   ├── config/
│   │   └── db.js              # PostgreSQL connection pool
│   ├── controllers/
│   │   └── countriesController.js  # Request handlers
│   ├── middleware/
│   │   └── validation.js      # Validation middleware
│   ├── routes/
│   │   └── countries.js       # API routes
│   ├── services/
│   │   └── refreshService.js  # External API fetching logic
│   ├── utils/
│   │   └── image.js           # Image generation utility
│   ├── initDb.js              # Database initialization
│   └── index.js               # App entry point
├── cache/                     # Generated images (auto-created)
├── .env.example               # Environment variables template
├── .dockerignore
├── .gitignore
├── Dockerfile                 # Docker configuration
├── ca.pem                     # Aiven SSL certificate (not in repo)
├── migrate.js                 # Manual migration script
├── package.json
├── schema.sql                 # Database schema
└── README.md
```

## Environment Variables

| Variable            | Description           | Example                  |
| ------------------- | --------------------- | ------------------------ |
| `POSTGRES_HOST`     | Aiven PostgreSQL host | `abc-xyz.aivencloud.com` |
| `POSTGRES_PORT`     | PostgreSQL port       | `5432`                   |
| `POSTGRES_USER`     | Database username     | `avnadmin`               |
| `POSTGRES_PASSWORD` | Database password     | `your-secure-password`   |
| `POSTGRES_DATABASE` | Database name         | `defaultdb`              |
| `POSTGRES_SSL`      | Enable SSL            | `true`                   |
| `PORT`              | API server port       | `3000`                   |
| `CACHE_DIR`         | Image cache directory | `cache`                  |

## Dependencies

### Production

- `express` - Web framework
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management
- `cors` - CORS middleware
- `body-parser` - Request body parsing
- `jimp` - Image generation
- `node-fetch` - HTTP client for external APIs
- `dayjs` - Date/time utilities
- `fs-extra` - File system operations

### Development

- `nodemon` - Auto-reload during development

Install all dependencies:

```bash
npm install
```

## Error Handling

The API returns consistent JSON error responses:

- **400 Bad Request** - Validation failed
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - External API failure

## Notes

- The database table is created automatically on server startup
- Countries without currencies are stored with `currency_code = null`, `exchange_rate = null`, `estimated_gdp = 0`
- Exchange rates are fetched in USD and matched with country currencies
- `estimated_gdp` is recalculated on every refresh with a new random multiplier (1000-2000)
- Case-insensitive country name matching for GET and DELETE operations
- SSL/TLS is required for Aiven PostgreSQL connections
- The summary image is regenerated after every successful refresh

## License

MIT

## Author

[Your Name]

## Support

For issues or questions, please open an issue on GitHub.
