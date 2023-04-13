import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as films from "../models/film.server.model";
import fs from "fs";
import * as users from "../models/user.server.model";


const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`Get image from film, id: ${req.params.id}`)
        const id = req.params.id;
        const result = await films.getImage(parseInt(id, 10));
        if (result.length === 0) {
            res.status( 404 ).send('Not found. No film found with id, or film has no image');
            return;
        }
        const fileName = result[0].imageFilename;
        const filePath = "./storage/images/" + fileName;

        fs.readFile(filePath,
            {encoding:'base64', flag:'r'},
            (err, data) => {
                if(err) {
                    Logger.error("Photo not found");
                    res.status(500).send("Internal Server Error");
                    return;
                } else {
                    res.status(200).sendFile(filePath, { root: '.' });
                    return;
                }
            });
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
    Logger.info("Set film image");
    try{
        const filmId = req.params.id;
        const imageType = req.header('Content-Type')

        const image = req.body;

        let imageName = `film_${filmId}`;

        const directorId = req.body.authenticatedUserId;
        if (directorId == null){
            res.status( 401 ).send('Unauthorized');
            return;
        }

        const foundFilms = await films.getFilmById(parseInt(filmId, 10));

        if (foundFilms.length === 0) {
            res.status(404).send('Not Found. No film found with id');
            return;
        }

        let filmDirector = await films.getDirector(parseInt(filmId, 10));
        filmDirector = filmDirector[0][0].directorId;

        if (directorId !== filmDirector) {
            res.status(403).send('Forbidden. Only the director of a film can change the hero image');
            return;
        }

        if (imageType === "image/jpeg") {
            imageName += '.jpg';
        } else if (imageType === "image/png"){
            imageName += '.png';
        } else if (imageType === "image/gif"){
            imageName += '.gif';
        } else {
            res.status( 400 ).send('Bad Request');
            return;
        }

        fs.writeFile(`./storage/images/${imageName}`, image, {encoding: 'base64'}, (err) => {
            if (err) {
                Logger.info(err);
                res.statusMessage = "Internal Server Error";
                res.status(500).send();
                return;
            } else {
                Logger.info("File written successfully");
            }
        });


        const photoFound = await films.getImage(parseInt(filmId, 10));

        if ( photoFound.length === 0 ){
            await films.saveImage(parseInt(filmId, 10), imageName);
            res.status(201).send("Created.");
            return;
        } else {
            await films.saveImage(parseInt(filmId, 10), imageName);
            res.status(200).send("OK");
            return;
        }
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage};