const express = require('express');
const app = express();
const path = require("path");
const port = 5000;

const config = require('./config/key');
const bodyParser = require('body-Parser');
// 요청된 쿠키 쉽게 추출할 수 있도록 도와주는 미들웨어
const cookieParser = require('cookie-parser');
const cors = require('cors');

const { auth } = require('./middleware/auth');
const { User } = require('./models/User');

app.use(cors());

//분석해서 가져옴   
//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

//application/json
app.use(bodyParser.json());
app.use(cookieParser());

//DB 연결
const mongoose = require('mongoose');

mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true
}).then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));


app.use('/api/users', require('./routes/users'));

app.get("*", (req, res) => {
    res.sendFile(path.resolve(___dirname, "../client", "build", "index.html"));
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));