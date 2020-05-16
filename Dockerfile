FROM ubuntu:18.04

MAINTAINER Utkarsh Vishnoi <utkarshvishnoi25@gmail.com>

# Set correct environment variables.
ENV DEBIAN_FRONTEND=noninteractive
ENV HOME /root

# Ubuntu Package Upgrade
RUN apt update
RUN apt upgrade -y

# Basic Packages
RUN apt install curl wget ca-certificates gnupg bzip2 build-essential zip unzip ssh locales -y

# Node JS Repository
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -

# Yarn Repository
RUN curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list


RUN apt install git php nodejs yarn -y --no-install-recommends

# Standard cleanup
RUN apt-get autoremove -y && update-ca-certificates && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Composer installation.
RUN curl -sS https://getcomposer.org/installer | php && mv composer.phar /usr/bin/composer && composer selfupdate

# Go installation
RUN curl -O https://dl.google.com/go/go1.14.2.linux-amd64.tar.gz && tar xf go1.14.2.linux-amd64.tar.gz -C /usr/local && rm go1.14.2.linux-amd64.tar.gz
ENV PATH="${PATH}:/usr/local/go/bin:${GOPATH}/bin"

# Add fingerprints for common sites.
RUN mkdir ~/.ssh && ssh-keyscan -H github.com >> ~/.ssh/known_hosts && ssh-keyscan -H gitlab.com >> ~/.ssh/known_hosts

# Cloud9 Installation
RUN git clone https://github.com/utkarsh-vishnoi/core.git /root/proxy-server/c9/
WORKDIR /root/proxy-server/c9
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8
RUN scripts/install-sdk.sh

# Installing Proxy Server
ADD package.json /root/proxy-server/
WORKDIR /root/proxy-server
RUN npm install

ADD server.js app.js /root/proxy-server/
ADD static /root/proxy-server/static

WORKDIR /root
CMD cd /root/proxy-server && npm start

