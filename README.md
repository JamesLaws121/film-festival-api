# SENG365 Assignment 1 API Server (Film Festival)

## Summary 
A RESTful API for a film festival website using Node.js with Express

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages.
2. Create a file called `.env`, following the instructions in the section below.
3. Go to https://dbadmin.csse.canterbury.ac.nz and create a database with the name that you set in the `.env` file.
2. Run `npm run start` or `npm run debug` to start the server.
3. The server will be accessible on `localhost:4941`.

### `.env` file

Create a `.env` file in the root directory of this project including the following information (note that you will need
to create the database first in phpMyAdmin):

```
SENG365_MYSQL_HOST={your host}
SENG365_MYSQL_USER={your usercode}
SENG365_MYSQL_PASSWORD={your password}
SENG365_MYSQL_DATABASE={database name}
```
