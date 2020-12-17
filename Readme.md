# Stats viewer backend

Backend for the [Roll20 stats viewer](https://github.com/SoTrxII/roll20-stats-viewer) project.

## Features

- Aggregate general info on campaigns, such as time played or dice rolled count
- Display charts dice chart for each individual session of for the whole campaign
- Separate game session from one another

### Modes

Using env variables, it's possible to configure this project to work in two different ways.

#### Dynamic mode

This is the "multi-user" mode. The login and password must be passed in each request.

#### Static mode

This mode using a single Roll20 account, specified in the env variables.

## Assumptions

To retrieve data, some assumptions are made on the way Roll20 is used.

### Defining a game session

The data used tell game session apart is the chat log of each game. From this log, the following assumptions are made:
- An *event* is either a dice roll or a message. An event has an author.
- Two events (e1,e2) are grouped together if  they are less than 20h apart.
- A game session is a collection of event **not having the campaign GM for sole author**.

A game session having the GM for sole author is considered to be a map making / system testing session and doesn't count.

## Building your own instance

### Configuration
Create a `.env.production` file and fill it with these values :
```dosini
# Account for 
ROLL20_LOGIN=ruby.saltprincess@gmail.com
ROLL20_PASSWORD=dQF3/Feu8]MMBrqR
# See modes. Backend must be configured accordingly.
VUE_APP_AUTH=<DYNAMIC||STATIC>
```
### Docker
```sh
# In the project directory
docker build -t stats-viewer-backend .
# Running it on port 8089
docker run -p 8089:80 \
  -e ROLL20_LOGIN=<Roll20_login> \
  -e ROLL20_PASSWORD=<Roll20_password> \
  -e VUE_APP_AUTH=<DYNAMIC||STATIC> \
  -it stats-viewver-backend
```