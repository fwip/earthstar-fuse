const Fuse = require('fuse-native')
const fs = require('fs')
const Path = require('path')

const commander = require('commander');

const mnt = '/Volumes/projects/futz/earthstar-fuse/.testing/mnt'
const db = '/Volumes/projects/futz/earthstar-fuse/.testing/demo.sqlite'
const keypair = '/Volumes/projects/futz/earthstar-fuse/.testing/author-keypair.json'

const {
    StorageSqlite,
    ValidatorEs4,
    // generateAuthorKeypair,
    // syncLocalAndHttp,
    WriteResult,
    isErr,
} = require('earthstar');
const { exit } = require('process');

const app = new commander.Command()
  .name("earthstar-fuse")
app
  .command("mnt <mnt> <db> <authorFile>")
  .description("Mount the sqlite <db> at <mnt>")
  .option("-v, --verbose", "Enable verbose logging")
  .action((mnt, db, authorFile, cliOpts) => {

    let VALIDATORS = [ValidatorEs4];
    let FORMAT = 'es.4';
    const storage = new StorageSqlite({
      mode: 'open',
      workspace: null,
      validators: VALIDATORS,
      filename: db,
    })
    const keypair = JSON.parse(fs.readFileSync(authorFile, 'utf8'));

    function stat(st) {
      return {
        mtime: st.mtime || new Date(),
        atime: st.atime || new Date(),
        ctime: st.ctime || new Date(),
        size: st.size !== undefined ? st.size : 0,
        mode: st.mode === 'dir' ? 16877 : (st.mode === 'file' ? 33188 : (st.mode === 'link' ? 41453 : st.mode)),
        uid: st.uid !== undefined ? st.uid : process.getuid(),
        gid: st.gid !== undefined ? st.gid : process.getgid()
      }
    }

    const fileHandles = new Map()
    let curFd = 0
    function addFh(path, flags) {
      curFd += 1
      fileHandles.set(curFd, {path, flags})
      return curFd
    }
    function rmFh(fd) {
      fileHandles.delete(fd)
    }

    const ops = {
      readdir: function (path, cb) {
        if (! path.endsWith('/')) {
          path += '/'
        }
        let paths = Array.from(new Set(
          storage.paths({pathPrefix: path})
            .map(p => p.replace(path, ''))
            .map(p => p.split('/')[0])
        ))
        if (paths.length > 0) {
          return cb(null, paths)
        }
        
        return cb(Fuse.ENOENT)
      },
      getattr: function (path, cb) {
        // Test if file
        let paths = storage.paths({path: path})
        if (paths.length === 1) {
          let doc = storage.getDocument(path)
          // TODO: use timestamp to set time, author to set user ownership?
          // TODO: If has special characters, convert to posix permissions
          return cb(null, stat({ mode: 'file', size: doc.content.length }))
        }
        // Test if directory
        paths = storage.paths({pathPrefix: path})
        if (paths.length > 0) {
           return cb(null, stat({ mode: 'dir', size: 4096}))
        }

        return cb(Fuse.ENOENT)
      },
      open: function (path, flags, cb) {
        return cb(0, addFh(path, flags))
      },
      release: function (path, fd, cb) {
        rmFh(fd)
        return cb(0)
      },
      read: function (path, fd, buf, len, pos, cb) {
        let str = storage.getContent(path).slice(pos, pos + len)
        console.log("read", {path, fd, len, pos, str})
        if (!str) return cb(0)
        buf.write(str)
        return cb(str.length)
      },
    }


    const fuse = new Fuse(mnt, ops, { debug: cliOpts.verbose, force: true })
    fuse.mount(function (err) {
      if (err) {
        console.error(`ERROR: ${err}`)
        exit(1)
      }
    })

  })

app.parse(process.argv)