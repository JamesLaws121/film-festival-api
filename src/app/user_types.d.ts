type User = {
    /**
     * User id as defined by the database
     */
    id: number,
    first_name : string,
    last_name : string,
    email : string,
    password : string,
    image_filename : string,
}

type Token = {
    token : string,
}