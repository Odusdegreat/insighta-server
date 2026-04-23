# insighta-backend

A RESTful API backend for profile data management built with Express and Bun.

## Features

- Profile management with filtering, sorting, and pagination
- Natural language search query support
- Data persistence via JSON file storage
- Input validation with proper error handling

## API Endpoints

### GET /api/profiles

Returns profiles with support for filtering, sorting, and pagination.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| gender | string | Filter by gender (male/female) |
| age_group | string | Filter by age group (child/teenager/adult/senior) |
| country_id | string | Filter by country code |
| min_age | number | Minimum age filter (0-120) |
| max_age | number | Maximum age filter (0-120) |
| min_gender_probability | number | Minimum gender probability |
| min_country_probability | number | Minimum country probability |
| sort_by | string | Sort field (name/age/gender_probability/country_probability) |
| order | string | Sort order (asc/desc) |
| page | number | Page number (default: 1) |
| limit | number | Results per page, max 100 (default: 10) |

**Response:**
```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 100,
  "data": [...]
}
```

### GET /api/profiles/search

Natural language search endpoint for profile queries.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Natural language query |

**Supported queries:**
- "young males" - Males aged 16-24
- "females above 30" - Females aged 30+
- "people from [country]" - Profiles from specified country
- "adult males from [country]" - Adult males from specified country
- "teenagers above 17" - Teenagers aged 17+

## Installation

```bash
bun install
```

## Running

```bash
bun run dev
```

Server runs on port 4000 by default.

## Data

Profiles are stored in `data/profiles.json`. If the file is empty or missing, sample data is automatically generated on startup.