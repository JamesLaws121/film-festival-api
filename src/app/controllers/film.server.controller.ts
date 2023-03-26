import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.server.model";
import Query from "mysql2/typings/mysql/lib/protocol/sequences/Query";
import * as schemas from "../resources/schemas.json";
import Ajv from "ajv";
import addFormats from "ajv-formats"
import {type} from "os";

const ajv = new Ajv({removeAdditional: 'all', strict: false});
addFormats(ajv);
ajv.addFormat("integer", /[0-9]+/)
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


const viewAll = async (req: Request, res: Response): Promise<any> => {

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
        directorId = req.query.directorId  as string;
    }
    if ((req.query.genreIds)) {
        const givenGenreIds =  req.query.genreIds as string;
        if (typeof givenGenreIds === "string") {
            if (!(givenGenreIds in genreIds)) {
                res.status(400).send('Bad Request. Invalid information');
                return;
            } else {
                genreIds = [givenGenreIds];
            }
        } else {
            for (const genre of req.query.genreIds as string[]){
                if (!(genre in genreIds)) {
                    res.status(400).send('Bad Request. Invalid information');
                    return;
                }
            }
            genreIds = givenGenreIds;
        }
    }

    if ((req.query.ageRatings)) {
        const givenAgeRating =  req.query.ageRatings as string;
        if (typeof givenAgeRating === "string") {
            if (!(givenAgeRating in ageRatings)) {
                res.status(400).send('Bad Request. Invalid information');
                return;
            } else {
                ageRatings = [givenAgeRating];
            }
        } else {
            for (const rating of req.query.ageRatings as string[]){
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
        } else  {
            sortBy = 'release_date';
        }
    }
    try{
        const ageRatingsFixed = "'" + ageRatings.join("','") + "'";
        let results = await films.getFilms(qQuery, directorId, genreIds.toString(), ageRatingsFixed, reviewerId, sortBy);

        const length = results.length;;
        if (count !== null) {
            if (startIndex + count > results.length) {
                res.status(400).send("Bad Request");
                return;
            }
            results = results.slice(startIndex, count);
        }

        res.status(200).send({"films" : results , "count" : length});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addOne = async (req: Request, res: Response): Promise<void> => {

    const validation = await validate(schemas.film_post, req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send('Bad Request. Invalid information');
        return;
    }

    const title = req.body.title;
    const findTitle = await films.getFilmByTitle(title);
    if (findTitle.length !== 0) {
        res.status(403).send("Forbidden. Film title is not unique, or cannot release a film in the past");
        return;
    }
    const description = req.body.description;
    const genreId = req.body.genre_id;

    const currentDate = new Date();
    let releaseDate = null;
    Logger.info(releaseDate)
    if (req.body.releaseDate) {
        const dateString = req.body.releaseDate as string;
        const [dateComponents, _] = dateString.split('T');
        const dateComponent = dateComponents.split('/').join('-');

        releaseDate = new Date(dateComponent)
        Logger.info(releaseDate)
        if(releaseDate.getTime() < Date.now()) {
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
    let directorId = null;
    if (req.body.director_id) {
        directorId = req.body.director_id;
    }
    const ageRatings = ['G', 'PG', 'M', 'R13', 'R16', 'R18', 'TBC'];
    let ageRating = 'TBC';
    if (req.body.ageRating) {
        ageRating = req.body.ageRating;
        if (!(ageRating in ageRatings)) {
            res.status(400).send();
            return;
        }
    }

    try{
        const result = await films.addFilm(title, description, genreId, releaseDate, runtime, directorId, ageRating);
        res.status(201).send({"filmId":result});
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getOne = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editOne = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deleteOne = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getGenres = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {viewAll, getOne, addOne, editOne, deleteOne, getGenres};