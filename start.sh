#!/bin/sh
# turn on bash's job control
set -m
nginx&
pm2-runtime server.js
