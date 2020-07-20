const express = require('express');
const app = express();
const port = 5000;

const config = require('./config/key');
const bodyParser = require('body-Parser');
// 요청된 쿠키 쉽게 추출할 수 있도록 도와주는 미들웨어
const cookieParser = require('cookie-parser');

const { auth } = require('./middleware/auth');
const { User } = require('./models/User');

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


app.get('/', (req, res) => res.send('Hello World! 안녕하세요'));

// 회원 가입
app.post('/api/users/register', (req, res) => {
    //회원가입 할때 필요한 정보들을 client에서 가져오면
    //그것들을 DB에 넣어준다.
    const user = new User(req.body);

    user.save((err, userInfo) => {
        if(err) return res.json({ success: false, err });
        return res.status(200).json({
            success: true
        });
    });
})

// 로그인
app.post('/api/users/login', (req, res) => {
    //요청된 이메일을 DB에서 찾는다
    User.findOne({ email: req.body.email }, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "제공된 이메일에 해당하는 유저가 없습니다."
            });
        }

        //요청된 이메일이 DB의 있다면 비밀번호가 맞는지 확인
        user.comparePassword(req.body.password, (err, isMacth) => {
            if(!isMacth) { 
                return res.json({ 
                    loginSuccess: false,
                    message: "비밀번호가 틀렸습니다."
                });
            }

            //비밀번호가 맞다면 토큰 생성 
            user.generateToken((err, user) => {
                if(err) return status(400).send(err);

                //토큰을 쿠키/로컬스토리지/세션 등에 저장한다. -> 쿠키에 저장(cookie parser install)
                res.cookie("x_auth", user.token)
                .status(200)
                .json({ loginSuccess: true, userId: user._id});
            })
        })
    })
})

// 인증 처리
app.get('/api/users/auth', auth, (req, res) => {
    // 여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication에 True라는 것
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.image
    });
})

// 로그아웃
app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
        if(err) return res.json({ success: false, err});

        return res.status(200).send({
            success: true
        });
    })
})

app.get('/api/hello', (req, res) => {
    res.send("안녕하세요");
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`));