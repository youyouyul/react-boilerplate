# react-boilerplate
#### React와 Node의 기본 개념과 구조를 익히며 웹 서비스의 기본이 되는 <로그인>, <로그아웃>, <회원 가입>, <인증 체크> 페이지 구현       
##### (Inflearn 강좌 중 '따라하며 배우는 노드, 리액트 시리즈 - 기본 강의' 참고)
<hr>


1. 기술 스택
    - Server
        > Node, Express, MongoDB, bcrypt, nodemon, cookie-parser, JWT

    - Client
       > React, React-Router-Dom, Redux, Axios, Proxy, antd

<br>

2. Build
- concurrently 이용하여 한번에 빌드
     > "dev": "concurrently \"npm run backend\" \"npm run start --prefix client\""
    
     > : npm run dev

<br>

3. 구조
    - Server : port 5000
        > npm init 으로 node기반 백엔드 생성
        >   >- config : 개발 서버(dev.js), 배포 서버(prod.js) 나눔
        >   >- middleware : 인증 처리
        >   >- models : User Schema 생성  

    - Client : port 3000
        > npx create-react-app 으로 리액트 환경세팅 (npx : disk낭비 줄어주며 최신버전 사용 가능)
        >   >- actions / reducers : Redux 위한 폴더
        >   >- components : 페이지 관련
        >   >- hoc : 인증 처리

<br>

3. Server 주요 기능
    - DB 연결 
        ```javascript
        const mongoose = require('mongoose');

        mongoose.connect(config.mongoURI, {
            useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: true
        }).then(() => console.log('MongoDB Connected...'))
        .catch(err => console.log(err));
        ``` 
    - Bcrypt로 암호화
        ```javascript
        const saltRounds = 10;

        // 회원가입 로직에서 save함수 실행 전 암호화
        userSchema.pre('save', function( next ){

            var user = this;

            // 비밀번호가 수정될 때에만 수행
            if(user.isModified('password')) {
                //salt 생성하여 비밀번호를 암호화 시킨다.
                bcrypt.genSalt(saltRounds, function(err, salt) {
                    if(err) return next(err);

                    bcrypt.hash(user.password, salt, function(err, hash) {
                        if(err) return next(err);

                        user.password = hash;
                        next();
                    });
                });
            } else {
                next();
            }
        })
        ```
    - jwt 이용해서 토큰 생성
        ```javascript
        userSchema.methods.generateToken = function(cb) {
            var user = this;

            // user._id.toHexString() + 'secretToken' 으로 토큰 생성됨
            var token = jwt.sign(user._id.toHexString(), 'secretToken')

            user.token = token;
            user.save(function(err, user) {
                if(err) return cb(err);
                cb(null, user);
            });
        }
        ```
        ```javascript
        // 생성된 토큰 쿠키에 저장
        user.generateToken((err, user) => {
            if(err) return status(400).send(err);

            // cookie parser
            res.cookie("x_auth", user.token)
            .status(200)
            .json({ loginSuccess: true, userId: user._id});
        })
        ```
    - 인증 처리
        > 페이지 이동 때마다 로그인 및 관리자 체크
        ```javascript
        // 토큰 복호화 하여 유저아이디 이용해서 유저를 찾은 후
        // 클라이언트에서 가져온 토큰과 DB에 보관된 토큰이 일치하는지 확인
        userSchema.statics.findByToken = function(token, cb) {
            var user = this;

            jwt.verify(token, 'secretToken', function(err, decoded) {
                user.findOne({"_id": decoded, "token": token}, function(err, user) {
                    if(err) return cb(err);
                    cb(null, user);
                })
            });
        }
        ```
        ```javascript
        // 인증 처리
        let auth = ( req, res, next) => {

            //1. 클라이언트 쿠키에서 토큰 가져옴
            let token = req.cookies.x_auth;

            //2. 토큰을 복호화 한 후 유저를 찾는다
            User.findByToken(token, (err, user) => {
                if(err) throw err;
                        
                //3. 유저가 없으면 인증 No
                if(!user) return res.json({ isAuth: false, error: true })

                //4. 유저가 있으면 인증 Okay
                req.token = token;
                req.user = user;

                next();
            })
        }
        ```
<br>

4. Client 주요 기능
    - React Router Dom 으로 페이지 이동
        ```HTML
        <Router>
            <div>
                <Switch>
                <Route exact path="/" component={ Auth(LandingPage, null) } /> 
                ...
        ```
    - Proxy 설정
        >- 다른 포트에서 Request보낼 수 없는 CORS 이슈 해결 위해 Proxy 사용
        >- IP를 Proxy Server에서 임의로 변경 가능 
        >   - 인터넷 사용 제어 가능
        >   - 케쉬 이용해 빠른 인터넷 이용
        >   - 더 나은 보안 제공
        ```javascript
        const { createProxyMiddleware } = require('http-proxy-middleware');

        module.exports = function(app) {
            app.use(
                '/api',
                createProxyMiddleware({
                    target: 'http://localhost:5000',
                    changeOrigin: true,
                })
            );
        };
        ```
    - 타입 관리
        ```javascript
        export const LOGIN_USER = 'login_user';
        // ...
        ```
    - Reducer 
        - 이전 State와 action object 받은 후 next state를 return
        ```javascript
        export default function (state = {}, action) {
            switch (action.type) {
                case LOGIN_USER:
                    return {...state, loginSuccess: action.payload}
                    break;
                // ...
        }
        ```
    - 주요 기능 (로그인 / 회원가입 / 인증처리)
        ```javascript
        // Redux data flow 
        // react component -> dispatch -> action -> reducer -> store -> react component
        
        //...
        dispatch(loginUser(body))
            .then(response => {
                if(response.payload.loginSuccess) {
                    props.history.push('/');
                } else {
                    alert('Error')
                }
            });
        //...
        ```
        ```javascript
        export function loginUser(dataToSubmit) {
            // axios 통해 서버와 통신하여 데이터 받아옴
            const request = axios.post('/api/users/login', dataToSubmit)
            .then(response => response.data)

            return {
                // 액션 종류 타입
                type: LOGIN_USER,
                // 액션 실행에 필요한 데이터
                payload: request
            }
        }
        ```
    - 인증 처리
        - 로그인 상태에서 회원가입 페이지 진입 불가 등의 인증 처리    
        ```javascript
        //function(컴포넌트, 옵션, 관리자 진입 페이지 설정)
        export default function(SpecificComponent, option, adminRoute = null) {
            //option 
                //null : 아무나 출입
                //true : login 한 유저만 출입
                //false : login 한 유저는 출입 불가능

            //...
            useEffect(() => {
                dispatch(auth()).then(response => {
            // ...
        ```
