# Vynce

Vynce is a modern social platform built with Laravel and Inertia, designed around meaningful online interaction. Users can publish posts, follow and connect with others, send direct messages, manage notifications, and customize their profiles in one organized experience.

## Project Demo

<p>Click the preview below to watch the demo. Use Ctrl + Click or open in a new tab if needed.</p>

<a href="https://youtu.be/fe_dRFOq5Y8">
  <img src="https://img.youtube.com/vi/fe_dRFOq5Y8/maxresdefault.jpg" alt="Project Demo" width="100%" />
</a>

## Overview

The application is designed as a clean, responsive web experience with a React frontend and a Laravel backend. The UI is driven through Inertia, which keeps the app fast and cohesive while preserving a familiar single-page feel.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.4
- **Frontend:** React 18, Inertia.js
- **Styling:** Tailwind CSS, PostCSS
- **Build Tooling:** Vite
- **Auth & Security:** Laravel Breeze, Sanctum
- **Utilities:** Ziggy, Axios, Lucide Icons
- **Code Quality:** Biome, Laravel Pint
- **Testing:** PHPUnit


## Getting Started

### Prerequisites

- PHP 8.4+
- Node.js 18+
- Composer
- pnpm or npm

### Install

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
pnpm install
pnpm build
```

### Development

```bash
composer run dev
```

### Tests

```bash
composer test
```
