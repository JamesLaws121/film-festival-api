import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.server.model";
import * as schemas from "../resources/schemas.json";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {addFilmReview} from "../models/film.server.model";

const ajv = new Ajv({removeAdditional: 'all', strict: false});
addFormats(ajv);
ajv.addFormat("integer", /[0-9]+/)
ajv.addFormat("datetime", /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)
const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if(!valid) {
            return ajv.errorsText(validator.errors);
        }
        return true;
    } catch (err) {
        return err.message;
    }
}

const getReviews = async (req: Request, res: Response): Promise<void> => {
    const filmId = req.params.id
    try{
        const result = await films.getFilmReviews(parseInt(filmId, 10));

        if (result.length === 0) {
            res.status(404).send("Not Found. No film with id");
            return;
        }

        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const addReview = async (req: Request, res: Response): Promise<void> => {
    const filmId = req.params.id
    const userId = req.body.authenticatedUserId;

    const validation = await validate(schemas.film_review_post, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send('Bad Request. Invalid information');
        return;
    }

    const rating = req.body.rating;
    let review = "";
    if (req.body.review) {
        review = req.body.review;
    }

    if (userId === null) {
        res.status(401).send('Unauthorized');
        return;
    }

    const foundFilms = await films.getFilmById(parseInt(filmId, 10));

    if (foundFilms.length === 0) {
        res.status(404).send('Not Found. No film found with id');
        return;
    }

    const directorId = films.getDirector(parseInt(filmId, 10));
    if (userId === directorId) {
        res.status(403).send('Forbidden. Cannot review your own film, or cannot post a review on a film that has not yet released');
        return;
    }

    try{
        const result = await addFilmReview(parseInt(filmId, 10), parseInt(userId, 10), rating, review)

        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}



export {getReviews, addReview}