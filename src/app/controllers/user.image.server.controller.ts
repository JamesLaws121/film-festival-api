import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from "../models/user.server.model";
import * as fs from "fs";
import { Buffer } from 'buffer';
import {info} from "winston";


const getImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`Get image from user, id: ${req.params.id}`)
    const id = req.params.id;
    try{
        const result = await users.getImage(parseInt(id, 10));
        const fileName = result[0][0].image_filename;
        const filePath = "./storage/images/" + fileName;

        if (!fileName) {
            res.status( 404 ).send('Not Found. No user with specified ID, or user has no image');
            return;
        }

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
    Logger.http(`Save image for user, id: ${req.params.id}`)
    const id = req.params.id;
    const imageType = req.header('Content-Type')
    const image = req.body;

    let imageName = `user_${id}`;

    const authenticatedId = req.body.authenticatedUserId;
    if (authenticatedId == null){
        res.status( 401 ).send('Unauthorized');
        return;
    }
    if (authenticatedId.toString() !== id.toString()){
        res.status( 403 ).send('Forbidden. Can not change another user\'s profile photo');
        return;
    }

    try{
        const result = await users.getUser(parseInt(id, 10));

        if( result.length === 0 ){
            res.status( 404 ).send('Not found. No such user with ID given');
            return;
        }
        if (imageType === "image/jpeg") {
            imageName += '.jpg';
        } else if (imageType === "image/png"){
            imageName += '.png';
        } else if (imageType === "image/gif"){
            imageName += '.gif';
        } else {
            res.status( 400 ).send('Bad Request. Invalid image supplied (possibly incorrect file type)');
            return;
        }

        fs.writeFile(`./storage/images/${imageName}`, image, {encoding: 'base64'}, (err) => {
            if (err) {
                Logger.info(err);
            } else {
                Logger.info("File written successfully");
            }
        });

        const photoFound = await users.getImage(parseInt(id, 10));

        if ( photoFound.length === 0 ){
            await users.saveImage(parseInt(id, 10), imageName);
            res.status(201).send("Created. New image created");
            return;
        } else {
            await users.saveImage(parseInt(id, 10), imageName);
            res.status(201).send("OK. Image updated");
            return;
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const deleteImage = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`Delete image from user, id: ${req.params.id}`)
    const id = req.params.id;

    const authenticatedId = req.body.authenticatedUserId;
    if (authenticatedId == null){
        res.status( 401 ).send('Unauthorized');
        return;
    }
    if (authenticatedId.toString() !== id.toString()){
        res.status( 403 ).send('Forbidden. Can not change another user\'s profile photo');
        return;
    }

    const result = await users.getImage(parseInt(id, 10));
    const filePath = "./storage/images/" + result[0][0].image_filename;

    if (!filePath) {
        res.status( 404 ).send('Not Found. No user with specified ID, or user has no image');
        return;
    }

    try{
        fs.unlink(filePath, (err => {
            if (err) {
                Logger.error(err);
                res.status(500).send("Internal Server Error");
                return;
            }
            else {
                res.status(200).send("OK");
                return;
            }
        }));

        await users.deleteImage(parseInt(id, 10));
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getImage, setImage, deleteImage}