# File Processing Pipeline

An end-to-end multi-tenant asynchronous file management application built with Node.js, Express, MongoDB, Redis, BullMQ, S3/LocalStack, Socket.io, and React.

The system supports PDF, DOCX, PNG, and JPG uploads up to 10 MB and processes files asynchronously through a BullMQ worker.

---

## Features

### Authentication & Tenancy

- JWT-based authentication
- Access token + refresh token flow
- Multi-tenant data isolation
- Tenant ID supplied through `X-Tenant-ID`
- Every authenticated user belongs to a tenant
- Tenant-owned queries are scoped by `tenantId`

### File Processing

- Multipart uploads using Multer
- Supported file types:
  - PDF
  - DOCX
  - PNG
  - JPG/JPEG
- Maximum file size: 10 MB
- S3-compatible storage using LocalStack
- MongoDB file metadata
- Asynchronous processing with BullMQ
- Redis-backed job queue
- Processing states:
  - `pending`
  - `processing`
  - `processed`
  - `failed`
- PDF page-count extraction
- Image dimension extraction
- Thumbnail generation
- Socket.io real-time status notifications
- Polling fallback endpoint

### Reliability

- BullMQ automatic retries
- Exponential backoff
- Dead-letter queue for jobs that exhaust retries
- Admin retry endpoint
- Asynchronous file deletion

### File Management

- Server-side pagination
- File filtering
- Soft delete
- Signed S3 download URLs
- Thumbnail previews
- Virtualized file list when the current page contains more than 100 items

### Dashboard

- Total files
- Storage used
- Active users
- Jobs queued
- Files uploaded per day over the last 30 days
- MongoDB aggregation for dashboard metrics

### User Management

- Tenant-scoped user listing
- Server-side pagination
- Search/filter support
- Role-based access control
- Owner-only role changes
- Admin/Owner user management

---

# Architecture

```text
                         React Client
                              |
                    Axios + JWT Auth
                              |
                              v
                     Express REST API
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
           MongoDB          Redis         LocalStack
              |               |               |
        File metadata     BullMQ queue        S3
              |               |
              |               v
              |          File Worker
              |               |
              |       Download from LocalStack S3
              |               |
              |       Process file
              |               |
              |       Generate thumbnail
              |               |
              |       Update MongoDB
              |               |
              +---------------+
                              |
                              v
                         Socket.io
                              |
                              v
                         React Client
```

---

# Project Structure

```text
project/
│
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── queue/
│       ├── services/
│       ├── socket/
│       ├── workers/
│       ├── utils/
│       ├── routes/
│       └── index.js
│
├── client/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       ├── store/
│       └── styles/
│       └── App.jsx
│       └── index.css
│       └── main.jsx
│
├── docker-compose.yml
└── README.md
```

---

# Requirements

Install the following before starting:

- Node.js 20+
- npm
- Docker Desktop
- MongoDB or Mongo Atlas

Node.js 20+ is recommended because of the PDF processing dependencies.

---

# Fresh Clone Setup

## 1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

## 2. Install backend dependencies

```bash
cd server
npm install
```

## 3. Install frontend dependencies

```bash
cd ../client
npm install
```

## 4. Configure environment variables

