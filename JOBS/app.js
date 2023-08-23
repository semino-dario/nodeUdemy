const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDatabase = require('./config/database');
const errorMiddleware = require('./middlewares/errors');
const ErrorHandler = require('./utils/errorHandler');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors')
const bodyParser = require('body-parser');

//Setting un config.env file variables
dotenv.config({ path: './config/config.env' });

//Handling uncaught exception
process.on('uncaughtException', err => {
    console.log(`Error ${err.message}`);
    console.log('Shutting down due to uncaught exception');
    process.exit(1)
})

//Connecting to db
connectDatabase();

//Setup body parser
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))

//Setup secutity headers
app.use(helmet())

app.use(express.json());

app.use(cookieParser());

app.use(fileUpload());

app.use(mongoSanitize()) // sanitize data

app.use(xssClean()); //prevents xss attacks

app.use(hpp({
    whitelist: ['positions']
})); // prevent parameters pollution


//Rate limiting

const limiter = rateLimit({
    windowMS: 10 * 60 * 1000,
    max: 100
});

app.use(limiter);

//Setup cors - enables access from other domains
app.use(cors())

//Importing routes
const jobs = require('./routes/jobs');
const auth = require('./routes/auth');
const user = require('./routes/user');

app.use('/api/v1', jobs);
app.use('/api/v1', auth);
app.use('/api/v1', user);

//Handle unhandled routes
app.all('*', (req, res, next) => {
    next(new ErrorHandler(`${req.originalUrl} route not found`, 404))
})

app.use(errorMiddleware);

const PORT = process.env.PORT;

const server = app.listen(PORT, () => {
    console.log(`server is started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
}
)

// Handling unhandled promise rejection
process.on("unhandledRjection", err => {
    console.log(`Error ${err.message}`)
    console.log('Shuting down the server due to unhandled promise rejection')
    server.close(() => {
        process.exit(1);
    })
});

//Connect to the database before listening
// connectDatabase().then(() => {
//     app.listen(PORT, () => {
//         console.log("listening for requests");
//     })
// })