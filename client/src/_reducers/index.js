import { combineReducers } from 'redux';
import user from './user_reducer';

// 여러 reducer들을 rootReducer에 하나로 합쳐줌
const rootReducer = combineReducers({
    user
})

export default rootReducer;