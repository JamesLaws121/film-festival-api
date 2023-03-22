import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.server.model';
import * as schemas from '../resources/schemas.json';
import Ajv from 'ajv';
import bcrypt from 'bcrypt';

const ajv = new Ajv({removeAdditional: 'all', strict: false});
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

const validateEmail = async (email : string) => {
    const emailRegex = new RegExp('.+@.+[.].+');
    return emailRegex.test(email)
}

const register = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`Register user`)

    const validation = await validate(
        schemas.user_register,
        req.body);
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send('Bad Request. Invalid information');
        return;
    }

    const email = req.body.email;
    if (!(await validateEmail(email))) {
        res.statusMessage = 'Bad Request: invalid email';
        res.status( 400 ).send('Bad Request. Invalid information');
        return;
    }
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const password = req.body.password;
    async function hashPassword(plainText : string) {
        return await bcrypt.hash(password, 10);
    }

    const hashedPassword = await hashPassword(password);

    try{
        const exists = await users.getUserByEmail(email);
        if (exists.length !== 0 ) {
            res.status( 403 ).send('Forbidden. Email already in use');
            return;
        }
        const result = await users.register(email, firstName, lastName, hashedPassword);
        if( result === 400 ){
            res.status( 400 ).send('Bad Request. Invalid information');
        }  else {
            res.status( 201 ).send('Created');
        }
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Login user')

    const validation = await validate(
        schemas.user_login,
        req.body);

    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`;
        res.status(400).send();
        return;
    }

    const email = req.body.email;
    const password = req.body.password;

    try{
        const result = await users.login(email, password);
        if( result === 400 ){
            res.status( 400 ).send('Bad Request. Invalid information');
        } else if( result === 401 ){
            res.status( 401 ).send('Not Authorised. Incorrect email/password');
        } else {
            res.status( 200 ).send('OK');
        }
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        const result = await users.logout();
        if( result === 401 ){
            res.status( 401 ).send('Unauthorized. Cannot log out if you are not authenticated');
        } else {
            res.status( 200 ).send('OK');
        }
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const view = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`GET single user, id: ${req.params.id}`)
    const id = req.params.id;
    try{
        const result = await users.getUser( parseInt(id, 10) );
        if( result.length === 0 ){
            res.status( 404 ).send('User not found');
        } else {
            res.status( 200 ).send( result[0] );
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR reading user ${id}: ${ err }` );
    }
};


const update = async (req: Request, res: Response): Promise<void> => {
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

export {register, login, logout, view, update}