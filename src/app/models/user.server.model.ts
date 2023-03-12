import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'

const login = async (): Promise<any> => {
    Logger.info(`Logging in as existing user`);
    return null;
}

const logout = async (): Promise<any> => {
    Logger.info(`Logging out`);
    return null;
}

const insert = async (): Promise<any> => {
    Logger.info(`Adding user to the database`);
    return null;
}

const getOne = async (): Promise<any> => {
    Logger.info(`Get info on user`);
    return null;
}

const alter = async (): Promise<any> => {
    Logger.info(`Edit a users details`);
    return null;
}

export { login, logout, getOne, insert, alter }