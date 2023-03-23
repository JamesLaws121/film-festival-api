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

const register = async (req: Request, res: Response): Promise<number> => {
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
        return await bcrypt.hash(plainText, 10);
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
            res.status( 201 ).send( {"userId":result} );
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

    const user = await users.getUserByEmail(email);

    async function hashPassword(plainText : string) {
        return await bcrypt.hash(plainText, 10);
    }

    const hashedPassword = await hashPassword(password);

    if (user.length !== 0 && await bcrypt.compare(password, user[0].password)) {
        try {
            const token = await users.login(email, hashedPassword);
            await users.insertTokenByEmail(token, email);
            res.status(200).send({"userId":user[0].id, "token":token});
            return;
        } catch (err) {
            Logger.error(err);
            res.statusMessage = "Internal Server Error";
            res.status(500).send();
            return;
        }
    } else {
        res.status( 401 ).send('Not Authorised. Incorrect email/password');
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    Logger.http('Logout user')

    const id = req.body.authenticatedUserId;
    if (id == null){
        res.status( 401 ).send('Unauthorized');
        return;
    }

    try{
        await users.logout(parseInt(id, 10));
        res.status( 200 ).send('OK');
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

    const authenticatedId = req.body.authenticatedUserId;
    const id = req.params.id;

    try{
        const result = await users.getUser(parseInt(id, 10));
        const user = result[0];

        if( result.length === 0 ){
            res.status( 404 ).send('User not found');
        } else {
            if (authenticatedId !== null && authenticatedId.toString() === id.toString()) {
                res.status(200).send({"firstName": user.first_name, "lastName": user.last_name, "email": user.email});
            } else {
                res.status(200).send({"firstName": user.first_name, "lastName": user.last_name});
            }
        }
    } catch (err) {
        res.status( 500 ).send( `ERROR reading user ${id}: ${ err }` );
    }
};


const update = async (req: Request, res: Response): Promise<void> => {
    Logger.http(`Update user, id: ${req.params.id}`)

    const authenticatedId = req.body.authenticatedUserId;
    const id = req.params.id;

    if ((authenticatedId === null || authenticatedId.toString() !== id.toString())) {
        res.status( 403 ).send('Forbidden. This is not your account, or the email is already in use, or identical current and new passwords');
        return;
    }

    const currentValues = await users.getUser(parseInt(id, 10));
    if (currentValues.length === 0) {
        res.status( 404 ).send('Not Found');
        return;
    }
    const user = currentValues[0];
    let email = user.email;
    let firstName = user.first_name;
    let lastName = user.last_name;
    let password = user.password;

    if (req.body.password != null) {
        const newPassword = req.body.password;
        async function hashPassword(plainText : string) {
            return await bcrypt.hash(plainText, 10);
        }

        const hashedPassword = await hashPassword(newPassword);

        if(!(await bcrypt.compare(password, hashedPassword))) {
            res.status( 401 ).send('Unauthorized or Invalid currentPassword');
            return;
        } else {
            password = newPassword;
        }
    }

    try {
        email = req.body.email;
    } catch {
        email = email;
    }
    try {
        firstName = req.body.firstName;
    } catch {
        firstName = firstName;
    }
    try {
        lastName = req.body.lastName;
    } catch {
        lastName = lastName;
    }

    try{
        await users.alterUser(parseInt(id, 10), email, firstName, lastName, password);
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update}