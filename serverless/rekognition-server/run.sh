#!/bin/sh

screenshots_per_second=5

while :
do
  echo "Loop start"

  base_feed_time=$(ffprobe -v error -show_entries format=start_time -of default=noprint_wrappers=1:nokey=1 $RTMP_INPUT)
  echo "base_feed_time value: ${base_feed_time}"

  if [ ! -z "${base_feed_time}" ]
  then    
    base_seconds_since_epoch=$(date +%s)
    echo "base_seconds_since_epoch value: ${base_seconds_since_epoch}"

    node src/watcherRenameFiles.js & node src/watcherProcessFiles.js $base_feed_time $base_seconds_since_epoch & ffmpeg -i $RTMP_INPUT -vf fps=${screenshots_per_second} -f image2 -strftime 1 "/tmp/screenshots-original/%s.png"
    # terminate watchers
    pkill -f node
    echo "Processes running after execution:"
    ps -ef
  else
    echo "Could not retrieve base_feed_time to start the Rekognition process. This may be related to an error when obtaining the value or because there is no input feed to get the value from."
  fi

  echo "Loop finish"
  sleep 30
done