# earthstar-fuse

A proof-of-concept implementation of [FUSE](https://www.wikiwand.com/en/Filesystem_in_Userspace) on top of [Earthstar](https://github.com/earthstar-project/earthstar).

This means that you can take a database that backs an Earthstar workspace and interact with it as if it were just a whole bunch of files in folders.

## Caveats

0. This is pre-alpha quality software.
1. This has only been tested on 1 machine for about 10 minutes.
2. A couple times when developing it, it locked up my mac and I had to reboot.
3. Performance is quite bad.
4. It might corrupt your data, please back it up first.

Only tested on a Macbook Pro running Catalina. Might work on Linux, almost definitely doesn't work on Windows.

## Roadmap

* [x] Viewing documents as files
* [ ] Writing documents
* [ ] Tests
* [ ] Performance

## Quickstart

In the below steps, `/path/to/mnt/` is the full path to a directory of your choice. This directory should exist and also be empty.

1. Clone the repo
2. `npm install`
3. `npm src/index.js /path/to/mnt/ my.sqlite author-keypair.json`
4. In a new window, do `ls /path/to/mnt/`

If you get a mysterious error, file an issue and/or check out [these troubleshooting steps](https://github.com/fuse-friends/fuse-native#cli) to enable FUSE.