const mongoose = require('mongoose')
const uri = process.env.mongoIp

const { User } = require('./models/index')

const dbOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: false,
    // poolSize: 5,
    connectTimeoutMS: 10000,
    family: 4,
};
function init()  {
    mongoose.connect(uri, dbOptions)

    mongoose.Promise = global.Promise;

    mongoose.connection.on('connected', () => {
        console.log('Mongoose has successfully connected!');
    });

    mongoose.connection.on('err', err => {
        console.log(`Mongoose connection error: \n${err.stack}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose connection lost');
    });


}

const mockData = {
    userId: "123456789",
    badge: "123456789",
    name: "123456789",
}

const connection = init()

const getConnection = () => connection
const getClient = () => client



async function create(dat) {
    const data = await User.findOne({ userId: dat.userId })
    if (data) return data;
    else return await new User(dat).save()
}

async function read(query) {
    const data = await User.findOne({ userId: query })
    if (data) return data;
    else return false;

}

async function del(query) {
    await User.findOneAndRemove({ userId: query })
    return true
}

module.exports = { getConnection, getClient, create, read, del }

if( require.main === module ) {
    switch (process.argv[2]) {
        case "--read": case "-r":
            read(process.argv[3], process.argv[4]).then(res => {console.log(res); process.exit(1)});
            break;
        case "--create": case "-c":
            create(JSON.parse(process.argv[3])).then(res => {console.log(res); process.exit(1)});
            break;
        case "--delete": case "--del": case "-d":
            del(process.argv[3]).then(res => {console.log(res); process.exit(1)});
            break;
    }
}