import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


const getFilms = async (queryString : string, directorId: string, genreIds: string,
                        ageRatings: string, reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database`);
    Logger.info(sortBy);
    const conn = await getPool().getConnection();
    const query = "select * from film " +
        "where title like '%?%' and description like '%?%' and director_id = " + directorId +
        " and age_rating in ( " + ageRatings + ") " +
        " order by " + sortBy + " ASC";
    Logger.info( query)
    const [ rows ] = await conn.query( query, [queryString, queryString, sortBy]);
    await conn.release();
    return rows;
};

const getGenreIds = async () : Promise<number[]> => {
    Logger.info(`Getting all genres from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id from genre';
    const [ rows ] = await conn.query( query);
    await conn.release();
    const genres = [];
    for (const row of rows) {
        genres.push(row.id)
    }
    return genres;
};

const getDirectorIds = async () : Promise<string> => {
    Logger.info(`Getting all director ids from the database`);
    const conn = await getPool().getConnection();
    const query = 'select director_id from film';
    const [ rows ] = await conn.query( query);
    await conn.release();
    const directors = [];
    let stringDirectors = "";
    for (const row of rows) {
        if (!(row.director_id in directors)) {
            directors.push(row.director_id)
            stringDirectors += `'${row.director_id}' ,`;
        }

    }
    return stringDirectors;
};



export { getFilms, getGenreIds, getDirectorIds }