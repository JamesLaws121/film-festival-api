import {Express} from "express";
import {rootUrl} from "./base.server.routes";
import * as film from '../controllers/film.server.controller';
import * as filmImages from '../controllers/film.image.server.controller';
import * as filmReviews from '../controllers/film.review.server.controller';
import * as authenticate from "../middleware/authenticate";

module.exports = (app: Express) => {
    app.route(rootUrl+'/films')
        .get(film.viewAll)
        .post(authenticate.loginRequired, film.addOne);

    app.route(rootUrl+'/films/genres')
        .get(film.getGenres);

    app.route(rootUrl+'/films/:id')
        .get(film.getOne)
        .patch(authenticate.loginRequired, film.editOne)
        .delete(authenticate.loginRequired, film.deleteOne);

    app.route(rootUrl+'/films/:id/reviews')
        .get(filmReviews.getReviews)
        .post(authenticate.loginRequired, filmReviews.addReview);

    app.route(rootUrl+'/films/:id/image')
        .get(filmImages.getImage)
        .put(authenticate.loginRequired, filmImages.setImage);
}