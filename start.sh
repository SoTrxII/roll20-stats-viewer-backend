#!/bin/sh
# turn on bash's job control
set -m
nginx&
PORT=8089 pm2-runtime server.js
