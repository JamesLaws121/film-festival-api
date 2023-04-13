import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.server.model";
import Query from "mysql2/typings/mysql/lib/protocol/sequences/Query";
import * as schemas from "../resources/schemas.json";
import Ajv from "ajv";
import addFormats from "ajv-formats"
import {type} from "os";
import {deleteFilm, getFilm, getReviewsByFilm} from "../models/film.server.model";
import logger from "../../config/logger";
import fs from "fs";

const ajv = new Ajv({removeAdditional: 'all', strict: false});
addFormats(ajv);
ajv.addFormat("integer", /[0-9]+/)
ajv.addFormat("datetime", /[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}/)
const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if (!valid) {
            return ajv.errorsText(validator.errors);
        }
        return true;
    } catch (err) {
        return err.message;
    }
}


const viewAll = async (req: Request, res: Response): Promise<any> => {

    try {
        const validation = await validate(
            schemas.film_search,
            req.query);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send('Bad Request. Invalid information');
            return;
        }

        let startIndex = 0;
        let count = null;
        let qQuery = null;
        let directorId = 'director_id';
        let genreIds = (await films.getGenreIds());
        let ageRatings = ['G', 'PG', 'M', 'R13', 'R16', 'R18', 'TBC'];
        let reviewerId = null;
        let sortBy = "release_date"

        if ((req.query.reviewerId)) {
            reviewerId = req.query.reviewer_id as string;
        }
        if ((req.query.startIndex)) {
            startIndex = parseInt((req.query.startIndex as string), 10);
        }
        if ((req.query.count)) {
            count = parseInt(req.query.count as string, 10);
        }
        if ((req.query.q)) {
            qQuery = req.query.q as string;
        }

        if ((req.query.directorId)) {
            directorId = req.query.directorId as string;
        }
        if ((req.query.genreIds)) {
            const givenGenreIds = req.query.genreIds as string;
            if (typeof givenGenreIds === "string") {
                if (!(givenGenreIds in genreIds)) {
                    res.status(400).send('Bad Request. Invalid information');
                    return;
                } else {
                    genreIds = [givenGenreIds];
                }
            } else {
                for (const genre of req.query.genreIds as string[]) {
                    if (!(genre in genreIds)) {
                        res.status(400).send('Bad Request. Invalid information');
                        return;
                    }
                }
                genreIds = givenGenreIds;
            }
        }

        if ((req.query.ageRatings)) {
            const givenAgeRating = req.query.ageRatings as string;
            if (typeof givenAgeRating === "string") {
                if (!(givenAgeRating in ageRatings)) {
                    res.status(400).send('Bad Request. Invalid information');
                    return;
                } else {
                    ageRatings = [givenAgeRating];
                }
            } else {
                for (const rating of req.query.ageRatings as string[]) {
                    if (!(ageRatings.indexOf(rating) > -1)) {
                        Logger.info("hello");
                        res.status(400).send('Bad Request. Invalid information');
                        return;
                    }
                }
                ageRatings = givenAgeRating;
            }
        }
        if ((req.query.reviewerId)) {
            reviewerId = req.query.reviewerId as string;
        }
        if ((req.query.sortBy)) {
            sortBy = req.query.sortBy as string;
            if (sortBy === 'ALPHABETICAL_ASC') {
                sortBy = 'title, film.id';
            } else if (sortBy === 'ALPHABETICAL_DESC') {
                sortBy = 'title DESC, film.id';
            } else if (sortBy === 'RELEASED_DESC') {
                sortBy = 'release_date DESC, film.id';
            } else if (sortBy === 'RATING_ASC') {
                sortBy = 'ifnull(avg(film_review.rating), 0), film.id';
            } else if (sortBy === 'RATING_DESC') {
                sortBy = 'ifnull(avg(film_review.rating), 0) DESC, film.id';
            } else {
                sortBy = 'release_date';
            }
        }
        const ageRatingsFixed = "'" + ageRatings.join("','") + "'";
        let results = await films.getFilms(qQuery, directorId, genreIds.toString(), ageRatingsFixed, reviewerId, sortBy);

        const length = results.length;
        ;
        if (count !== null) {
            if (startIndex + count > results.length) {
                res.status(400).send("Bad Request");
                return;
            }
            results = results.slice(startIndex, count);
        }

        res.status(200).send({"films": results, "count": length});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addOne = async (req: Request, res: Response): Promise<void> => {

    try {
        const directorId = req.body.authenticatedUserId;
        if (directorId === null) {
            res.status(401).send('Unauthorized');
            return;
        }

        const validation = await validate(schemas.film_post, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send('Bad Request. Invalid information');
            return;
        }

        if (!(req.body.title)) {
            res.status(400).send("Bad Request");
            return;
        }
        const title = req.body.title;
        const findTitle = await films.getFilmByTitle(title);
        if (findTitle.length !== 0) {
            res.status(403).send("Forbidden. Film title is not unique, or cannot release a film in the past");
            return;
        }

        if (!(req.body.description)) {
            res.status(400).send("Bad Request");
            return;
        }
        const description = req.body.description;

        const genreId = req.body.genreId;
        if (genreId === null) {
            res.status(400).send("Bad Request");
            return;
        }

        const currentDate = new Date();
        let releaseDate = null;

        if (req.body.releaseDate) {
            const dateString = req.body.releaseDate as string;
            releaseDate = new Date(Date.parse(dateString))

            if (releaseDate.getTime() < Date.now()) {
                res.status(403).send("Forbidden. Film title is not unique, or cannot release a film in the past");
                return;
            }
        } else {
            releaseDate = currentDate;
        }

        let runtime = null;
        if (req.body.runtime) {
            runtime = req.body.runtime;
        }
        let ageRating = 'TBC';
        if (req.body.ageRating) {
            ageRating = req.body.ageRating as string;
        }
        const result = await films.addFilm(title, description, genreId, releaseDate, runtime, directorId, ageRating);
        res.status(201).send({"filmId": result.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {

    try {
        const filmId = req.params.id
        const result = await films.getFilm(parseInt(filmId, 10));

        if (result.length === 0) {
            res.status(404).send("Not Found. No film with id");
            return;
        }

        res.status(200).send(result[0]);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {

    try {
        const directorId = req.body.authenticatedUserId;

        if (directorId === null) {
            res.status(401).send('Unauthorized');
            return;
        }

        const validation = await validate(schemas.film_patch, req.body);
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`;
            res.status(400).send('Bad Request. Invalid information');
            return;
        }

        const filmId = req.params.id;
        const foundFilms = await films.getFilmById(parseInt(filmId, 10));

        if (foundFilms.length === 0) {
            res.status(404).send('Not Found. No film found with id');
            return;
        }
        const foundFilm = foundFilms[0]

        let filmDirector = await films.getDirector(parseInt(filmId, 10));
        filmDirector = filmDirector[0][0].directorId;

        if (directorId !== filmDirector) {
            res.status(403).send('Forbidden. Only the director of an film may change it,' +
                ' cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed, or cannot release a film in the past');
            return;
        }

        const reviewMade = await films.getReviewsByFilm(parseInt(filmId, 10));

        if (reviewMade.length !== 0) {
            res.status(403).send('Forbidden. Only the director of an film may change it,' +
                ' cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed, or cannot release a film in the past');
            return;
        }

        const genreIds = (await films.getGenreIds());

        let title = foundFilm.title;
        let description = foundFilm.description;
        let releaseDate = foundFilm.releaseDate;
        let genreId = foundFilm.genreId;
        let runtime = foundFilm.runtime;
        let ageRating = foundFilm.ageRating;

        if (typeof (req.body.title) !== 'undefined') {
            title = req.body.title;
            if (title.length === 0) {
                res.status(400).send('Bad Request. Invalid information');
                return;
            }
        }
        if (typeof (req.body.description) !== 'undefined') {
            description = req.body.description;
            if (description.length === 0) {
                res.status(400).send('Bad Request. Invalid information');
                return;
            }
        }
        if (typeof (req.body.releaseDate) !== 'undefined') {
            if (releaseDate.getTime() <= Date.now()) {
                res.status(403).send("Forbidden. Only the director of an film may change it," +
                    " cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed," +
                    " or cannot release a film in the past");
                return;
            }
            const dateString = req.body.releaseDate as string;
            releaseDate = new Date(Date.parse(dateString))

            if (releaseDate.getTime() < Date.now()) {
                res.status(403).send("Forbidden. Only the director of an film may change it," +
                    " cannot change the releaseDate since it has already passed, cannot edit a film that has a review placed," +
                    " or cannot release a film in the past");
                return;
            }
        }
        if (typeof (req.body.genreId) !== 'undefined') {
            const givenGenreId = req.body.genreId;
            if (!(givenGenreId in genreIds)) {
                res.status(400).send('Bad Request. Invalid information');
                return;
            }
            genreId = parseInt(givenGenreId, 10);
        }
        if (req.body.runtime) {
            runtime = req.body.runtime;
        }
        if (req.body.ageRating) {
            ageRating = req.body.ageRating;
        }
        const result = await films.alterFilm(parseInt(filmId, 10), title, description, releaseDate, genreId,
            runtime, ageRating);
        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteOne = async (req: Request, res: Response): Promise<void> => {

    try {
        const directorId = req.body.authenticatedUserId;
        if (directorId === null) {
            res.status(401).send('Unauthorized');
            return;
        }
        const filmId = req.params.id;
        const foundFilms = await films.getFilmById(parseInt(filmId, 10));

        if (foundFilms.length === 0) {
            res.status(404).send('Not Found. No film found with id');
            return;
        }

        let filmDirector = await films.getDirector(parseInt(filmId, 10));
        filmDirector = filmDirector[0][0].directorId;

        if (directorId !== filmDirector) {
            res.status(403).send('Forbidden. Only the director of an film can delete it');
            return;
        }
        if (foundFilms[0].imageFilename) {
            const fileName = foundFilms[0].imageFilename;
            const filePath = "./storage/images/" + fileName;
            fs.unlink(filePath, (err) => {
                if (err) {
                    Logger.error("Photo not found");
                    res.status(500).send("Internal Server Error");
                    return;
                }
            })
        }

        const result = await deleteFilm(parseInt(filmId, 10))

        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getGenres = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await films.getGenres();
        res.status(200).send(result);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {viewAll, getOne, addOne, editOne, deleteOne, getGenres};