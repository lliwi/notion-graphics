#!/usr/bin/env bash
set -e

echo "Starting Notion Charts Service..."
echo "Running database migrations..."
cd backend && npm run migration:run
echo "Starting backend..."
npm run start:dev
