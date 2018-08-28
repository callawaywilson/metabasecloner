A quick script to clone Metabase questions from one database to another in collections.  Usage:

```
$ node clone.js <options>
```

- `-h` or `--host` - Hostname of the Metabase server
- `-u` or `--user` - Username to log in with, will be prompted for password
- `-s` or `--session` - Session ID to use
- `-i` or `--id` - ID of object to clone
- `-t` or `--type` - Type of object to clone [question, collection, dashboard]
- `-c` or `--collection` - ID of collection to put in
- `-d` or `--database` - ID of database to put new object in

Note: To clone a dashboard, questions in the source dashboard must exist in the new collection with the same name.