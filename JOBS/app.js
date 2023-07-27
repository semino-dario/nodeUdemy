const express = require('express');
const app = express();
const dotenv = require('dotenv')
const connectDatabase = require('./config/database')

//Setting un config.env file variables
dotenv.config({ path: './config/config.env' })

//Connecting to db
connectDatabase();

app.use(express.json());

//Importing routes
const jobs = require('./routes/jobs');


app.use('/api/v1', jobs);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`server is started on port ${process.env.PORT} in ${process.env.NODE_ENV} mode.`)
}
)
