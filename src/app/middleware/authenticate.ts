import {findUserByToken} from "../models/user.server.model";
import Logger from "../../config/logger";
import {Request, Response} from "express";
import util from "node:util"
import logger from "../../config/logger";

const loginRequired = async (req: Request, res: Response, next: () => void) => {
    const token = req.header('X-Authorization')
    req.body.authenticatedUserId = null;

    if (token == null){
        next();
        return;
    }

    try {
        const result = await findUserByToken(token);
        if (result.length !== 0) {
            req.body.authenticatedUserId = result[0].id;
        }
        next();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {loginRequired}