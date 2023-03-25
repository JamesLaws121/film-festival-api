import {findUserIdByToken} from "../models/user.server.model";
import Logger from "../../config/logger";
import {Request, Response} from "express";
import util from "node:util"

const loginRequired = async (req: Request, res: Response, next: () => void) => {
    const token = req.header('X-Authorization')
    req.body.authenticatedUserId = null;

    if (token == null){
        next();
    }

    try {
        const result = await findUserIdByToken(token);

        if (result[0].length !== 0) {
            req.body.authenticatedUserId = result[0][0].id;
        }
        next();

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
    }
}

export {loginRequired}