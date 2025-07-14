#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for database to be ready..."
until npx prisma db push --accept-data-loss; do
  echo "Database not ready, waiting 5 seconds..."
  sleep 5
done

echo "Database is ready. Starting the application..."
exec "$@"