import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'


const register = async (email : string, firstName : string, lastName : string, password : string): Promise<any> => {
    Logger.info(`Adding user ${firstName} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values ( ?, ?, ?, ?)';

    const [ result ] = await conn.query( query, [ email, firstName, lastName, password ] );
    await conn.release();
    return result;
}

const login = async (email : string, password : string): Promise<any> => {
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

const getUser = async (id: number) : Promise<User[]> => {
    Logger.info(`Getting user ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where id = ?';
    const [ rows ] = await conn.query( query, [ id ] );
    await conn.release();
    return rows;
};

const getUserByEmail = async (email: string) : Promise<User[]> => {
    Logger.info(`Getting user ${email} the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where email = ?';
    const [ rows ] = await conn.query( query, [ email ] );
    await conn.release();
    return rows;
};


const alter = async (): Promise<any> => {
    Logger.info(`Edit a users details`);
    return null;
}

export { login, logout, getUser, insert, alter, register, getUserByEmail}