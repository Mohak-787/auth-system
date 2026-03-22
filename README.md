# Auth System

A **REST API** for user registration, email verification with a **one-time password (OTP)**, login, and session handling. After verification, it issues **JWT access tokens** for API calls and stores **refresh tokens** in **HTTP-only cookies**, backed by **MongoDB** sessions and OTP records.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [How authentication works](#how-authentication-works)
4. [Prerequisites](#prerequisites)
5. [Environment variables](#environment-variables)
6. [Install and run](#install-and-run)
7. [API reference](#api-reference)
   - [Base URL](#api-base-url)
   - [POST `/api/auth/register`](#api-register)
   - [POST `/api/auth/login`](#api-login)
   - [GET `/api/auth/verify-email`](#api-verify-email)
   - [GET `/api/auth/get-user`](#api-get-user)
   - [GET `/api/auth/refresh-token`](#api-refresh-token)
   - [POST `/api/auth/logout`](#api-logout)
   - [POST `/api/auth/logout-all`](#api-logout-all)
8. [Error handling](#error-handling)

---

## Features

- User registration with unique username and email
- **Email OTP** — six-digit code sent via **Nodemailer** (Gmail OAuth2); only a hash is stored server-side
- **Email verification** — users must verify before they can log in
- Login with email and password (rejects unverified accounts)
- Short-lived **access token** (JWT) in the JSON body; use the `Authorization` header for protected routes
- Long-lived **refresh token** (JWT) as an **httpOnly** cookie after login
- Server-side **sessions** (hashed refresh tokens, IP, user agent, revoke support)
- Log out the current session or all sessions for the user

---

## Tech stack

- **Runtime:** Node.js (ES modules)
- **Framework:** Express
- **Database:** MongoDB via Mongoose
- **Auth:** JSON Web Tokens (`jsonwebtoken`), SHA-256 for password and OTP hashing
- **Email:** Nodemailer with Gmail **OAuth2**

---

## How authentication works

1. **Register** creates the user (initially unverified), stores an OTP hash, and sends the OTP to the user’s email. It does **not** create a session or set refresh cookies.
2. **Verify email** with the OTP and email address marks the account as verified.
3. **Login** (after verification) returns an `accessToken` and sets the `refreshToken` cookie.
4. For protected routes (e.g. **get user**), send: `Authorization: Bearer <accessToken>`.
5. When the access token expires, call **refresh token** with the cookie present; you get a new `accessToken` and the refresh cookie is rotated.
6. **Logout** revokes the current session and clears the refresh cookie. **Logout all** revokes every active session for that user (valid refresh cookie required).

**Note:** Cookies use `Secure` and `SameSite=Strict`. Use **HTTPS** in development if cookies must be sent, or adjust cookie options in code for local HTTP testing.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A running [MongoDB](https://www.mongodb.com/) instance and connection string
- For outbound email: a Google Cloud / Gmail OAuth2 setup compatible with Nodemailer (see environment variables)

---

## Environment variables

| Variable                 | Required | Description |
|--------------------------|----------|-------------|
| `MONGO_URI`              | Yes      | MongoDB connection string |
| `JWT_SECRET`             | Yes      | Secret used to sign and verify JWTs |
| `GOOGLE_USER`            | Yes*     | Gmail address used to send mail |
| `GOOGLE_CLIENT_ID`       | Yes*     | OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET`   | Yes*     | OAuth2 client secret |
| `GOOGLE_REFRESH_TOKEN`   | Yes*     | OAuth2 refresh token for Gmail API |
| `PORT`                   | No       | Server port (default: `3000`) |

\*Required if you use the built-in email sender for OTP delivery.

Create a `.env` file in the project root (do not commit secrets):

```env
MONGO_URI=mongodb://localhost:27017/auth-system
JWT_SECRET=your-long-random-secret
GOOGLE_USER=you@gmail.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
PORT=3000
```

---

## Install and run

```bash
npm install
npm run dev
```

Production-style start:

```bash
npm start
```

The server listens on `PORT` (default `3000`).

---

## API reference

<a id="api-base-url"></a>

### Base URL

All paths below are relative to your server origin, for example:

```text
http://localhost:3000
```

Auth routes are mounted at **`/api/auth`**.

Unless noted, JSON request bodies use **`Content-Type: application/json`**.

---

<a id="api-register"></a>

### POST `/api/auth/register`

Creates a new user, generates a one-time code, stores only its hash, and sends the OTP to the given email. Does **not** set session cookies.

**Input**

| Location | Field       | Type   | Required | Description |
|----------|-------------|--------|----------|-------------|
| Body     | `username`  | string | Yes      | Unique username |
| Body     | `email`     | string | Yes      | Unique email |
| Body     | `password`  | string | Yes      | Plain-text password (stored hashed) |

**Example request**

```http
POST /api/auth/register HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "username": "jane",
  "email": "jane@example.com",
  "password": "your-secure-password"
}
```

**Success — `201 Created`**

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "jane",
    "email": "jane@example.com",
    "verified": false,
    "createdAt": "2025-03-22T12:00:00.000Z",
    "updatedAt": "2025-03-22T12:00:00.000Z"
  }
}
```

**Error — `409 Conflict`**

```json
{
  "message": "Username or email already exists"
}
```

---

<a id="api-login"></a>

### POST `/api/auth/login`

Authenticates a **verified** user, creates a session, sets the refresh cookie, and returns the user plus an access token.

**Input**

| Location | Field      | Type   | Required | Description |
|----------|------------|--------|----------|-------------|
| Body     | `email`    | string | Yes      | User email |
| Body     | `password` | string | Yes      | User password |

**Example request**

```http
POST /api/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "your-secure-password"
}
```

**Success — `200 OK`**

- Sets cookie: `refreshToken` (HTTP-only, secure, SameSite strict, 7 days).

```json
{
  "message": "User logged in successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "jane",
    "email": "jane@example.com",
    "verified": true,
    "createdAt": "2025-03-22T12:00:00.000Z",
    "updatedAt": "2025-03-22T12:00:00.000Z"
  },
  "accessToken": "<jwt>"
}
```

**Errors — `401 Unauthorized`**

Invalid email or password:

```json
{
  "message": "Invalid credentials"
}
```

Account exists but email not verified yet:

```json
{
  "message": "Email not verified"
}
```

---

<a id="api-verify-email"></a>

### GET `/api/auth/verify-email`

Confirms ownership of the email using the OTP from the registration email. Marks the user as verified and removes OTP records for that user.

**Input**

| Location | Field   | Type   | Required | Description |
|----------|---------|--------|----------|-------------|
| Query    | `otp`   | string | Yes      | Six-digit code from the email |
| Query    | `email` | string | Yes      | Same email used at registration |

Use **query parameters** (standard for GET). Example:

`GET /api/auth/verify-email?otp=123456&email=jane%40example.com`

**Example request**

```http
GET /api/auth/verify-email?otp=123456&email=jane@example.com HTTP/1.1
Host: localhost:3000
```

**Success — `200 OK`**

```json
{
  "message": "Email verified successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "jane",
    "email": "jane@example.com",
    "verified": true,
    "createdAt": "2025-03-22T12:00:00.000Z",
    "updatedAt": "2025-03-22T12:00:00.000Z"
  }
}
```

**Error — `400 Bad Request`**

Wrong or unknown OTP / email combination:

```json
{
  "message": "Invalid OTP"
}
```

---

<a id="api-get-user"></a>

### GET `/api/auth/get-user`

Returns the current user profile using the **access token**.

**Input**

| Location | Field           | Type   | Required | Description |
|----------|-----------------|--------|----------|-------------|
| Header   | `Authorization` | string | Yes      | `Bearer <accessToken>` |

**Example request**

```http
GET /api/auth/get-user HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success — `200 OK`**

```json
{
  "message": "User fetched successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "jane",
    "email": "jane@example.com",
    "verified": true,
    "createdAt": "2025-03-22T12:00:00.000Z",
    "updatedAt": "2025-03-22T12:00:00.000Z"
  }
}
```

**Errors — `401 Unauthorized`**

Missing header:

```json
{
  "message": "Token not found"
}
```

Invalid or expired access token:

```json
{
  "message": "Invalid or expired token"
}
```

---

<a id="api-refresh-token"></a>

### GET `/api/auth/refresh-token`

Issues a **new access token** and **rotates** the refresh token. The client must send the `refreshToken` cookie from a previous **login**.

**Input**

| Location | Field          | Type   | Required | Description |
|----------|----------------|--------|----------|-------------|
| Cookie   | `refreshToken` | string | Yes      | Refresh JWT from an active session |

**Example request**

```http
GET /api/auth/refresh-token HTTP/1.1
Host: localhost:3000
Cookie: refreshToken=<jwt>
```

**Success — `200 OK`**

- Sets cookie: `refreshToken` (new value, same options, 7 days).

```json
{
  "message": "Access token generated successfully",
  "accessToken": "<jwt>"
}
```

**Errors — `401 Unauthorized`**

Missing cookie:

```json
{
  "message": "Token not found"
}
```

Invalid or expired refresh JWT:

```json
{
  "message": "Invalid or expired refresh token"
}
```

Unknown or revoked session:

```json
{
  "message": "Invalid refresh token"
}
```

---

<a id="api-logout"></a>

### POST `/api/auth/logout`

Revokes the **current** session and clears the refresh cookie.

**Input**

| Location | Field          | Type   | Required | Description |
|----------|----------------|--------|----------|-------------|
| Cookie   | `refreshToken` | string | Yes      | Current refresh JWT |

**Example request**

```http
POST /api/auth/logout HTTP/1.1
Host: localhost:3000
Cookie: refreshToken=<jwt>
```

**Success — `200 OK`**

- Clears the `refreshToken` cookie.

```json
{
  "message": "Logged out successfully"
}
```

**Errors**

`400 Bad Request` — no refresh cookie:

```json
{
  "message": "Refresh token not found"
}
```

`401 Unauthorized` — session not found or invalid:

```json
{
  "message": "Invalid refresh token"
}
```

---

<a id="api-logout-all"></a>

### POST `/api/auth/logout-all`

Revokes **all** non-revoked sessions for the user tied to the refresh cookie.

**Input**

| Location | Field          | Type   | Required | Description |
|----------|----------------|--------|----------|-------------|
| Cookie   | `refreshToken` | string | Yes      | Any valid refresh JWT for that user |

**Example request**

```http
POST /api/auth/logout-all HTTP/1.1
Host: localhost:3000
Cookie: refreshToken=<jwt>
```

**Success — `200 OK`**

```json
{
  "message": "Logged out from all devices successfully"
}
```

**Errors — `401 Unauthorized`**

Missing cookie:

```json
{
  "message": "Refresh token not found"
}
```

Invalid or expired refresh JWT:

```json
{
  "message": "Invalid or expired refresh token"
}
```

---

## Error handling

Responses use JSON with a `message` field for errors, as shown above. Typical status codes:

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Resource created (register) |
| `400` | Bad request (e.g. invalid OTP, logout without cookie) |
| `401` | Not authenticated, invalid token, or email not verified (login) |
| `409` | Conflict (duplicate username or email on register) |
| `500` | Server or database error (not explicitly handled in all paths) |

For integration testing, use tools that preserve cookies (e.g. browser, `curl -c`/`-b`, or API clients with cookie jars).
