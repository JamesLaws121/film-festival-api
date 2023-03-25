import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


/*
    If director id not stated don't include user table
 */
const getFilms = async (queryString : string, genreIds: number[], ageRatings: string[],
                        reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from film ' +
        'where title like %?% description like %?% ' +
        'genre_id in ? ' +
        'age_rating in ? ' +
        'order by ?';
    const [ rows ] = await conn.query( query, [queryString, queryString, genreIds, ageRatings, sortBy]);
    await conn.release();
    return rows;
};

/*
SELECT film.id as filmId, film.title, film.genre_id as genreId, film.age_rating as ageRating, film.director_id as directorId, user.first_name as directorFirstName, user.last_name as directorLastName, film_review.rating, film.release_date as releaseDate
FROM film, film_review, user
WHERE film.director_id = user.id and film.id = film_review.film_id
 */

/*
    If a director is given the user table must also be joined
 */
const getFilmsWithDirector = async (queryString : string, directorId: string, genreIds: number[],
                        ageRatings: string[], reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database with director`);
    const conn = await getPool().getConnection();
    const query = 'select film.id as filmId, film.title, film.genre_id as genreId, ' +
        'film.age_rating as ageRating, film.director_id as directorId, ' +
        'user.first_name as directorFirstName, user.last_name as directorLastName, ' +
        'film_review.rating, film.release_date as releaseDate from film ' +
        'WHERE film.director_id = user.id and film.id = film_review.film_id ' +
        'and title like %?% description like %?% ' +
        'director_id =  ' + directorId + ' ' +
        'genre_id in ( ? )  ' +
        'age_rating in ( ? ) ' +
        'film_review.id = ' + reviewerId + ' ' +
        'order by ?';
    const [ rows ] = await conn.query( query, [queryString, queryString, genreIds, ageRatings, sortBy]);
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

const addFilm = async (title: string, description: string, genreId: string,
                       releaseDate : Date, imageFilename : string, runtime : number,
                       directorId : number, ageRating : string,): Promise<any> => {
    Logger.info(`Adding film ${title} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into film  values ( ?, ?, ?, ?, ?, ?, ?, ?)';
    const [ result ] = await conn.query( query,
        [ title, description, releaseDate, imageFilename, runtime, directorId, genreId, ageRating ] );
    await conn.release();

    return result
}

const getFilm = async (id : number) : Promise<Film[]> => {
    Logger.info(`Get film from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from film where id = ?'
    const [ rows ] = await conn.query( query, [id]);
    await conn.release();
    return rows;
};

const alterFilm = async (id : number) : Promise<Film[]> => {
    Logger.info(`Alter film from the database`);
    const conn = await getPool().getConnection();
    const query = 'update film set title = ?, description = ?, where id = ?';

    const [ rows ] = await conn.query( query, [id]);
    await conn.release();
    return rows;
};


export { getFilms, getGenreIds, getFilmsWithDirector, addFilm, getFilm, alterFilm }