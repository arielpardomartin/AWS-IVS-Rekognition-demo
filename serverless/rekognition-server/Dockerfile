FROM node:lts-alpine

# Environment variables
ARG ENV_DEBUG_CONFIDENCE_THRESHOLD ""
ENV DEBUG_CONFIDENCE_THRESHOLD $ENV_DEBUG_CONFIDENCE_THRESHOLD

WORKDIR /usr/src/rekognition
RUN apk add --no-cache --virtual .gyp python3 make g++ ffmpeg procps
COPY . ./
RUN npm install --silent
RUN mkdir /tmp/screenshots-original
RUN mkdir /tmp/screenshots-renamed
RUN chmod +x run.sh
CMD sh run.sh