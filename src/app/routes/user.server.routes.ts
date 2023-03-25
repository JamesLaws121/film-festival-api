import {Express} from "express";
import {rootUrl} from "./base.server.routes";
import * as user from '../controllers/user.server.controller';
import * as userImages from '../controllers/user.image.server.controller';
import * as authenticate from '../middleware/authenticate';

module.exports = (app: Express) => {
    app.route(rootUrl+'/users/register')
        .post(user.register);

    app.route(rootUrl+'/users/login')
        .post(user.login);

    app.route(rootUrl+'/users/logout')
        .post(authenticate.loginRequired, user.logout);

    app.route(rootUrl+'/users/:id')
        .get(authenticate.loginRequired, user.view)
        .patch(authenticate.loginRequired, user.update);

    app.route(rootUrl+'/users/:id/image')
        .get(userImages.getImage)
        .put(authenticate.loginRequired, userImages.setImage)
        .delete(authenticate.loginRequired, userImages.deleteImage)
}