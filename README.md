# Voting App
This is a web application for taking polls online.

## User Stories
Designed to have these features as listed by [FreeCodeCamp](https://www.freecodecamp.com/):

- [x] As an authenticated user, I can keep my polls and come back later to access them.

- [x] As an authenticated user, I can share my polls with my friends.

- [x] As an authenticated user, I can see the aggregate results of my polls.

- [x] As an authenticated user, I can delete polls that I decide I don't want anymore.

- [x] As an authenticated user, I can create a poll with any number of possible items.

- [x] As an unauthenticated or authenticated user, I can see and vote on everyone's polls.

- [x] As an unauthenticated or authenticated user, I can see the results of polls in chart form. (Chart.js)

- [x] As an authenticated user, if I don't like the options on a poll, I can create a new option.


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

Things you need to install to run the app:

- Node
- MongoDB

### Installing

The setup is

```
git clone https://github.com/MiloATH/VotingApp.git
cd VotingApp
npm install
```

Make a copy of `sample.env` as `.env`
```
cp sample.env .env
```


Two options for the MongoDB:
First option stores the MongoDB outside of the project folder (prefered due to easier data recovery):
```
mongod
```
**OR**

Second option stores the MongoDB in the same folder as the project:
Note: stores db in data and includes flags --nojournal and --rest "$@" (see mongod file)
```
./mongod
```

In a new terminal go to the project folder (folder with server.js) and run
```
node server
```

Access the app through browser on localhost:8080 as the address.

<!--## Running the tests

TODO

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```
-->
## Deployment

Easily deployed to Heroku and MLab. Remember to set environment variables on Heroku from .env.

## Built With

* [MongoDB](https://www.mongodb.com/) - NoSQL database
* [Express.js](https://expressjs.com/) - Web application framework
* [Node.js](https://nodejs.org/en/) - Platform for network applications

## Contributing

Please open any issues that you encounter on [the GitHub repo issue page](https://github.com/MiloATH/VotingApp/issues). 

## Authors

* **Milo Hartsoe** - [MiloATH](https://github.com/MiloATH)

<!--
## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
-->
## Acknowledgments

* Hat tip to anyone who's code was used
* [Readme template used](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2)
