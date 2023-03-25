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
    id: number,
    title : string,
    description : string,
    release_date : Date,
    image_filename : string,
    runtime : number,
    director_id : number,
    genre_id : number,
    age_rating : string,
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