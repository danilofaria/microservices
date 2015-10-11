FROM node:0.10

USER root

ENV AP /data/app
ENV SCPATH /etc/supervisor/conf.d

RUN apt-get -y update

# The daemons
RUN apt-get -y install supervisor
RUN mkdir -p /var/log/supervisor

# Supervisor Configuration
ADD ./supervisord/conf.d/* $SCPATH/

# Application Code
ADD . $AP/

WORKDIR $AP

RUN npm install

CMD ["node", "index.js"]
# CMD ["supervisord", "-n"]
