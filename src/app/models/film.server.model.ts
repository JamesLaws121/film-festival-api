import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


/*
    If director id not stated don't include user table
 */
const getFilms = async (queryString : string, directorId : string, genreIds: string, ageRatings: string,
                        reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database`);
    /*
    Logger.info(queryString);
    Logger.info(directorId);
    Logger.info(genreIds);
    Logger.info(ageRatings);
    Logger.info(reviewerId);
    Logger.info(sortBy);
    */

    if (queryString !== null) {
        queryString += "%' ";
    } else {
        queryString = "'";
    }

    const conn = await getPool().getConnection();

    const getAverage = "(select cast(cast(round(ifnull(avg(sub_film_review.rating), 0),2)as DECIMAL(9,6)) as float)  " +
        "from film as subFilm left join film_review as sub_film_review on subFilm.id = sub_film_review.film_id " +
        "where sub_film_review.film_id = film.id ) ";


    let query = "select film.id as filmId, film.title, film.genre_id as genreId, " +
        "film.director_id as directorId, " +
        "user.first_name as directorFirstName, " +
        "user.last_name as directorLastName, " +
        "film.release_date as releaseDate, " +
        "film.age_rating as ageRating, " +
        getAverage + " as rating " +
        "from film " +
        "left join film_review on film.id = film_review.film_id left join user on film.director_id = user.id " +
        "where ( title like '%" + queryString  + "or description like '%" + queryString  + ") " +
        "and age_rating in ( " + ageRatings + ") " +
        "and film.director_id = " + directorId + " " +
        "and film.genre_id in ( " + genreIds + ") ";

    if (reviewerId !== null) {
        query += "and film_review.user_id = " + reviewerId + " ";
    }

    query += "group by film.id order by " + sortBy;



    const [ rows ] = await conn.query( query, [sortBy]);

    return rows;
};


const getGenreIds = async () : Promise<string[]> => {
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

const getFilmRatingAvg = async (id : number) : Promise<number> => {
    Logger.info(`Alter film from the database`);
    const conn = await getPool().getConnection();
    const query = 'select * from film where id = ?';

    const [ rows ] = await conn.query( query, [id]);
    await conn.release();
    return rows;
}



export { getFilms, getGenreIds, getDirectorIds, addFilm, getFilm, alterFilm, getFilmRatingAvg  }
