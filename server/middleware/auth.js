const { User } = require('../models/User');

//인증처리 하는 곳
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

module.exports = { auth };