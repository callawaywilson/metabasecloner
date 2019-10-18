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

Clone Collection
clone -h host -u user -t type(question|collection|dashboard) -i SourceID -c TargetCollectionID -d TargetDatabaseID

Clone Dashboard
clone -h host -s session -t dashboard -i SourceID -d TargetDBID -c TargetCollectionID


## Dashboard cloning instructions:

### Step 1 - Create the new DB Connection

Create a new database connection on the metabase server and record the ID as the `DatabaseId`.  You'll be able to find the ID at the end of the URL in your browser, e.g. `/admin/databases/<DatabaseId>` while viewing it.

### Step 2 - Create the new Collection

Create the new collection on the metabase server and record the new ID as the `NewCollectionId`.  You'll be able to find the ID at the end of the URL in your browser, e.g. `/collections/<NewCollectionId>` while viewing it.

### Step 3 - Get the ID of the collection you want to clone

Navigate to the collection that needs to be copied.  Record the ID as `OldCollectionId`.  You'll be able to find the ID in the URL bar, same as the new collection id.

### Step 4 - Open this project on the command line

Navigate to the root of this project on a command line.  Make sure that you have Node.js installed.  If you don't have it installed, you can find an installer at https://nodejs.org/en/.

### Step 5 - Clone the collection

With the 3 IDs from steps 1-3, execute the script to clone the collection:

```
$ node clone.js -h <host> -u <username> -t collection -i <OldCollectionId> -c <NewCollectionId> -d <DatabaseId>
```

Where `host` is just the domain name of the metabase server (e.g. `metabase.yourdomain.com`) and `username` is the email/user you use to log in to the server.

You'll be prompted for your password and the script will display the items as they are cloned.

### Step 6 - Clone each dashboard

Once the collection is cloned, you'll be able to clone each dashboard.  For each, you'll need to find the `DashboardId`. You can find this at the end of the URL when viewing the dashboard, e.g. `/dashboard/<DashboardId>`.

For each of the dashboards, you can clone them to the new collection with the script:

```
$ node clone.js -h <host> -u <username> -t dashboard -i <DashboardId> -c <NewCollectionId> -d <DatabaseId>
```
