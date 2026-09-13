FROM php:8.4-cli

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy existing application directory contents
COPY . /var/www

# Install composer dependencies
RUN composer install --no-interaction --optimize-autoloader --ignore-platform-reqs

# Ensure docker network hosts for DB and Redis
RUN if [ -f /var/www/.env ]; then \
        sed -i 's/DB_HOST=127.0.0.1/DB_HOST=db/' /var/www/.env && \
        sed -i 's/REDIS_HOST=127.0.0.1/REDIS_HOST=redis/' /var/www/.env; \
    fi

# Change permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expose port 8000
EXPOSE 8000

# Start Laravel's built-in server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