Create `server/.env`:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI='monogoer0'
JWT_ACCESS_SECRET=JWT_KEY
COOKIE_SECURE=false
NODE_ENV=development
UPLOAD_PATH=./uploads
REDIS_URL=redis://127.0.0.1:6379
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_S3_BUCKET=file-processing
S3_ENDPOINT=http://localhost:4566
UPLOAD_PATH=./uploads
```

## 5. Start LocalStack
```Before running docker compose, make sure you have LocalStack API Key
from https://www.localstack.cloud/. Add that key in docker-compose.yml file
like LOCALSTACK_AUTH_TOKEN: YOUR_KEY_GOES_HERE
```

From the project root:

```bash
docker compose up -d
```

Create the S3 bucket:

```bash
docker exec localstack awslocal s3 mb s3://file-processing
```

Verify:

```bash
docker exec localstack awslocal s3 ls
```

## 6. Start Redis

Redis will be start by the commnad in Step 5

Just make sure Redis is available at:

```text
redis://127.0.0.1:6379
```

## 7. Start MongoDB

Make sure MongoDB is running at:

```text
mongodb://127.0.0.1:27017/file-processing
```

## 8. Seed Data

The project includes a seed script that creates demo tenants and users for local development and testing.

## Seed Demo Data

From the `server` directory, run:

```bash
npm run seed
```

The seed data creates:

- 2 tenants
- 1 owner per tenant
- 1 admin per tenant
- 1 viewer per tenant
- 1 editor per tenant

## Seed Users

### Acme Corporation

| Role | Email |
|---|---|
| Owner | `owner@acme.com` |
| Admin | `admin@acme.com` |
| Viewer | `viewer@acme.com` |
| Editor | `editor@acme.com` |

### Tech Solutions

| Role | Email |
|---|---|
| Owner | `owner@tech.com` |
| Admin | `admin@tech.com` |
| Viewer | `viewer@tech.com` |
| Editor | `editor@tech.com` |

All seeded users use the same development password:

```text
Password123!
```

## 9. Start the backend

```bash
cd server
npm run dev
```

API:

```text
http://localhost:5000
```

Health check:

```text
GET /health
```

## 10. Start the frontend
  
In another terminal:

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

## 10. Start the worker

If the worker is not started by the backend development script, run it separately:

```bash
npm run worker
```

The worker must be running for asynchronous file processing.

---

# Tenancy Strategy

## Decision

The application uses a **shared database with shared collections and tenant ID isolation**.

Every tenant-owned document contains a `tenantId`.

Example:

```js
{
  tenantId: ObjectId("..."),
  name: "document.pdf",
  uploadedBy: ObjectId("..."),
  status: "processed"
}
```

Authenticated requests resolve the tenant from the authenticated user and/or `X-Tenant-ID`.

Tenant-owned database queries always include the tenant:

```js
const filter = {
  tenantId: req.tenantId,
};
```

For normal file listings:

```js
const filter = {
  tenantId: req.tenantId,
  deletedAt: null,
};
```

## Why this strategy?

A shared database/shared collection model was selected because:

- It is simple to operate.
- It reduces infrastructure complexity.
- It is suitable for the expected assignment scale.
- MongoDB indexes can efficiently support tenant-scoped queries.
- Adding a tenant does not require creating a new database or collection.

## Trade-offs

### Advantages

- Lower operational complexity
- Lower infrastructure cost
- Easier migrations
- Simple deployment model
- Straightforward reporting

### Disadvantages

- Application code must consistently enforce tenant isolation.
- A missing tenant filter could expose another tenant's data.
- Very large tenants may eventually require additional partitioning or sharding.

The main mitigation is central authentication/authorization middleware combined with tenant-scoped database queries.

---

# RBAC Middleware Design

The application uses three roles:

```text
owner
admin
member
```

## Permissions

| Operation | Owner | Admin | Member |
|---|---:|---:|---:|
| Upload files | Yes | Yes | Yes |
| View files | Yes | Yes | Yes |
| Download files | Yes | Yes | Yes |
| Delete files | Yes | Yes | No |
| View reports | Yes | Yes | No |
| View users | Yes | Yes | No |
| Retry failed jobs | Yes | Yes | No |
| Change user roles | Yes | No | No |

The authorization middleware is reusable:

```js
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res.status(403).json({
          message: "Forbidden",
        });
```

Routes declare the required role:

```js
router.get(
  "/",
  requireAuth,
  requireRole("admin", "owner"),
  listUsers
);
```

Owner-only operations use:

```js
requireRole("owner")
```

Authentication and role authorization are separate concerns.

A user being an admin does not grant access to another tenant.

---

# MongoDB Index Justifications

The File collection uses tenant-aware indexes:

```js
schema.index({
  tenantId: 1,
  createdAt: -1,
});

schema.index({
  tenantId: 1,
  status: 1,
});

schema.index({
  tenantId: 1,
  type: 1,
});

