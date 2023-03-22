FROM php:8.1-apache

#install all the dependencies
RUN apt-get update && apt-get install -y \
      libicu-dev \
      libpq-dev \
      libmcrypt-dev \
      libonig-dev \
      libzip-dev \
      git \
      zip \
      unzip \
    && rm -r /var/lib/apt/lists/* \
    && docker-php-ext-configure pdo_mysql --with-pdo-mysql=mysqlnd \
    && docker-php-ext-install \
      intl \
      #mbstring \
      pcntl \
      pdo_mysql \
      pdo_pgsql \
      pgsql \
      opcache \
      zip

#install composer
#RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/bin/ --filename=composer

COPY ["src", "/var/www/html/"]

#change uid and gid of apache to docker user uid/gid
RUN usermod -u 1000 www-data && groupmod -g 1000 www-data

RUN a2enmod rewrite

#RUN composer install --no-interaction

# Define PHP_TIMEZONE env variable
ENV PHP_TIMEZONE Europe/Paris