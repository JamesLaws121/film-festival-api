import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.server.model";
import Query from "mysql2/typings/mysql/lib/protocol/sequences/Query";



const viewAll = async (req: Request, res: Response): Promise<any> => {

    let startIndex = 0;
    let count = null;
    let qQuery = " ";
    let directorId = null;
    let genreIds = (await films.getGenreIds()).toString();
    let ageRating = "'G', 'PG', 'M', 'R13', 'R16', 'R18', 'TBC'";
    let reviewerId = "id";
    let sortBy = "release_date"

    if ((req.params.startIndex)) {
        startIndex = parseInt(req.params.startIndex, 10);
    }
    if ((req.params.count)) {
        count = parseInt(req.params.count, 10);
    }
    if ((req.params.q)) {
        qQuery = req.params.q;
    }
    if ((req.params.directorId)) {
        directorId = req.params.directorId;
        Logger.info("here");
        Logger.info(directorId);
    }
    if ((req.params.genreIds)) {
        genreIds =  req.params['genreIds[]'][0]
    }
    if ((req.body.ageRating)) {
        ageRating = req.body.ageRating;
    }
    if ((req.body.reviewerId)) {
        reviewerId = req.body.reviewerId;
    }
    if ((req.body.sortBy)) {
        sortBy = req.body.sortBy;
    }
    try{
        // Logger.info(query);
        // Logger.info("Director ids" + directorId.toString());
        // Logger.info(genreIds.toString());
        // Logger.info(ageRating.toString());
        // Logger.info(reviewerId);
        // Logger.info(sortBy);

        let results;
        if (directorId !== null){
            results = await films.getFilmsWithDirector(qQuery, directorId, genreIds, ageRating, reviewerId, sortBy);

        } else {
            results = await films.getFilms(qQuery, genreIds, ageRating, reviewerId, sortBy);
        }
        if (count !== null) {
            if (startIndex + count > results.length) {
                res.status(400).send("Bad Request");
            }
        } else {
            count = results.length;
            Logger.info(count);
        }
        res.status(200).send({"films" : results , "count" : count});
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

const addOne = async (req: Request, res: Response): Promise<void> => {
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