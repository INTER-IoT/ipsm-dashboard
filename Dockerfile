# base image
FROM node:8

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y libsasl2-dev && apt-get install -y libyajl-dev \
	&& mkdir -p /soft && cd /soft \
	&& git clone https://github.com/edenhill/librdkafka.git \
	&& cd librdkafka && ./configure && make && make install && ldconfig \
	&& cd .. \
	&& git clone https://github.com/edenhill/kafkacat.git \
	&& cd kafkacat && ./configure && make && make install \
	&& mkdir /dashboard

WORKDIR /dashboard

COPY . /dashboard

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]
