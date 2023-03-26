type User = {
    /**
     * User as defined by the database
     */
    id: number,
    first_name : string,
    last_name : string,
    email : string,
    password : string,
    image_filename : string,
}

type Film = {
    /**
     * Film as defined by the database
     */
    filmId: number,
    title : string,
    description : string,
    releaseDate : Date,
    imageFilename : string,
    runtime : number,
    directorId : number,
    genreId : number,
    ageRating : string,
}

type Genre = {
    /**
     * Genre as defined by the database
     */
    id: number,
    name : string,
}

type FilmReview = {
    /**
     * Film as defined by the database
     */
    id: number,
    film_id : number,
    user_id : number,
    rating : number,
    review : string,
    timestamp : Date,
}