schema.index({
  tenantId: 1,
  uploadedBy: 1,
});
```

## `tenantId + createdAt`

Supports the main file listing:

```js
FileModel.find({
  tenantId,
  deletedAt: null,
})
.sort({
  createdAt: -1,
})
```

The newest files are the most common listing order.

## `tenantId + status`

Supports:

- Status filtering
- Dashboard status counts
- Pending/processing/processed/failed queries

## `tenantId + type`

Supports filtering by:

- PDF
- DOCX
- PNG
- JPG

## `tenantId + uploadedBy`

Supports filtering files by the user who uploaded them.

## User indexes

Tenant-scoped user queries should also have suitable indexes, for example:

```js
schema.index({
  tenantId: 1,
  createdAt: -1,
});
```

and, where appropriate:

```js
schema.index({
  tenantId: 1,
  email: 1,
});
```

---

# File Upload Pipeline

The upload process is asynchronous.

```text
Client
  |
  | multipart/form-data
  v
Multer
  |
  | MIME + size validation
  v
Upload Controller
  |
  | upload to S3
  v
MongoDB
  |
  | status = pending
  v
BullMQ
  |
  | return 202 immediately
  v
Client
```

The worker then processes the file:

```text
BullMQ Worker
      |
      v
status = processing
      |
      v
Download file from S3
      |
      v
Extract metadata
      |
      v
Generate thumbnail
      |
      v
Upload thumbnail
      |
      v
MongoDB
status = processed
      |
      v
Socket.io
      |
      v
React UI
```

The API does not wait for processing before returning the upload response.

---

# Retry and Dead-Letter Queue

File-processing jobs use automatic retries:

```js
defaultJobOptions: {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 2000,
  },
}
```

The worker only marks the file as failed after the final attempt.

```text
attempt 1 → failed → retry
attempt 2 → failed → retry
attempt 3 → failed
                    |
                    v
                   DLQ
                    |
                    v
             status = failed
