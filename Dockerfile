FROM ubuntu:18.04

MAINTAINER Utkarsh Vishnoi <utkarshvishnoi25@gmail.com>

# Set correct environment variables.
ENV DEBIAN_FRONTEND=noninteractive
ENV HOME /root

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -

# Ubuntu Package Upgrade
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install curl ca-certificates wget gnupg git bzip2 build-essential zip unzip nodejs php ssh npm locales -y --no-install-recommends

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
RUN git clone https://github.com/utkarsh-vishnoi/core.git /root/c9
WORKDIR /root/c9
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8
ENV LANG en_US.UTF-8 
ENV LC_ALL en_US.UTF-8
RUN scripts/install-sdk.sh

# Installing Proxy Server
ADD server.js app.js package.json /root/proxy-server/
WORKDIR /root/proxy-server
RUN npm install

# Installing Foreman & Adding Procfile
RUN npm install -g foreman
Add Procfile /root

WORKDIR /root
CMD nf start

