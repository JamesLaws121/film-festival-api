import {Request, Response} from "express";
import Logger from "../../config/logger";
import {getPool} from "../../config/db";


const getFilms = async (queryString : string, directorId : string, genreIds: string, ageRatings: string,
                        reviewerId: string, sortBy: string) : Promise<Film[]> => {
    Logger.info(`Getting films from the database`);

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
    Logger.info(`Getting all genre Ids from the database`);
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

const getGenres = async () : Promise<string[]> => {
    Logger.info(`Getting all genres from the database`);
    const conn = await getPool().getConnection();
    const query = 'select id as genreId, name from genre';
    const [ rows ] = await conn.query( query );
    await conn.release();
    return rows;
}

const addFilm = async (title: string, description: string, genreId: string,
                       releaseDate : Date, runtime : number,
                       directorId : number, ageRating : string,): Promise<any> => {
    Logger.info(`Adding film ${title} to the database`);
    const conn = await getPool().getConnection();
    const query = "insert into film (title, description, release_date, runtime, director_id, genre_id, age_rating) VALUES(?, ?, ?, ?, ?, ?, ? )";
    const [ result ] = await conn.query( query,
        [ title, description, releaseDate, runtime, directorId, genreId, ageRating ] );
    await conn.release();

    return result
}

const getFilmByTitle = async (title: string) : Promise<any> => {
    Logger.info(`Searching for film ${title}`);
    const conn = await getPool().getConnection();
    const query = 'select * from film where title = ?'
    const [ rows ] = await conn.query( query, [title]);
    await conn.release();
    return rows;
}
const getDirector = async (filmId : number) : Promise<any> => {
    Logger.info(`Searching for director from film ${filmId}`);
    const conn = await getPool().getConnection();
    const query = 'select director_id as directorId from film where id = ?'
    const rows  = await conn.query( query, [filmId]);
    await conn.release();
    return rows;
}

const getFilm = async (id : number) : Promise<Film[]> => {
    Logger.info(`Get film from the database`);
    const conn = await getPool().getConnection();

    const getAverage = "(select cast(cast(round(ifnull(avg(sub_film_review.rating), 0),2)as DECIMAL(9,6)) as float)  " +
        "from film as subFilm left join film_review as sub_film_review on subFilm.id = sub_film_review.film_id " +
        "where sub_film_review.film_id = film.id ) ";

    const getNumReviews = "(select count(*) from film as subFilm join film_review as sub_film_review on subFilm.id = sub_film_review.film_id " +
        "where sub_film_review.film_id = " + id + ") ";

    const query = "select film.id as filmId, film.title, film.description, film.genre_id as genreId, " +
        "film.director_id as directorId, " +
        "user.first_name as directorFirstName, " +
        "user.last_name as directorLastName, " +
        "film.release_date as releaseDate, " +
        "film.age_rating as ageRating, " +
        "film.runtime, " +
        getAverage + " as rating, " +
        getNumReviews + " as numReviews " +
        "from film " +
        "left join film_review on film.id = film_review.film_id left join user on film.director_id = user.id " +
        "where film.id = ? " +
        "group by film.id";


    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
};

const getFilmReviews = async (id : number) : Promise<Film[]> => {
    Logger.info(`Get film reviews for a film`);
    const conn = await getPool().getConnection();

    const query = "select user.id as reviewerId, film_review.rating, film_review.review, " +
        "user.first_name as reviewerFirstName, user.last_name as reviewerLastName, " +
        "film_review.timestamp " +
        "from film_review " +
        "join user on film_review.user_id = user.id " +
        "where film_review.film_id = ? " +
        "order by film_review.timestamp desc";

    const [ rows ] = await conn.query( query, [id] );
    await conn.release();
    return rows;
};

const addFilmReview = async (filmId : number, userId : number, rating : number, review : string) : Promise<Film[]> => {
    Logger.info(`Post film review for a film`);
    const conn = await getPool().getConnection();

    const query = "insert into film_review (film_id, user_id, rating, review) VALUES(?, ?, ?, ?)";

    const [ rows ] = await conn.query( query, [filmId, userId, rating, review] );
    await conn.release();
    return rows;
};

const alterFilm = async (id : number, title : string, description : string,
                         releaseDate : Date, genreId : number, runtime : number, ageRating : string) : Promise<Film[]> => {
    Logger.info(`Alter film from the database`);
    const conn = await getPool().getConnection();
    const query = 'update film set title = ?, description = ?, release_date = ?, genre_id = ?,' +
        ' runtime = ?, age_rating = ? where id = ?';

    const [ rows ] = await conn.query( query, [title, description, releaseDate, genreId, runtime, ageRating, id]);
    await conn.release();
    return rows;
};

const getFilmById = async (id : number) : Promise<Film[]> => {
    Logger.info(`Gettting film by Id`);
    const conn = await getPool().getConnection();
    const query = 'select title, description, release_date as releaseDate, runtime, director_id as directorId, ' +
        'genre_id as genreId, age_rating as ageRating from film where id = ?';

    const [ rows ] = await conn.query( query, [id]);
    await conn.release();
    return rows;
};

const deleteFilm = async (id : number) : Promise<number> => {
    Logger.info(`Delete film ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'delete from film where id = ?';

    const [ rows ] = await conn.query( query, [id]);
    await conn.release();
    return rows;
}

const getReviewsByFilm = async (filmId : number) : Promise<Film[]> => {
    Logger.info(`Getting reviews for a film`);
    const conn = await getPool().getConnection();
    const query = 'select * from film_review where film_id = ?';

    const [ rows ] = await conn.query( query, [filmId]);
    await conn.release();
    return rows;
};

const getImage = async (id : number) : Promise<Film[]> => {
    Logger.info(`Getting image for film`);
    const conn = await getPool().getConnection();
    const query = 'select image_filename as imageFilename from film where id = ?';

    const [ rows ] = await conn.query( query, [id]);
    await conn.release();
    return rows;
};

const saveImage = async (id : number, imageFilename: string) : Promise<Film[]> => {
    Logger.info(`Getting image for film`);
    const conn = await getPool().getConnection();
    const query = 'update film set image_filename = ? where id = ? ';

    const [ rows ] = await conn.query( query, [imageFilename, id]);
    await conn.release();
    return rows;
};



export { getFilms, getGenreIds, addFilm, getFilm, alterFilm, getFilmByTitle, getGenres, deleteFilm, getDirector,
    getFilmById, getReviewsByFilm, getImage, saveImage, getFilmReviews, addFilmReview}
