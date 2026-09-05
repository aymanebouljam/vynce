# Vynce

Vynce is a modern social platform built with Laravel and Inertia, designed around meaningful online interaction. Users can publish posts, follow and connect with others, send direct messages, manage notifications, and customize their profiles in one organized experience.

## Project Demo

[![Watch on YouTube](https://img.shields.io/badge/Watch%20on-YouTube-FF0000?logo=youtube&logoColor=white)](https://youtu.be/fe_dRFOq5Y8)

## Overview

The application delivers a clean, responsive web experience with a React frontend and Laravel backend. Inertia connects both layers, providing a fast, cohesive interface with a familiar single-page application feel.

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
