import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2'
import { uid, suid } from 'rand-token';


const register = async (email : string, firstName : string, lastName : string, password : string): Promise<number> => {
    Logger.info(`Adding user ${firstName} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values ( ?, ?, ?, ?)';
    const [ result ] = await conn.query( query, [ email, firstName, lastName, password ] );
    await conn.release();

    return findUserIdByEmail(email);
}

const findByToken = async (token: string): Promise<User[]> => {
    Logger.info('Checks if a token already exists in the database');
    const conn = await getPool().getConnection();

    const query = 'select * from user where auth_token = ?';
    const [ rows ] = await conn.query( query, [ token ] );
    await conn.release();
    return rows;
}
const login = async (email : string, password : string): Promise<string> => {
    Logger.info(`Logging in as existing user`);
    const conn = await getPool().getConnection();
    let token = uid(12);
    while ( (await findByToken(token)).length !== 0 ) {
        token = uid(12);
    }

    await conn.release();
    return token;
}

const logout = async (id: number): Promise<any> => {
    Logger.info(`Logging out`);
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = null where id = ? ';

    const [ result ] = await conn.query( query, [  id ] );
    await conn.release();
    return result;
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
    Logger.info(`Getting user ${email} from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from user where email = ?';
    const [ rows ] = await conn.query( query, [ email ] );
    await conn.release();
    return rows;
};


const alterUser = async (id : number, email : string, firstName : string, lastName : string, password : string): Promise<any> => {
    Logger.info(`Edit a users details`);

    const conn = await getPool().getConnection();

    const query = 'update user set email = ?, first_name = ?, last_name = ?, password = ? where id = ?';

    const [ result ] = await conn.query( query, [email, firstName, lastName, password, id] );
    await conn.release();
    return result;

}

const findUserByToken = async (token: string) : Promise<User[]> => {
    Logger.info('Getting user id from token');
    const conn = await getPool().getConnection();
    const query = 'select * from user where auth_token = ?';
    const [ id ] = await conn.query( query, [ token ] );
    await conn.release();
    return id;
}

const findUserIdByEmail = async (email: string) : Promise<number> => {
    Logger.info('Getting user id from token');
    const conn = await getPool().getConnection();
    const query = 'select id from user where email = ?';
    const id = await conn.query( query, [ email ] );
    await conn.release();
    return id[0][0].id;
}

const insertTokenByEmail = async (token: string, email: string) : Promise<any> => {
    Logger.info('Creating a token for a user');
    const conn = await getPool().getConnection();
    const query = 'update user set auth_token = ? where email = ? ';

    const [ result ] = await conn.query( query, [ token, email ] );
    await conn.release();
    return result;
}

const saveImage = async (id: number, imageFilename: string) : Promise<any> => {
    Logger.info('Saving user image');
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = ? where id = ? ';

    const [ result ] = await conn.query( query, [ imageFilename, id ] );
    await conn.release();
    return result;
}

const getImage = async (id: number) : Promise<any> => {
    Logger.info('Getting user image');
    const conn = await getPool().getConnection();
    const query = 'select image_filename from user where id = ?';

    const result = await conn.query( query, [  id ] );
    await conn.release();
    return result;
}

const deleteImage = async (id: number) : Promise<any> => {
    Logger.info('Deleting a user image');
    const conn = await getPool().getConnection();
    const query = 'update user set image_filename = null where id = ? ';

    const [ result ] = await conn.query( query, [ id ] );
    await conn.release();
    return result;
}


export { login, logout, getUser, insert, alterUser, register, getUserByEmail, findUserByToken,
    insertTokenByEmail, findUserIdByEmail, saveImage, getImage, deleteImage}