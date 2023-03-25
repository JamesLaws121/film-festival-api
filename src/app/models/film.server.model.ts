import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


const getFilms = async (queryString : string, directorId: string, genreIds: number[],
                        ageRatings: string[], reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from film ' +
        'INNER JOIN film_review ON film.reviewerId=film_review.id' +
        'where title like %?% description like %?% director_id = ? genre_id in ? age_rating in ? order by ?';
    const [ rows ] = await conn.query( query, [queryString, queryString, directorId, genreIds, ageRatings, sortBy]);
    await conn.release();
    return rows;
};

const getGenreIds = async () : Promise<number[]> => {
    Logger.info(`Getting all genres from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id from genre';
    const [ rows ] = await conn.query( query);
    await conn.release();
    return rows;
};



export { getFilms,getGenreIds }