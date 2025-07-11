export const DATS_TOKEN = "b3f7c324-86f6-4e61-8f11-fd5f8226c202";
// export const MONGO_URL =
// "mongodb://gen_user:mongodbpassword@5.44.47.194:27017/default_db?authSource=admin&directConnection=true";

export const MONGODB_HOST = "5.44.47.194";
export const MONGODB_PORT = 27017;
export const MONGODB_USERNAME = "gen_user";
export const MONGODB_PASSWORD = "mongodbpassword";
export const MONGODB_DBNAME = "default_db";

export const MONGO_URL = `mongodb://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DBNAME}?authSource=admin&directConnection=true`;
