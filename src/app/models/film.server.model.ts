import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


/*
    If director id not stated don't include user table
 */
const getFilms = async (queryString : string, genreIds: string, ageRatings: string,
                        reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database`);
    const conn = await getPool().getConnection();
    const query = "select * from film " +
        "where title like '%?%' and description like '%?%'" +
        " and age_rating in ( " + ageRatings + ") " +
        " order by " + sortBy;
    Logger.info( query)
    const [ rows ] = await conn.query( query, [queryString, queryString, sortBy]);

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
const getFilmsWithDirector = async (queryString : string, directorId: string, genreIds: string,
                        ageRatings: string, reviewerId: string, sortBy: string) : Promise<Film[]> => {
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


export { getFilms, getGenreIds, getDirectorIds, getFilmsWithDirector, addFilm, getFilm, alterFilm  }
