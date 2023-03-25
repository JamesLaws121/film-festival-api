import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.server.model";



const viewAll = async (req: Request, res: Response): Promise<any> => {

    let startIndex = 0;
    let count = 0;
    let query = "";
    let directorId = "director_id";
    let genreIds = await films.getGenreIds();
    let ageRating = [ 'G', 'PG', 'M', 'R13', 'R16', 'R18', 'TBC'];
    let reviewerId = "id";
    let sortBy = "RELEASED_ASC"

    if ((req.body.startIndex)) {
        startIndex = req.body.startIndex;
    }
    if ((req.body.count)) {
        count = req.body.count;
    }
    if ((req.body.q)) {
        query = req.body.q;
    }
    if ((req.body.directorId)) {
        directorId = req.body.directorId;
    }
    if ((req.body.genreIds)) {
        genreIds = req.body.genreIds;
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
        let results = await films.getFilms(query, directorId, genreIds, ageRating, reviewerId, sortBy);
        if (startIndex + count > results.length){
            res.status(400).send("Bad Request");
        } else {
            results = results.slice(startIndex, count + startIndex);
        }
        res.status(200).send("OK");
        return {"films" : results , "count" : count};
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