```

The dead-letter job contains information such as:

```js
{
  originalJobId,
  fileId,
  tenantId,
  attemptsMade,
  failedAt,
  error
}
```

Admins can requeue failed jobs using the retry endpoint.

---

# File Downloads

The API never streams original file bytes through Express.

Instead:

```http
GET /api/v1/files/:id/download
```

returns a time-limited signed S3 URL.

Example:

```json
{
  "success": true,
  "data": {
    "fileId": "...",
    "name": "document.pdf",
    "status": "processed",
    "expiresIn": 300,
    "downloadUrl": "..."
  }
}
```

The browser downloads the file directly from S3/LocalStack.

This avoids turning the API server into a file-transfer bottleneck.

---

# Soft Delete

Files are soft deleted using:

```js
deletedAt
```

instead of immediately removing the MongoDB document.

Example:

```js
{
  deletedAt: new Date()
}
```

Normal queries exclude deleted files:

```js
{
  tenantId,
  deletedAt: null
}
```

S3 object deletion is performed asynchronously through a BullMQ job.

This keeps the HTTP delete request fast.

---

# Server-Side Pagination

File and user lists use server-side pagination.

Example:

```http
GET /api/v1/users?page=2&limit=20
```

The backend uses:

```js
.skip(skip)
.limit(limit)
```

Only the requested page is returned.

The frontend does not download every record and then use:

```js
array.slice(...)
```

for pagination.

---

# File List Virtualization

When the current file page contains more than 100 items, the React file list uses virtualization.

Server-side pagination and virtualization solve different problems:

- Pagination limits data transferred from the server.
- Virtualization limits the number of DOM elements rendered.

---

# Real-Time Updates

Socket.io provides processing status updates.

The frontend joins a user-specific room:

```text
user:<userId>
```

The backend emits:

```text
file:processing
file:processed
file:failed
```

The React UI updates the matching file without a page refresh.

Polling fallback:

```http
GET /api/v1/files/:id/status
```

returns:

```text
pending
processing
processed
failed
```

---

# Dashboard

The dashboard displays:

- Total files
- Storage used
- Active users
- Jobs queued
- Files uploaded per day for the last 30 days

Dashboard values are calculated from tenant-scoped MongoDB data.

The upload chart uses MongoDB aggregation so the frontend does not need to download every file record.

---

# User Management

The user list is tenant scoped and paginated.

Example:

```http
GET /api/v1/users?page=1&limit=20
```

The API response is:

```json
{
  "data": [
    {
      "_id": "...",
      "fullName": "User",
      "email": "user@example.com",
      "role": "member"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

Optional search and role filtering can be provided using:

```http
GET /api/v1/users?page=1&limit=20&search=vijay&role=member
```

---

# API Overview

## Authentication

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Files

```http
POST   /api/v1/files/upload
GET    /api/v1/files
GET    /api/v1/files/:id/status
GET    /api/v1/files/:id/download
DELETE /api/v1/files/:id
```

## Users

```http
GET   /api/v1/users
POST  /api/v1/users/invite
PATCH /api/v1/users/:id/role
```

## Jobs

```http
GET /api/v1/jobs/:id/retry
```

## Reports

```http
GET /api/v1/reports/summary
```

---

# HTTP Status Codes

| Status | Meaning |
|---|---|
| `200` | Successful request |
| `202` | Request accepted for asynchronous processing |
| `401` | Authentication required/invalid |
| `403` | Insufficient permission |
| `404` | Resource not found |
| `409` | Resource is not ready |
| `422` | Invalid file type or file size |
| `500` | Unexpected server error |

---

# Known Shortcuts / Limitations

1. **LocalStack instead of production AWS S3**

   LocalStack provides an S3-compatible development environment without requiring an AWS account.

2. **Shared MongoDB collections**

   Tenant isolation is application-level rather than database-per-tenant isolation.

3. **DOCX thumbnail processing**

   DOCX visual rendering is less portable than image/PDF processing and may require a document conversion dependency such as LibreOffice.

4. **Local development deployment**

   The project is configured primarily for local development rather than production Kubernetes/cloud deployment.

5. **Basic search**

   MongoDB filtering is used instead of a dedicated search engine because the expected dataset does not require one.

6. **Small worker deployment**

   The architecture supports BullMQ workers, but this assignment uses a small worker deployment rather than a large horizontally scaled worker fleet.

7. **Short-lived signed URLs**

   Download URLs expire after a short period. A new URL must be requested after expiration.

8. **Development S3 credentials**

   LocalStack credentials such as:

   ```text
   AWS_ACCESS_KEY_ID=test
   AWS_SECRET_ACCESS_KEY=test
   ```

   are development-only and must not be used in production.

---

# Production Considerations

Before production deployment:

- Use AWS S3 instead of LocalStack.
- Use a production secrets manager.
- Use HTTPS.
- Use secure HTTP-only refresh cookies.
- Add rate limiting.
- Add structured logging.
- Add stronger request validation.
- Validate file contents in addition to MIME type.
- Add antivirus/malware scanning.
- Add queue monitoring.
- Run multiple BullMQ workers.
- Add automated integration and end-to-end tests.
- Consider MongoDB sharding for very large datasets.
- Add dedicated document conversion infrastructure for DOCX thumbnails.

---

# Honest Time-per-Area Estimate

| Area | Estimated Time |
|---|---:|
| Project setup and environment | 1–1.5 h |
| Authentication and JWT flow | 2–3 h |
| Multi-tenancy | 1–1.5 h |
| RBAC middleware | 1–1.5 h |
| MongoDB models/indexes | 1–2 h |
| S3/LocalStack integration | 2–3 h |
| Multer upload validation | 1–1.5 h |
| BullMQ queue/worker | 2–3 h |
| File processing/thumbnails | 3–5 h |
| Retry + DLQ | 1.5–2 h |
| Socket.io updates | 1.5–2 h |
| File listing/pagination/filtering | 2–3 h |
| Soft delete + async S3 deletion | 1.5–2 h |
| Reports/dashboard aggregation | 2–3 h |
| React File Manager | 3–5 h |
| Dashboard UI/chart | 2–3 h |
| User management | 2–3 h |
| Routing/sidebar/UI polish | 1–2 h |
| Debugging/integration testing | 3–5 h |
| Documentation | 1–1.5 h |

### Total

Approximately **35–50 hours**.

The range includes environment-specific debugging involving Docker, LocalStack, Redis, PDF/DOCX rendering, Socket.io, and frontend/backend integration.

---

# Development Notes

The API and worker must both be running for the complete asynchronous pipeline to work.

Typical development setup:

```bash
# Terminal 1
cd server
npm run dev

# Terminal 2, if required
cd server
npm run worker

# Terminal 3
cd client
npm run dev
```

LocalStack and Redis should be running before starting the backend.

---

# License

This project was created as a technical assignment/demo application.
